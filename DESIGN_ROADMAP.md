# Happiness Admin — 디자인 리팩토링 로드맵

> 기존 기능을 절대 훼손하지 않는다. 각 Phase는 독립적으로 완결되어야 하며, 이전 Phase 결과물을 기반으로 다음 Phase를 진행한다.

---

## 전체 Phase 구성

| Phase | 이름 | 예상 소요 | 우선순위 |
|---|---|---|---|
| Phase 0 | 데드 코드 정리 & CSS 중복 제거 | 반나절 | P0 |
| Phase 1 | 안전성 기반 — 파괴적 액션 보호 | 1~2일 | P0 |
| Phase 2 | 디자인 토큰 & 타이포그래피 통일 | 1일 | P1 |
| Phase 3 | 아이콘 & 폰트 교체 | 반나절 | P1 |
| Phase 4 | Toast & 피드백 시스템 | 1일 | P1 |
| Phase 5 | 대시보드 & 로그인 UX 개선 | 1일 | P1 |
| Phase 6 | 목록 페이지 기능 보강 (백엔드 포함) | 2~3일 | P2 |
| Phase 7 | 반응형 레이아웃 & Header 통합 | 2일 | P2 |
| Phase 8 | 통계 페이지 강화 | 1~2일 | P2 |
| Phase 9 | 다크모드 & 테마 | 2~3일 | P3 |
| Phase 10 | 고급 기능 확장 | 3~5일 | P3 |

---

## Phase 0 — 데드 코드 정리 & CSS 중복 제거

> **목표**: 현재 사용되지 않는 파일 정리, CSS 중복 선언 제거 — 이후 Phase의 기반 정비

### 검증으로 발견된 문제

| 파일 | 문제 |
|---|---|
| `src/components/layout/Header.jsx` | `AdminLayout.jsx`에 포함되지 않아 완전한 데드 코드. `#1976d2` 파란 배경에 `/dashboard`, `/users`, `/settings` 링크를 가지는데 이 라우트들은 `App.jsx`에 없음 |
| `src/pages/HomePage.jsx` | `App.jsx` 라우팅에 없는 고아 파일 (`/api/admin/hello` 호출) |
| `src/hooks/useFetchAPI.js` | `HomePage.jsx`에서만 사용되는 훅 — HomePage가 사용되지 않으므로 함께 고아 상태 |
| `src/pages/DashboardPage.css` | `.page-title`, `.badge`, `.badge-*`, `.data-table` 등이 `global.css`와 중복 선언 |

### 구현 프롬프트

```
[Phase 0] 데드 코드 정리 및 CSS 중복 제거

현재 상황:
- Header.jsx는 AdminLayout.jsx에 import되지 않아 화면에 전혀 렌더링되지 않음
  (파란 배경의 낡은 네비게이션으로, 현재 앱 라우팅과 완전히 불일치)
- HomePage.jsx는 App.jsx 라우팅에 등록되지 않아 접근 불가
- useFetchAPI.js는 HomePage.jsx에서만 사용되므로 함께 미사용 상태
- DashboardPage.css가 global.css에 이미 있는 클래스를 중복 선언 중

작업 목표:
1. 아래 파일 삭제 (git rm):
   - frontend/src/components/layout/Header.jsx
   - frontend/src/components/layout/Header.css
   - frontend/src/pages/HomePage.jsx
   - frontend/src/pages/HomePage.css
   - frontend/src/hooks/useFetchAPI.js

2. DashboardPage.css에서 global.css와 중복되는 선언 제거:
   삭제 대상 클래스 (global.css에 이미 존재):
   - .page-title
   - .page-loading
   - .data-table (및 th, td, tr 하위 선택자)
   - .badge, .badge-green, .badge-red, .badge-blue, .badge-yellow, .badge-purple
   
   DashboardPage 고유 클래스는 유지:
   - .dashboard-page, .stat-grid, .stat-card, .stat-icon, .stat-value, .stat-label
   - .dashboard-grid, .dashboard-card, .card-title
   - .top-photos-list, .top-photo-item, .rank, .photo-thumb, .photo-title, .photo-meta

3. AdminLayout.jsx는 Header 관련 import가 없으므로 변경 불필요
   (이미 Sidebar만 사용 중 — 현재 구조가 올바름)

주의사항:
- Header.jsx 삭제 후 AdminLayout.jsx, App.jsx에 Header import가 없는지 확인
- DashboardPage.jsx는 변경 없음 (클래스명 그대로 사용)
- 삭제 전 git status로 파일 목록 확인

완료 기준:
- npm run build 성공
- 대시보드 화면에서 badge, table 스타일 유지 확인 (global.css에서 적용 중)
- git status에 삭제된 파일 5개 표시
```

---

## Phase 1 — 안전성 기반: 파괴적 액션 보호

> **목표**: `window.confirm()` 제거, 커스텀 ConfirmDialog 도입, 역할 변경 즉시 반영 방지

### 우선순위 근거

현재 코드에서 `window.confirm()`이 4곳에서 사용되고, 역할 변경이 `onChange` 즉시 PATCH로 날아간다. 확인 없이 회원 삭제·역할 변경이 발생할 수 있어 운영 리스크가 가장 크다.

### 구현 프롬프트

```
[Phase 1] ConfirmDialog 컴포넌트 도입 및 위험 액션 보호

현재 상황:
- MemberListPage.jsx, PhotoListPage.jsx, InquiryListPage.jsx, SeriesListPage.jsx
  에서 window.confirm()을 사용하고 있다
- MemberListPage.jsx의 역할 변경이 select onChange 즉시 patchApi를 호출한다
  (확인 다이얼로그 없음 → 실수로 권한 변경 가능)

작업 목표:
1. frontend/src/components/common/ConfirmDialog.jsx 신규 생성
   - props: open, title, description, variant('danger'|'warning'), onConfirm, onCancel
   - 반드시 React Portal로 렌더링 (body에 마운트)
   - 오버레이 클릭 시 onCancel 호출
   - ESC 키 누를 시 onCancel 호출 (useEffect로 keydown 이벤트 리스너)
   - variant='danger'일 때 확인 버튼: 빨간 배경 (#ef4444)
   - variant='warning'일 때 확인 버튼: 노란 배경 (#f59e0b)
   - 취소 버튼은 항상 회색 ghost 스타일

2. frontend/src/context/ConfirmContext.jsx 신규 생성
   - confirm({ title, description, variant }) → Promise<boolean> 반환
   - ConfirmProvider 내부에서 ConfirmDialog를 렌더링
   - useConfirm() 훅으로 confirm 함수 제공

3. App.jsx 수정 — ConfirmProvider를 AuthProvider 내부에 추가:
   <BrowserRouter>
     <AuthProvider>
       <ConfirmProvider>
         <AppRoutes />
       </ConfirmProvider>
     </AuthProvider>
   </BrowserRouter>

4. 기존 window.confirm() 호출 전체 교체:
   - MemberListPage.jsx → handleDelete: useConfirm() 사용
   - PhotoListPage.jsx  → handleDelete: useConfirm() 사용
   - InquiryListPage.jsx → handleDelete: useConfirm() 사용
   - SeriesListPage.jsx → handleDelete: useConfirm() 사용

5. MemberListPage.jsx 역할 변경 UX 개선:
   - role-select의 onChange에서 즉시 patchApi 호출 방식 유지하되,
     confirm({ title: '역할 변경', description: `"${name}"의 역할을 ${newAuthority}(으)로 변경하시겠습니까?`, variant: 'warning' })
     awaiting 후 false면 select를 원래 값으로 되돌림

주의사항:
- 기존 삭제/변경 로직(API 호출, fetchData)은 그대로 유지
- CSS는 전용 ConfirmDialog.css 파일로 분리
- 모달 열린 상태에서 body overflow:hidden 처리 (스크롤 잠금)
- 역할 select를 원래 값으로 되돌리려면 e.target.value를 임시 저장 필요

완료 기준:
- npm run build 성공
- 회원 삭제 클릭 시 커스텀 다이얼로그 표시 확인
- 취소 클릭 시 아무 변경 없이 닫힘 확인
- ESC / 오버레이 클릭으로도 닫힘 확인
- 역할 변경 취소 시 select가 이전 값으로 복원 확인
```

---

## Phase 2 — 디자인 토큰 & 타이포그래피 통일

> **목표**: CSS Custom Properties 도입, 모든 하드코딩 색상을 변수 참조로 교체

### 우선순위 근거

이후 모든 Phase의 기반 작업. 이 작업 없이는 테마 변경, 다크모드가 불가능하다. 기능 변경 없이 CSS만 정리하므로 리스크가 낮다.

### 구현 프롬프트

```
[Phase 2] CSS Design Token 시스템 도입

현재 상황:
- 색상이 각 CSS 파일에 하드코딩: #6366f1, #1e2130, #e2e8f0, #94a3b8 등
- 동일한 색상이 여러 파일에 중복 정의되어 있어 변경 시 누락 위험

작업 목표:
1. frontend/src/styles/tokens.css 신규 생성:

:root {
  /* Brand */
  --color-brand-50:  #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-400: #818cf8;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;

  /* Semantic */
  --color-success:    #22c55e;
  --color-success-bg: #dcfce7;
  --color-success-text: #16a34a;
  --color-warning:    #f59e0b;
  --color-warning-bg: #fffbeb;
  --color-warning-text: #d97706;
  --color-danger:     #ef4444;
  --color-danger-bg:  #fef2f2;
  --color-danger-text: #dc2626;
  --color-info:       #06b6d4;
  --color-info-bg:    #ecfeff;

  /* Neutral */
  --color-bg:          #f1f5f9;
  --color-surface:     #ffffff;
  --color-surface-2:   #f8fafc;
  --color-border:      #e2e8f0;
  --color-border-light:#f1f5f9;

  /* Text */
  --color-text-primary:   #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary:  #94a3b8;
  --color-text-muted:     #64748b;
  --color-text-inverse:   #ffffff;

  /* Sidebar */
  --color-sidebar-bg:          #0f172a;
  --color-sidebar-hover:       #1e293b;
  --color-sidebar-border:      #1e293b;
  --color-sidebar-text:        #94a3b8;
  --color-sidebar-active-text: #818cf8;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-lg: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-xl: 0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05);

  /* Radius */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Font */
  --font-sans: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 14px;
  --text-md:   15px;
  --text-lg:   18px;
  --text-xl:   22px;
  --text-2xl:  28px;
}

2. global.css 상단에 @import './tokens.css'; 추가

3. 아래 파일들의 하드코딩 색상값을 var() 참조로 일괄 교체:
   - global.css (body background, badge 색상, filter/search 스타일)
   - Sidebar.css
   - AdminLayout.css
   - LoginPage.css
   - DashboardPage.css (Phase 0 중복 제거 후 남은 클래스만)
   - Pagination.css
   (나머지 페이지 CSS는 점진적으로)

4. body의 font-family를 var(--font-sans)로 교체

주의사항:
- 색상값 교체 시 시각적으로 동일하게 유지 (색상 변경 아님, 참조 방식 변경)
- global.css에서 badge 색상을 토큰 참조로 변환 시
  .badge-green → background: var(--color-success-bg); color: var(--color-success-text);
  .badge-red   → background: var(--color-danger-bg);  color: var(--color-danger-text);
  등으로 변환
- Phase 0 완료 후 진행 (DashboardPage.css 중복 제거된 상태에서 작업)

완료 기준:
- npm run build 성공
- 브라우저에서 시각적 변화 없음 확인 (before/after 동일)
- DevTools에서 :root 패널에 CSS 변수 확인 가능
```

---

## Phase 3 — 아이콘 & 폰트 교체

> **목표**: 이모지 아이콘 → Lucide React SVG 아이콘, Pretendard 한국어 폰트 적용

### 구현 프롬프트

```
[Phase 3] Lucide React 아이콘 도입 + Pretendard 폰트 적용

현재 상황:
- Sidebar.jsx의 아이콘이 이모지 문자열 ('📊', '👥', '📷', ...)
- 이모지는 OS/브라우저마다 렌더링이 다르고 크기·색상 제어 불가
- Header.jsx도 이모지 사용 중이나 Phase 0에서 삭제됨
- 폰트가 시스템 기본 폰트 스택 (-apple-system 등)

작업 목표:
1. lucide-react 패키지 설치:
   cd frontend && npm install lucide-react

2. Sidebar.jsx 수정 — NAV_ITEMS의 icon을 이모지 문자열에서 아이콘 컴포넌트로 교체:

   변경 전: { path: '/', label: '대시보드', icon: '📊' }
   변경 후: { path: '/', label: '대시보드', icon: LayoutDashboard }

   아이콘 매핑:
   - 대시보드    → LayoutDashboard
   - 회원 관리   → Users
   - 사진 관리   → Image
   - 문의 관리   → MessageSquare
   - 시리즈 관리 → BookOpen
   - 통계        → BarChart2
   - 시스템 설정 → Settings

   사이드바 렌더링 부분에서 icon을 컴포넌트로 호출:
   const Icon = item.icon;
   <span className="sidebar-icon"><Icon size={16} strokeWidth={1.75} /></span>

   로그아웃 버튼에 LogOut 아이콘 추가:
   <LogOut size={14} style={{ marginRight: 6 }} />로그아웃

3. public/index.html에 Pretendard 폰트 CDN 추가 (</head> 직전):
   <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
   <link rel="stylesheet" as="style" crossorigin
     href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />

4. Sidebar.css 아이콘 스타일 정리:
   .sidebar-icon {
     display: flex;
     align-items: center;
     justify-content: center;
     width: 20px;
     flex-shrink: 0;
     color: inherit;  /* 부모(active/hover) 색상 상속 */
   }

주의사항:
- NAV_ITEMS 배열에서 icon 타입이 string → Component로 변경되므로
  렌더링 시 반드시 변수에 할당 후 JSX로 호출해야 함 (const Icon = item.icon; <Icon />)
- 아이콘 크기는 16px, strokeWidth 1.75로 통일
- Phase 2 완료 후 진행 (--font-sans 변수 이미 설정된 상태)

완료 기준:
- npm run build 성공
- 사이드바에 SVG 아이콘이 표시되고 active 시 보라색으로 변함
- 브라우저 DevTools Network 탭에서 Pretendard 폰트 로드 확인
```

---

## Phase 4 — Toast & 피드백 시스템

> **목표**: 모든 mutating 액션(삭제, 수정, 읽음 처리) 후 사용자에게 결과 피드백 제공

### 구현 프롬프트

```
[Phase 4] Toast 알림 시스템 도입 및 액션 피드백 구현

현재 상황:
- 회원 삭제, 역할 변경, 사진 삭제, 읽음 처리, 시리즈 삭제 등
  모든 성공/실패 상황에서 사용자에게 시각적 피드백이 없다
- API 오류 발생 시 조용히 실패한다 (콘솔 에러만 발생)
- utils/api.js는 에러를 throw하므로 각 페이지 try/catch에서 처리 가능

작업 목표:
1. react-hot-toast 설치: cd frontend && npm install react-hot-toast

2. App.jsx에 <Toaster /> 추가 (AppRoutes 바깥, 최상위 위치):
   import { Toaster } from 'react-hot-toast';
   
   <BrowserRouter>
     <AuthProvider>
       <ConfirmProvider>
         <AppRoutes />
         <Toaster
           position="bottom-right"
           toastOptions={{
             success: {
               duration: 3000,
               style: { background: '#0f172a', color: '#e2e8f0', fontSize: '13px', borderRadius: '8px' }
             },
             error: {
               duration: 5000,
               style: { background: '#0f172a', color: '#fca5a5', fontSize: '13px', borderRadius: '8px' }
             }
           }}
         />
       </ConfirmProvider>
     </AuthProvider>
   </BrowserRouter>

3. 각 페이지에서 toast 호출 추가 (try/catch 구조로 래핑):

   MemberListPage.jsx:
   - handleRoleChange 성공 → toast.success('역할이 변경되었습니다.')
   - handleRoleChange 실패 catch → toast.error('역할 변경에 실패했습니다.')
   - handleDelete 성공 → toast.success('회원이 삭제되었습니다.')
   - handleDelete 실패 catch → toast.error(err.message || '삭제에 실패했습니다.')

   PhotoListPage.jsx:
   - handleDelete 성공 → toast.success('사진이 삭제되었습니다.')
   - handleDelete 실패 catch → toast.error(err.message || '삭제에 실패했습니다.')

   InquiryListPage.jsx:
   - handleRead 성공 → toast.success('읽음 처리되었습니다.')
   - handleRead 실패 catch → toast.error('처리에 실패했습니다.')
   - handleDelete 성공 → toast.success('문의가 삭제되었습니다.')
   - handleDelete 실패 catch → toast.error(err.message || '삭제에 실패했습니다.')

   SeriesListPage.jsx:
   - handleDelete 성공 → toast.success('시리즈가 삭제되었습니다.')
   - handleDelete 실패 catch → toast.error(err.message || '삭제에 실패했습니다.')

주의사항:
- utils/api.js 변경 불필요 — 이미 에러를 throw하는 구조
- 기존 API 호출 로직(await, fetchData 재호출)은 변경 없음
- Phase 1의 ConfirmDialog와 순서: confirm() → 확인 → try API → 성공/실패 toast
- try/catch가 없는 핸들러는 추가 필요

완료 기준:
- npm run build 성공
- 회원 삭제 → 확인 → 우하단 "회원이 삭제되었습니다." 토스트 확인
- 네트워크 오류 시 빨간 에러 토스트 확인
```

---

## Phase 5 — 대시보드 & 로그인 UX 개선

> **목표**: StatCard 링크화, 이미지 플레이스홀더, 최근 문의 전체보기 링크, 로그인 페이지 UX 보완

### 구현 프롬프트

```
[Phase 5] 대시보드 & 로그인 UX 개선

현재 상황 — 대시보드:
- StatCard 4개가 클릭 불가 (단순 표시용)
- 인기 사진 썸네일 오류 시 style.display='none'으로 빈 공간 생김
  (SeriesListPage, DashboardPage 동일 문제)
- 최근 문의 테이블에 "전체 보기" 링크 없음

현재 상황 — 로그인:
- 비밀번호 표시/숨기기 토글 없음
- 에러 메시지에 aria-live 없어 스크린리더 미지원
- "개발용 계정" 힌트 문구가 프로덕션 빌드에도 노출

작업 목표 — 대시보드:
1. DashboardPage.jsx — StatCard를 클릭 가능하게 변경
   StatCard 컴포넌트에 to 프롭 추가 (선택적):
   - to 있으면 react-router-dom의 Link로 감싸기
   - to 없으면 기존 div 그대로
   
   각 StatCard에 to 설정:
   - 전체 회원   → to="/members"
   - 전체 사진   → to="/photos"
   - 오늘 신규 문의 → to="/inquiries"
   - 미읽음 문의  → to="/inquiries"
   
   카드 우상단 ArrowUpRight 아이콘 (lucide-react, size=14, opacity 0.5)
   DashboardPage.css: .stat-card { cursor: pointer; transition: box-shadow 0.15s, transform 0.15s; }
   DashboardPage.css: .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }

2. ImgWithFallback 컴포넌트 생성
   frontend/src/components/common/ImgWithFallback.jsx
   
   props: src, alt, className, style
   동작: 이미지 로드 실패 시 회색 배경 박스 + 중앙에 ImageOff 아이콘 (lucide-react, size=20)
   onError 핸들러에서 hasError state를 true로 전환
   
   적용 위치:
   - DashboardPage.jsx 인기 사진 썸네일 (photo-thumb)
   - PhotoListPage.jsx 사진 카드 이미지 (photo-img)
   - SeriesListPage.jsx 시리즈 커버 (series-cover)

3. DashboardPage.jsx 최근 문의 섹션
   card-title과 같은 행 우측에 Link to="/inquiries":
   "전체 문의 보기 →" 텍스트, font-size: 13px, color: var(--color-brand-500)
   .card-header 클래스로 display:flex justify-content:space-between 정렬

작업 목표 — 로그인:
4. LoginPage.jsx 비밀번호 토글
   showPassword state 추가 (기본값 false)
   비밀번호 input을 감싸는 div에 position:relative 적용
   우측에 Eye/EyeOff 아이콘 버튼 배치 (lucide-react)
   input type을 showPassword ? 'text' : 'password'로 토글

5. LoginPage.jsx 에러 접근성
   에러 div에 role="alert" aria-live="polite" 추가

6. LoginPage.jsx 개발용 힌트 처리
   process.env.NODE_ENV === 'development' 조건으로만 표시:
   {process.env.NODE_ENV === 'development' && (
     <p className="login-hint">개발용 계정: admin@happiness.dev / Admin123!</p>
   )}

주의사항:
- StatCard의 기존 props(icon, label, value, color) 변경 없음
- Link 감싸기 시 CSS .stat-card의 display:flex가 깨지지 않도록 Link에 display:contents 또는 block 적용 필요
- ImgWithFallback의 fallback 박스는 원본 img의 className을 그대로 사용해 크기 유지
- Phase 3(lucide-react 설치) 완료 후 진행

완료 기준:
- npm run build 성공
- 전체 회원 카드 클릭 → /members 이동 확인
- 사진 썸네일 오류 시 회색 플레이스홀더 + ImageOff 아이콘 표시
- "전체 문의 보기 →" 클릭 → /inquiries 이동 확인
- 비밀번호 토글 버튼 동작 확인
- 프로덕션 빌드(NODE_ENV=production)에서 힌트 문구 미표시
```

---

## Phase 6 — 목록 페이지 기능 보강 (백엔드 포함)

> **목표**: 검색 기능 추가, 문의 벌크 읽음 처리, 미읽음 행 강조
>
> **⚠️ 백엔드 확인 필요**: 현재 백엔드 API에 검색 파라미터와 bulk read-all 엔드포인트가 없음 — 이 Phase는 백엔드 작업이 포함된다.

### 백엔드 현황 (검증 완료)

| API | 현재 지원 파라미터 | 누락 파라미터 |
|---|---|---|
| `GET /api/admin/photos` | memberId, colorMood, sortBy, page, size | **search 없음** |
| `GET /api/admin/series` | memberId, page, size | **search 없음** |
| `GET /api/admin/inquiries` | receiverId, isRead, shootType, page, size | 문제 없음 |
| `PATCH /api/admin/inquiries/read-all` | — | **엔드포인트 자체 없음** |

### 구현 프롬프트

```
[Phase 6] 목록 페이지 기능 보강

백엔드 작업 (먼저 수행):
1. AdminPhotoController.java — search 파라미터 추가:
   @RequestParam(required = false) String search 추가
   AdminPhotoService.getPhotos()에 search 파라미터 전달

2. AdminPhotoService.java — 검색 로직 추가:
   PhotoRepository에 findBy 메서드 추가:
   Page<Photo> findByTitleContainingIgnoreCaseOrMemberNameContainingIgnoreCase(
     String title, String name, Pageable pageable)
   또는 @Query JPQL로 colorMood + search 조건을 함께 처리

3. AdminSeriesController.java — search 파라미터 추가:
   @RequestParam(required = false) String search 추가
   AdminSeriesService.getSeries()에 search 파라미터 전달

4. AdminSeriesService.java — 검색 로직 추가:
   SeriesRepository에 검색 메서드 추가 (시리즈 제목 또는 작가명)

5. AdminInquiryController.java — read-all 엔드포인트 추가:
   @PatchMapping("/read-all")
   public ResponseEntity<?> markAllRead() {
     inquiryService.markAllRead();
     return ResponseEntity.ok(Map.of("message", "모든 미읽음 문의를 읽음 처리했습니다."));
   }

6. AdminInquiryService.java — markAllRead() 메서드 추가:
   InquiryRepository에 findAllByReadFalse() 또는 @Modifying 쿼리로
   UPDATE inquiry SET read = true WHERE read = false 실행

백엔드 검증:
- ./gradlew build 성공 확인
- curl -X PATCH http://localhost:8081/api/admin/photos?search=test 동작 확인
- curl -X PATCH http://localhost:8081/api/admin/inquiries/read-all 동작 확인

프론트엔드 작업 (백엔드 완료 후):
7. PhotoListPage.jsx — 검색 인풋 추가:
   - search state 추가
   - filter-bar에 search-input 추가 (placeholder: "제목 또는 작가 검색")
   - URLSearchParams에 search 파라미터 추가
   - 입력 변경 시 setPage(0) 호출
   - debounce 300ms 적용 (useRef + clearTimeout/setTimeout)

8. SeriesListPage.jsx — 검색 기능 추가:
   - filter-bar div 추가 (현재 없음)
   - search-input 추가 (placeholder: "시리즈 제목 또는 작가 검색")
   - URLSearchParams에 search 파라미터 추가 + debounce 적용

9. InquiryListPage.jsx — 벌크 읽음 처리:
   - page-header에 "모두 읽음 처리" 버튼 추가
   - 활성화 조건: data.content 중 미읽음 항목이 1건 이상
   - 클릭 → Phase 1의 ConfirmDialog:
     confirm({ title: '모두 읽음 처리', description: '현재 페이지의 미읽음 문의를 모두 읽음으로 처리합니다.', variant: 'warning' })
   - 확인 후 PATCH /api/admin/inquiries/read-all 호출
   - 완료 후 toast.success('모든 문의를 읽음 처리했습니다.') + fetchData()

10. InquiryListPage.jsx — 미읽음 행 강조:
    - readStatus === false인 tr에 className 'unread-row' 추가
    InquiryListPage.css에 추가:
    .unread-row td { background: #fffdf5; }
    .unread-row .sender-name { font-weight: 600; }

11. InquiryListPage.jsx — 행 펼침 chevron 아이콘:
    - 행 첫 번째 td에 ChevronRight/ChevronDown 아이콘 추가 (lucide-react)
    - expanded === i.id이면 ChevronDown, 아니면 ChevronRight

주의사항:
- 백엔드 search 파라미터 추가 시 기존 memberId/colorMood 필터와 AND 조건으로 결합
- JPQL에서 search가 null일 때 전체 조회 유지 (WHERE 조건 동적으로 처리)
- debounce는 외부 라이브러리 없이 useRef + setTimeout으로 구현
- read-all은 DB 전체 행 업데이트이므로 서비스 레이어에서 @Transactional 필수

완료 기준:
- ./gradlew build 성공
- npm run build 성공
- 사진 검색어 입력 후 필터링 동작 확인
- 시리즈 검색 동작 확인
- "모두 읽음 처리" 버튼 클릭 → 확인 → toast → 목록 갱신 확인
- 미읽음 행 배경색 강조 확인
```

---

## Phase 7 — 반응형 레이아웃 & Header 통합

> **목표**: 모바일/태블릿 대응, 상단 Header 컴포넌트 재설계 및 AdminLayout 통합
>
> **⚠️ 확인**: 현재 Header.jsx는 Phase 0에서 삭제됨. 이 Phase에서 새로운 AdminHeader를 만들어 AdminLayout에 통합한다.

### 구현 프롬프트

```
[Phase 7] 반응형 레이아웃 구현 + 관리자 헤더 통합

현재 상황:
- Sidebar가 position:fixed; width:240px로 모바일에서 콘텐츠를 가림
- AdminLayout.css의 .admin-main이 margin-left:240px 고정
- 모바일용 상단 헤더(햄버거 메뉴)가 없음
- 사진 그리드, 통계 차트가 모바일에서 레이아웃 깨짐
- Phase 0에서 Header.jsx를 삭제했으므로 새로운 AdminHeader 필요

작업 목표:
1. frontend/src/components/layout/AdminHeader.jsx 신규 생성
   props: onMenuClick
   
   구조:
   - 좌측: 햄버거 버튼 (Menu 아이콘, lucide-react) — 768px 미만에서만 표시
   - 중앙: "Happiness Admin" 텍스트 (모바일에서만 표시)
   - 우측: 현재 로그인 사용자 이름 표시 (useAuth()에서 user.name)
   
   스타일: 높이 56px, background: var(--color-surface), border-bottom: 1px solid var(--color-border)
   데스크탑에서는 header 전체를 display:none (Sidebar가 브랜드 역할)
   
   AdminHeader.css 파일 함께 생성

2. AdminLayout.jsx 수정:
   - sidebarOpen state 추가 (기본값 false)
   - AdminHeader import 추가, onMenuClick={setSidebarOpen} 전달
   - Sidebar에 isOpen, onClose props 추가
   - 오버레이 div 추가 (sidebar-overlay)
   
   구조:
   <div className="admin-layout">
     <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
     <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
     <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
       onClick={() => setSidebarOpen(false)} />
     <main className="admin-main">{children}</main>
   </div>

3. AdminLayout.css — 반응형 추가:
   .sidebar-overlay {
     display: none; position: fixed; inset: 0;
     background: rgba(0,0,0,0.5); z-index: 99;
   }
   .sidebar-overlay.visible { display: block; }
   
   @media (max-width: 767px) {
     .admin-main { margin-left: 0 !important; padding: 16px; }
   }

4. Sidebar.jsx 수정:
   - props: isOpen (기본값 true), onClose 추가
   - 모바일 닫기 버튼 추가 (X 아이콘, sidebar-header 우측)
   
   Sidebar.css 추가:
   .sidebar-close { display: none; }
   @media (max-width: 767px) {
     .sidebar {
       transform: translateX(-100%);
       transition: transform 0.25s ease;
       z-index: 100;
     }
     .sidebar.sidebar-open { transform: translateX(0); }
     .sidebar-close { display: flex; }
   }
   
   JSX에서: className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}

5. 사이드바 열린 상태에서 body 스크롤 잠금 (AdminLayout.jsx):
   useEffect(() => {
     document.body.style.overflow = sidebarOpen ? 'hidden' : '';
     return () => { document.body.style.overflow = ''; };
   }, [sidebarOpen]);

6. 페이지별 반응형 CSS:

   DashboardPage.css:
   @media (max-width: 767px) {
     .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
     .dashboard-grid { grid-template-columns: 1fr; }
   }

   PhotoListPage.css — 그리드 반응형:
   @media (max-width: 639px) { .photo-grid { grid-template-columns: repeat(2, 1fr); } }
   @media (min-width: 640px) and (max-width: 1023px) { .photo-grid { grid-template-columns: repeat(3, 1fr); } }
   @media (min-width: 1024px) { .photo-grid { grid-template-columns: repeat(4, 1fr); } }
   @media (min-width: 1400px) { .photo-grid { grid-template-columns: repeat(6, 1fr); } }

   MemberListPage.css, InquiryListPage.css, SeriesListPage.css:
   @media (max-width: 767px) {
     .table-card { overflow-x: auto; }
     .data-table { min-width: 600px; }
   }

   StatsPage.css:
   @media (max-width: 767px) { .stats-row { flex-direction: column; } }

   global.css:
   @media (max-width: 640px) {
     .filter-bar { flex-direction: column; }
     .search-input { width: 100%; }
     .filter-select { width: 100%; }
   }

주의사항:
- Phase 0에서 Header.jsx/Header.css 삭제됨 — 해당 파일을 다시 만들지 말 것
- 데스크탑(1024px+)에서 AdminHeader display:none (기존 Sidebar 브랜드 영역 유지)
- 사이드바 열릴 때 오버레이 z-index는 사이드바보다 낮아야 함 (sidebar: 100, overlay: 99)
- NavLink 클릭 시 사이드바 닫힘 처리: Sidebar.jsx에서 useEffect로 location 변경 감지

완료 기준:
- npm run build 성공
- 768px 미만에서 AdminHeader + 햄버거 버튼 표시 확인
- 햄버거 클릭 → 사이드바 슬라이드인 + 오버레이 표시 확인
- 오버레이 클릭 → 사이드바 닫힘 확인
- 네비게이션 링크 클릭 → 사이드바 자동 닫힘 확인
- 사진 그리드 화면 크기별 컬럼 수 변경 확인
```

---

## Phase 8 — 통계 페이지 강화

> **목표**: KPI 요약 카드, 기간 변경 시 부분 로딩, CSV 내보내기
>
> **⚠️ 기술 주의사항**: Recharts의 Bar/Cell/Line 등 SVG 요소에는 CSS Custom Properties(`var()`)를 `fill`/`stroke` 속성으로 직접 사용하면 일부 브라우저에서 해석되지 않는다. 대신 JavaScript에서 `getComputedStyle`로 값을 읽어 상수로 사용해야 한다.

### 구현 프롬프트

```
[Phase 8] 통계 페이지 강화

현재 상황:
- 기간 변경(7/30/90일) 시 전체 4개 API가 동시에 재호출되어 전체 화면 로딩
- 기간 합산 KPI 수치 없음 (차트에서 직접 읽어야 함)
- COLORS 배열이 하드코딩 (CSS 변수와 불일치)
- CSV 내보내기 없음

⚠️ Recharts + CSS Custom Properties 주의사항:
Recharts는 SVG 기반으로 렌더링하며, SVG의 fill/stroke 속성에 var()를 직접 넣으면
CSS 변수가 SVG 속성 문맥에서 해석되지 않는 브라우저가 있음.
따라서 색상 상수는 CSS 변수 없이 헥스값으로 정의한다:

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16'];

작업 목표:
1. StatsPage.jsx — 관심사 분리: 기간별 데이터와 분포 데이터 분리

   현재: Promise.all 하나로 4개 API 동시 호출 (days 변경 시 전체 재호출)
   변경:
   - dailyLoading state 별도 추가
   - days/topSortBy 변경 시 daily + top-photos만 재호출
   - moodDist, shootDist는 초기 마운트 시 한 번만 호출 (deps 배열 비움)
   
   useEffect 분리:
   // 마운트 시 한 번만
   useEffect(() => {
     Promise.all([getApi('/admin/stats/mood-dist'), getApi('/admin/stats/shoot-type-dist')])
       .then(([md, sd]) => { setMoodDist(md); setShootDist(sd); });
   }, []);
   
   // days/topSortBy 변경 시
   useEffect(() => {
     setDailyLoading(true);
     Promise.all([getApi(`/admin/stats/daily?days=${days}`), getApi(`/admin/stats/top-photos?sortBy=${topSortBy}`)])
       .then(([dl, tp]) => { setDaily(dl); setTopPhotos(tp); })
       .finally(() => setDailyLoading(false));
   }, [days, topSortBy]);

2. StatsPage.jsx — KPI 요약 카드 추가 (daily 데이터 합산):
   daily 배열에서 계산 (추가 API 없음):
   const kpi = {
     photos:   daily.reduce((s, d) => s + (d.photos   || 0), 0),
     signups:  daily.reduce((s, d) => s + (d.signups  || 0), 0),
     inquiries: daily.reduce((s, d) => s + (d.inquiries || 0), 0),
   };
   
   KpiCard 컴포넌트 (파일 내부 정의):
   label, value, icon(lucide) 프롭
   stats-kpi-grid CSS로 3등분 배치, margin-bottom 추가
   
   dailyLoading 중 KPI 카드에 skeleton 효과 (opacity 0.5 또는 배경 애니메이션)

3. StatsPage.jsx — 기간별 차트 카드에 부분 로딩 오버레이:
   stats-card를 감싸는 div에 position:relative
   dailyLoading이 true일 때 반투명 오버레이 + 중앙 스피너 (CSS animation)
   무드 분포/촬영종류 카드는 별도 loading state 없음

4. CSV 내보내기:
   기간별 추이 카드 헤더 우측에 Download 아이콘 + "CSV" 텍스트 버튼
   클릭 시:
   const rows = [['날짜','사진 업로드','신규 가입','문의 접수'], ...daily.map(d => [d.day, d.photos, d.signups, d.inquiries])];
   const csv = rows.map(r => r.join(',')).join('\n');
   const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Excel 한글 지원
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `stats-${days}days-${new Date().toISOString().slice(0,10)}.csv`;
   a.click();
   URL.revokeObjectURL(url);

5. CHART_COLORS 정의:
   파일 상단 상수로 헥스값 직접 사용 (CSS 변수 미사용):
   const CHART_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#a855f7','#ec4899','#84cc16'];

주의사항:
- Recharts Cell/Bar의 fill prop에 var() 절대 사용 금지 (SVG 속성 해석 불가)
- daily 데이터에 signups 필드가 있는지 API 응답 확인 필요
  (DailyStatDto 확인: photos, signups, inquiries 필드 존재)
- BOM(﻿) 추가해야 Excel에서 한글이 깨지지 않음
- URL.revokeObjectURL은 setTimeout으로 100ms 후 호출 권장

완료 기준:
- npm run build 성공
- 기간 탭 변경 시 KPI 카드 수치 즉시 재계산 확인
- 기간 변경 시 무드 분포 파이차트는 그대로 유지 확인
- CSV 버튼 클릭 → 파일 다운로드 확인
- 다운로드된 CSV를 Excel에서 한글 정상 표시 확인
```

---

## Phase 9 — 다크모드 & 테마

> **목표**: CSS Custom Properties 기반 다크모드 구현 (Phase 2 완료 필수)

### 구현 프롬프트

```
[Phase 9] 다크모드 구현

전제 조건: Phase 2 완료 (모든 색상이 CSS 변수로 참조)

작업 목표:
1. tokens.css에 다크모드 오버라이드 추가:

   [data-theme="dark"] {
     --color-bg:          #0f172a;
     --color-surface:     #1e293b;
     --color-surface-2:   #334155;
     --color-border:      #334155;
     --color-border-light:#1e293b;
     --color-text-primary:   #f1f5f9;
     --color-text-secondary: #94a3b8;
     --color-text-tertiary:  #64748b;
     --color-text-muted:     #64748b;
     /* Sidebar: 이미 어두우므로 변경 없음 */
     /* Brand, Semantic 색상: 유지 */
   }
   
   @media (prefers-color-scheme: dark) {
     :root:not([data-theme="light"]) {
       /* 위와 동일한 변수 적용 */
     }
   }

2. frontend/src/context/ThemeContext.jsx 신규 생성:
   - theme state: 'light' | 'dark' | 'system' (기본값: 'system')
   - localStorage 'ha-theme' 키로 저장
   - document.documentElement.setAttribute('data-theme', resolvedTheme)
   - useTheme() 훅: { theme, setTheme, resolvedTheme } 반환
   - ThemeProvider export

3. App.jsx에 ThemeProvider 추가 (BrowserRouter 내부 최상위):
   <ThemeProvider>
     <AuthProvider>
       ...
     </AuthProvider>
   </ThemeProvider>

4. AdminHeader.jsx(Phase 7)에 테마 토글 버튼 추가:
   - Sun/Moon/Monitor 아이콘 (lucide-react)
   - 클릭 시 light → dark → system 순환 또는 simple light/dark 토글
   - 데스크탑에서도 Sidebar footer 영역에 추가 (Sidebar.jsx)

5. Recharts 다크모드 대응 (Phase 8 참고):
   - CartesianGrid stroke: var()로 되어 있는 경우 stroke="#334155" 하드코딩
   - 차트 Tooltip contentStyle에 다크 배경 적용:
     contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}

6. ConfirmDialog.css, 각 페이지 CSS에서 다크모드 깨지는 부분 수정:
   - 흰 배경 카드: var(--color-surface) 사용으로 자동 대응 (Phase 2 완료 시)
   - 하드코딩된 white, #ffffff 남은 부분 var(--color-surface)로 교체

주의사항:
- Sidebar 배경(--color-sidebar-bg: #0f172a)은 다크모드에서도 동일 유지
- prefers-color-scheme은 data-theme 수동 설정이 없을 때만 적용
- 다크모드 전환 시 transition 추가: body { transition: background-color 0.2s, color 0.2s; }

완료 기준:
- npm run build 성공
- 토글 클릭 시 라이트/다크 전환 확인
- 새로고침 후에도 테마 유지 확인 (localStorage)
- 다크모드에서 테이블, 카드, 모달 가독성 확인
- prefers-color-scheme: dark 설정 시 자동 다크모드 적용 확인
```

---

## Phase 10 — 고급 기능 확장

> **목표**: 사이드바 접기, 미읽음 뱃지, 슬라이드오버 패널

### 구현 프롬프트

```
[Phase 10] 고급 UX 기능 확장

전제 조건: Phase 1~7 완료

각 서브 태스크(A/B/C/D)는 독립적으로 구현 가능.

[10-A] 사이드바 접기/펼치기 (데스크탑 전용)
- Sidebar.jsx에 collapsed state 추가, localStorage 'ha-sidebar-collapsed' 키로 유지
- collapsed 시: width 60px, 텍스트·사용자명·로그아웃 숨김, 아이콘만 표시
- sidebar-header 클릭(또는 토글 버튼)으로 전환
- Sidebar.css: transition: width 0.2s ease
- AdminLayout.css: .admin-layout에 CSS 변수로 사이드바 너비 반영:
  --sidebar-width: 240px; (collapsed 시 60px)
  .admin-main { margin-left: var(--sidebar-width); }
  AdminLayout.jsx에서 collapsed 상태를 CSS 변수로 설정
- 아이콘 hover 시 툴팁 (title 속성으로 간단히 구현)
- 768px 미만(모바일)에서는 collapsed 기능 비활성화

[10-B] 미읽음 문의 수 뱃지 (Sidebar)
- Sidebar.jsx에서 컴포넌트 마운트 시 getApi('/admin/stats/summary') 호출
- unreadInquiries > 0 일 때 /inquiries 링크 옆에 뱃지 표시
- 뱃지 스타일: 빨간 원형, 최소 width 18px, 99 초과 시 "99+" 표시
- 2분(120초)마다 자동 갱신: useEffect에서 setInterval 사용, cleanup 필수
- collapsed 상태에서도 아이콘 위 우상단에 뱃지 표시

[10-C] 문의 상세 슬라이드오버 패널
- SlideOver.jsx 신규 생성 (재사용 가능한 범용 컴포넌트):
  props: open, onClose, title, children
  position:fixed; right:0; top:0; bottom:0; width:420px; z-index:200
  오버레이(dimmed), ESC 키 닫기, 슬라이드 애니메이션 (transform translateX)

- InquiryListPage.jsx에서 행 클릭 시 기존 expanded 토글 방식 → SlideOver로 교체:
  selected state로 선택된 문의 저장
  SlideOver 내부에 문의 전체 정보 표시:
  발신자명/이메일, 수신 작가, 촬영 종류, 희망 날짜, 예산, 접수일, 상태 뱃지
  메시지 전문 (pre-wrap 스타일로 개행 유지)
  미읽음인 경우 "읽음 처리" 버튼 포함

[10-D] 회원 상세 슬라이드오버
- MemberListPage.jsx에서 이름 셀 클릭 시 SlideOver 오픈
- SlideOver 내부에 회원 요약:
  이름, 이메일, 프로필명, 역할(뱃지), 사진 수, 가입일
- 역할 변경 select도 슬라이드오버 내부에서 처리 (인라인 편집 제거)
- SlideOver 컴포넌트 재사용 (10-C와 동일)

주의사항:
- SlideOver는 Portal로 렌더링 (ConfirmDialog와 동일 패턴)
- z-index 계층: Sidebar(100) < Overlay(150) < SlideOver(200) < ConfirmDialog(300)
- 10-B의 setInterval cleanup: return () => clearInterval(id)
- 10-A의 collapsed 상태를 AdminLayout까지 전파할 때 Context 또는 CSS 변수 사용

완료 기준:
- npm run build 성공
- [10-A] 사이드바 토글 후 새로고침 시 상태 유지 확인
- [10-B] 미읽음 문의 뱃지 표시 및 2분 후 자동 갱신 확인
- [10-C] 문의 행 클릭 → 슬라이드오버 패널 열림 확인
- [10-D] 회원 이름 클릭 → 상세 패널 열림 확인
```

---

## 공통 작업 원칙

모든 Phase에서 반드시 지켜야 할 규칙:

```
1. 기존 API 호출 구조(getApi/postApi/patchApi/deleteApi) 변경 금지
   (utils/api.js 인터페이스 유지)

2. 라우팅 구조 변경 금지:
   /login, /, /members, /photos, /portfolios, /inquiries, /series, /stats, /system

3. AuthContext의 login/logout/user 인터페이스 변경 금지

4. 각 Phase 완료 후 반드시:
   - 백엔드 변경 포함 시: ./gradlew build 성공 확인
   - 프론트엔드: npm run build 성공 확인

5. Phase 의존성 순서:
   Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
   Phase 6은 Phase 1,4 완료 후 (백엔드 작업 포함)
   Phase 7은 Phase 3 완료 후 (lucide-react 필요)
   Phase 8은 Phase 2 완료 후 (토큰 정의 필요)
   Phase 9는 Phase 2 완료 필수 (CSS 변수 기반)
   Phase 10은 Phase 1~7 권장

6. 새 파일 생성 시 디렉토리 규칙:
   - 재사용 UI 컴포넌트: frontend/src/components/common/
   - 레이아웃 컴포넌트: frontend/src/components/layout/
   - Context: frontend/src/context/
   - 페이지: frontend/src/pages/
   - 스타일: 컴포넌트와 동일 디렉토리에 .css 파일

7. CSS 변수는 Phase 2 이후부터 반드시 var() 참조
   Recharts fill/stroke 속성은 예외 — 헥스값 직접 사용

8. 데드 코드 제거 후 새 코드 추가 원칙:
   Phase 0 완료 후에는 Header.jsx, HomePage.jsx, useFetchAPI.js를
   절대 다시 생성하지 않음
```

---

## 백엔드 API 현황 요약 (2026-06-23 기준)

| 엔드포인트 | 상태 |
|---|---|
| `POST /api/auth/login` | ✅ 구현 완료 |
| `GET /api/admin/members` | ✅ search·page·size 파라미터 지원 |
| `PATCH /api/admin/members/{id}/role` | ✅ 구현 완료 |
| `DELETE /api/admin/members/{id}` | ✅ 구현 완료 |
| `GET /api/admin/photos` | ✅ search·l1~l5·colorMood·sortBy·page·size 지원 |
| `PATCH /api/admin/photos/{id}/category-code` | ✅ 구현 완료 |
| `DELETE /api/admin/photos/{id}` | ✅ 구현 완료 |
| `GET /api/admin/portfolios` | ✅ 구현 완료 |
| `PATCH /api/admin/portfolios/{id}/approve` | ✅ 구현 완료 |
| `PATCH /api/admin/portfolios/{id}/reject` | ✅ 구현 완료 |
| `PATCH /api/admin/portfolios/{id}/hide` | ✅ 구현 완료 |
| `DELETE /api/admin/portfolios/{id}` | ✅ 구현 완료 |
| `GET /api/admin/inquiries` | ✅ isRead·shootType·receiverId·page·size 지원 |
| `PATCH /api/admin/inquiries/{id}/read` | ✅ 구현 완료 |
| `PATCH /api/admin/inquiries/read-all` | ✅ 구현 완료 (Phase 6에서 추가) |
| `GET /api/admin/series` | ✅ search·memberId·page·size 지원 |
| `DELETE /api/admin/series/{id}` | ✅ 구현 완료 |
| `GET /api/admin/stats/summary` | ✅ 구현 완료 |
| `GET /api/admin/stats/daily` | ✅ days 파라미터 지원 |
| `GET /api/admin/stats/top-photos` | ✅ sortBy 파라미터 지원 |
| `GET /api/admin/stats/mood-dist` | ✅ 구현 완료 |
| `GET /api/admin/stats/shoot-type-dist` | ✅ 구현 완료 |
| `GET /api/admin/system/status` | ✅ 구현 완료 |
| `GET /api/admin/categories` | ✅ 카테고리 트리 조회 |

---

## 진행 상태 체크리스트

```
[x] Phase 0  — 데드 코드 정리 & CSS 중복 제거
              (Header.jsx, HomePage.jsx, useFetchAPI.js 삭제 완료)
[x] Phase 1  — ConfirmDialog & 역할 변경 확인
              (ConfirmDialog.jsx + ConfirmContext.jsx 구현 완료)
[x] Phase 2  — CSS Design Token 도입
              (src/styles/tokens.css 구현 완료)
[x] Phase 3  — Lucide 아이콘 + Pretendard 폰트
              (lucide-react 설치, Sidebar 아이콘 교체 완료)
[x] Phase 4  — Toast 알림 시스템
              (react-hot-toast + Toaster App.jsx 통합 완료)
[x] Phase 5  — 대시보드 & 로그인 UX 개선
              (ImgWithFallback, StatCard 링크화, 비밀번호 토글 완료)
[x] Phase 6  — 목록 페이지 기능 보강 (백엔드 포함)
              (photos/series 검색 파라미터, inquiries read-all 추가 완료)
[x] Phase 7  — 반응형 레이아웃 & AdminHeader 통합
              (AdminHeader.jsx, 햄버거 메뉴, 모바일 반응형 완료)
[x] Phase 8  — 통계 페이지 강화
              (KPI 카드, 기간별 부분 로딩, CSV 내보내기 완료)
[x] Phase 9  — 다크모드
              (tokens.css dark mode 오버라이드, prefers-color-scheme 지원 완료)
[ ] Phase 10 — 고급 기능 확장
              SlideOver.jsx 구현 완료 / 사이드바 접기·미읽음 뱃지 미구현
              [10-A] 사이드바 접기/펼치기 — 미구현
              [10-B] 미읽음 문의 뱃지 — 미구현
              [10-C] 문의 SlideOver — SlideOver 컴포넌트 구현, 연동 미구현
              [10-D] 회원 상세 SlideOver — 미구현
```
