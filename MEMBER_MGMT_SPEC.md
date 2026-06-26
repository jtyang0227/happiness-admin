# Happiness Admin — 회원 관리 기능 기획서

> 버전: 1.0  
> 작성일: 2026-06-26  
> 담당 페이지: `/members`, `/members/:id`  
> 연관 문서: `APP_ADMIN_SPEC.md` (P0 회원상태관리 / P0 회원상세), `COSMOS_DESIGN_SPEC.md`

---

## 목차

1. [현재 구현 현황](#1-현재-구현-현황)
2. [기능 갭 분석](#2-기능-갭-분석)
3. [회원 목록 페이지 개선 (P0)](#3-회원-목록-페이지-개선-p0)
4. [회원 상세 페이지 신규 (P0)](#4-회원-상세-페이지-신규-p0)
5. [작가 인증 관리 (P1)](#5-작가-인증-관리-p1)
6. [데이터 모델](#6-데이터-모델)
7. [API 명세](#7-api-명세)
8. [구현 우선순위 & 로드맵](#8-구현-우선순위--로드맵)
9. [디자인 가이드](#9-디자인-가이드)

---

## 1. 현재 구현 현황

### 1-1. 구현 완료 (✅)

| 기능 | 위치 | 설명 |
|------|------|------|
| 회원 목록 조회 | `GET /api/admin/members` | 검색·역할 필터·페이지네이션 |
| 회원 상세 조회 | `GET /api/admin/members/{id}` | 단일 회원 정보 반환 |
| 역할 변경 | `PATCH /api/admin/members/{id}/role` | WM만 가능, ConfirmDialog 확인 |
| 회원 정지 | `PATCH /api/admin/members/{id}/status` | 사유 입력 모달 → SUSPENDED |
| 정지 해제 | `PATCH /api/admin/members/{id}/status` | → ACTIVE 복귀 |
| 회원 삭제 | `DELETE /api/admin/members/{id}` | WM만 가능, 연관 데이터 cascade |
| 목록 UI | `MemberListPage.jsx` | 이름·이메일·프로필·역할·상태·사진 수·가입일·관리 열 |

### 1-2. 부분 구현 (🚧)

| 기능 | 현황 | 비고 |
|------|------|------|
| 회원 상세 페이지 | 상세 버튼(`Link to /members/:id`) 존재 | 라우트·페이지 미구현 |
| 상태 필터 | 역할 필터만 있음 | 상태(ACTIVE/SUSPENDED 등) 필터 없음 |
| 인증 배지 | Member 엔티티에 `isVerified` 필드 있음 | UI 미반영 |
| 정지 기간 설정 | `suspendUntil` 필드 있음 | 기간 입력 UI 없음 |

### 1-3. 미구현 (❌)

| 기능 | 우선순위 | 설명 |
|------|---------|------|
| `/members/:id` 상세 페이지 | P0 | 탭별 활동 내역 통합 조회 |
| 상태별 필터 드롭다운 | P0 | ACTIVE/SUSPENDED/INACTIVE/DELETED |
| 기간 한정 정지 | P0 | suspendUntil 날짜 입력 |
| CSV 내보내기 | P1 | 필터 결과 회원 목록 다운로드 |
| 작가 인증 심사 | P1 | VerificationRequest 승인/반려 |
| 회원 통계 요약 | P1 | 신규 가입 추이, 역할·상태 분포 |

---

## 2. 기능 갭 분석

### 운영자 시나리오별 부족한 점

| 시나리오 | 현재 가능 여부 | 문제 |
|---------|--------------|------|
| 특정 회원이 규정을 위반했다 | ✅ 정지 가능 | 기간 지정 불가, 정지 이력 미기록 |
| 정지된 회원이 얼마나 있는지 확인 | ❌ 불가 | 상태 필터가 없어 전체 목록에서 찾아야 함 |
| 회원의 업로드 사진을 한눈에 보고 싶다 | ❌ 불가 | 상세 페이지 없음 |
| 신규 가입자 추이를 보고 싶다 | ❌ 불가 | 통계 요약 없음 |
| 인증 신청한 작가를 심사하고 싶다 | ❌ 불가 | 인증 관리 페이지 없음 |
| 회원 목록을 엑셀로 내보내고 싶다 | ❌ 불가 | CSV 기능 없음 |

---

## 3. 회원 목록 페이지 개선 (P0)

### 3-1. 필터 바 개선

```
현재: [검색 인풋] [역할 드롭다운]
개선: [검색 인풋] [역할 드롭다운] [상태 드롭다운] [CSV 내보내기 버튼]
```

**상태 드롭다운 옵션:**
| 값 | 표시 |
|----|------|
| (전체) | 전체 상태 |
| `ACTIVE` | 활성 |
| `SUSPENDED` | 정지 |
| `INACTIVE` | 비활성 |
| `DELETED` | 삭제됨 |

**백엔드 변경:** `GET /api/admin/members?status=SUSPENDED` 파라미터 추가

### 3-2. 목록 컬럼 개선

**기존 컬럼:** 이름 | 이메일 | 프로필 | 역할 | 상태 | 사진 | 가입일 | 관리

**개선 컬럼:**

| 컬럼 | 변경 내용 |
|------|----------|
| 이름 | 인증 뱃지 (✓) 추가 — `isVerified === true` 시 ShieldCheck 아이콘 |
| 상태 | 정지 중일 때 `suspendUntil` 날짜 tooltip 또는 subtext 표시 |
| 관리 | [상세] 버튼을 SlideOver 트리거로 변경 (페이지 이동 X) |

### 3-3. 정지 모달 개선 — 기간 한정 정지

**현재:**
```
[회원 정지]
사유 입력 (textarea)
[취소] [정지 처리]
```

**개선:**
```
[회원 정지]
홍길동 (hong@example.com)

기간 선택
  ◉ 3일   ○ 7일   ○ 30일   ○ 영구 정지

정지 사유 (필수)
[____________________________]

[취소]   [정지 처리]
```

**동작:**
- 기간 선택 시 `suspendUntil = now + 기간(일)`
- 영구 정지 시 `suspendUntil = null`
- 기간 정지인 경우 목록에서 남은 일수 표시 (예: `3일 남음`)

### 3-4. 회원 목록 UI 와이어프레임

```
┌─────────────────────────────────────────────────────────────────────────┐
│  회원 관리                                        총 247명   [CSV 내보내기] │
├─────────────────────────────────────────────────────────────────────────┤
│  [이름·이메일 검색___________] [전체 역할▼] [전체 상태▼]                  │
├──────┬─────────────┬──────────────────┬──────┬────────┬────┬──────┬────┤
│ 이름  │ 이메일       │ 프로필            │ 역할  │ 상태   │ 사진 │ 가입일 │ 관리 │
├──────┼─────────────┼──────────────────┼──────┼────────┼────┼──────┼────┤
│ 홍길동✓│ hong@ex.com │ @hong_photo     │[운영자]│[활성]  │ 12 │06-01│[상세][정지] │
│ 김철수 │ kim@ex.com │ @kim_snap       │[일반] │[정지]  │  3 │06-05│[상세][해제] │
│       │            │                  │      │7일 남음 │    │     │     │
│ 이영희 │ lee@ex.com │ -               │[일반] │[활성]  │  0 │06-10│[상세][정지][삭제] │
└──────┴─────────────┴──────────────────┴──────┴────────┴────┴──────┴────┘
│  ← 1 2 3 ... 13 →                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 회원 상세 페이지 신규 (P0)

### 4-1. 라우트 & 진입

- **라우트:** `/members/:id`
- **진입:** 목록에서 [상세] 버튼 클릭 → 링크 이동 (SlideOver 대신 전용 페이지)
- **뒤로가기:** 브라우저 뒤로 또는 헤더 [← 회원 목록] 링크

### 4-2. 페이지 구조

```
┌──────────────────────────────────────────────────────────────┐
│  ← 회원 목록                                                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  [아바타]  홍길동  @hong_photo  ✓ 인증 작가            │    │
│  │  hong@example.com  ·  010-****-****  ·  소셜(Google) │    │
│  │  가입일 2026-05-01  ·  마지막 수정 2026-06-15          │    │
│  │                                                      │    │
│  │  [역할: 운영자 ▼]  [상태: 활성 ●]  [정지] [삭제]      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────┬──────┬──────┬────────┐                           │
│  │ 활동 요약 │사진  │시리즈 │문의    │                           │
│  └────────┴──────┴──────┴────────┘                           │
│   ↑ 언더라인 탭 (Cosmos 스타일)                                │
│                                                              │
│  ── 활동 요약 탭 ──────────────────────────────────────────   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│  │사진 12장 │ │시리즈 3개│ │문의 5건 │ │포트폴리오│                 │
│  └────────┘ └────────┘ └────────┘ └────────┘                 │
│                                                              │
│  최근 업로드 사진 (최대 6장)                                    │
│  [사진] [사진] [사진] [사진] [사진] [사진]                      │
│                                                              │
│  정지 이력                                                     │
│  ● 2026-06-10 ~ 2026-06-17 (7일) / 사유: 스팸 행위             │
│    처리자: 운영자 (sa@happiness.dev)                            │
└──────────────────────────────────────────────────────────────┘
```

### 4-3. 탭별 상세 내용

#### 탭 1: 활동 요약
- KPI 카드 4개: 업로드 사진 수 / 시리즈 수 / 발송 문의 수 / 포트폴리오 수
- 최근 사진 썸네일 6장 (클릭 시 사진 관리 페이지 해당 사진으로 이동)
- 정지 이력 타임라인 (있는 경우)
- 가입 경로 (local / Google / Kakao 등)

#### 탭 2: 사진
- `GET /api/admin/photos?memberId={id}` 결과 그리드
- 열: 썸네일 | 제목 | 카테고리 코드 | 업로드일 | 삭제 버튼
- 페이지당 20개, 페이지네이션

#### 탭 3: 시리즈
- `GET /api/admin/series?memberId={id}` 결과 테이블
- 열: 시리즈 제목 | 사진 수 | 생성일 | 삭제 버튼

#### 탭 4: 문의
- `GET /api/admin/inquiries?senderId={id}` 결과 테이블
- 열: 촬영종류 | 수신자 | 접수일 | 읽음 여부

### 4-4. 관리 액션

| 액션 | 조건 | 동작 |
|------|------|------|
| 역할 변경 | WM 전용 | select 드롭다운, onChange → ConfirmDialog |
| 정지 | 상태 ACTIVE 또는 INACTIVE | 기간 + 사유 입력 모달 |
| 정지 해제 | 상태 SUSPENDED | ConfirmDialog → ACTIVE |
| 삭제 | WM 전용, 상태 무관 | ConfirmDialog (cascade 경고 문구 포함) |

---

## 5. 작가 인증 관리 (P1)

> **연관 엔티티:** `VerificationRequest` (DataInitializer에 샘플 데이터 5건 존재)

### 5-1. 인증 심사 진입점

**진입 1 — 회원 상세 페이지:** 인증 신청 정보가 있을 경우 활동 요약 탭에 인증 카드 노출
```
┌───────────────────────────────────────────────────────┐
│  작가 인증 신청                                [심사하기] │
│  신청일: 2026-06-20                                    │
│  포트폴리오: portfolio.example.com/hong_photo           │
│  소개: 3년간 웨딩 사진 전문 작가로 활동했습니다.            │
│  현재 상태: [대기 중 🟡]                                 │
└───────────────────────────────────────────────────────┘
```

**진입 2 — 사이드바:** `/verifications` 메뉴 (Sidebar에 이미 추가됨)

### 5-2. 인증 목록 페이지 (`/verifications`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  작가 인증 관리                              총 5건 (대기: 3건 🔴)    │
├──────────────────────────────────────────────────────────────────────┤
│  [전체] [대기 중] [승인됨] [반려됨]                                   │
├──────┬──────────────┬──────────────────────┬────────┬────────┬──────┤
│ 신청자 │ 포트폴리오 URL │ 신청일                │ 처리일  │ 상태   │ 관리  │
├──────┼──────────────┼──────────────────────┼────────┼────────┼──────┤
│ 홍길동 │ port.ex/hong │ 2026-06-20           │ -      │[대기중]│[심사]│
│ 김철수 │ port.ex/kim  │ 2026-06-15           │06-17   │[승인]  │[취소]│
│ 이영희 │ port.ex/lee  │ 2026-06-10           │06-12   │[반려]  │[재심]│
└──────┴──────────────┴──────────────────────┴────────┴────────┴──────┘
```

### 5-3. 인증 심사 SlideOver

```
┌────────────────────────────────────────────────────────┐
│  작가 인증 심사                                     [X] │
├────────────────────────────────────────────────────────┤
│  신청자: 홍길동 (hong@example.com)                      │
│  프로필: @hong_photo  ·  사진 12장  ·  시리즈 3개        │
│                                                        │
│  포트폴리오 URL:                                        │
│  https://portfolio.example.com/hong_photo    [열기 ↗]  │
│                                                        │
│  작가 소개:                                             │
│  3년간 웨딩 사진 전문 작가로 활동했습니다.               │
│  다양한 프로젝트 경험이 있습니다.                         │
│                                                        │
│  신청일: 2026-06-20  ·  현재 상태: 대기 중              │
│                                                        │
│  반려 사유 (반려 시 필수):                               │
│  [____________________________________________]        │
├────────────────────────────────────────────────────────┤
│                              [반려]      [승인]         │
└────────────────────────────────────────────────────────┘
```

**승인 처리:**
- `VerificationRequest.status = APPROVED`
- `Member.isVerified = true`, `Member.verifiedAt = now()`

**반려 처리:**
- `VerificationRequest.status = REJECTED`
- `VerificationRequest.rejectReason = 입력값`

---

## 6. 데이터 모델

### 6-1. Member 엔티티 (현재 상태)

| 필드 | 타입 | 현황 | 비고 |
|------|------|------|------|
| `id` | Long | ✅ | PK |
| `email` | String | ✅ | unique |
| `name` | String | ✅ | |
| `profileName` | String | ✅ | @handle |
| `tel` | String | ✅ | |
| `password` | String | ✅ | nullable (소셜 로그인) |
| `status` | MemberStatus | ✅ | ACTIVE/SUSPENDED/INACTIVE/DELETED |
| `authority` | Authority | ✅ | WM/SA/US |
| `provider` | String | ✅ | local/google/kakao |
| `providerId` | String | ✅ | 소셜 로그인 ID |
| `suspendReason` | String | ✅ | 정지 사유 |
| `suspendUntil` | LocalDateTime | ✅ | 정지 만료일 (null=영구) |
| `suspendedById` | Long | ✅ | 처리 관리자 ID |
| `suspendedAt` | LocalDateTime | ✅ | 정지 처리일시 |
| `isVerified` | boolean | ✅ | 작가 인증 여부 |
| `verifiedAt` | LocalDateTime | ✅ | 인증 승인일시 |
| `createdAt` | LocalDateTime | ✅ | |
| `updatedAt` | LocalDateTime | ✅ | |

### 6-2. VerificationRequest 엔티티 (현재 상태)

> DataInitializer에서 샘플 5건 생성 확인됨

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | PK |
| `member` | Member | FK — 신청자 |
| `portfolioUrl` | String | 포트폴리오 URL |
| `bio` | String | 작가 소개 |
| `status` | String | PENDING / APPROVED / REJECTED |
| `rejectReason` | String | 반려 사유 |
| `reviewedAt` | LocalDateTime | 심사 처리일시 |

### 6-3. AdminMemberDto 확장 필요 필드

현재 DTO에서 누락된 필드:

| 추가 필드 | 이유 |
|----------|------|
| `suspendUntil` | 목록에서 정지 만료일 표시 |
| `suspendReason` | 상세 페이지에서 정지 사유 표시 |
| `isVerified` | 목록 및 상세에서 인증 배지 표시 |
| `verifiedAt` | 상세 페이지 인증 승인일 표시 |
| `provider` | ✅ 이미 포함됨 |
| `portfolioCount` | 상세 KPI 카드 |
| `lastLoginAt` | (옵션) 비활성 감지용 |

---

## 7. API 명세

### 7-1. 현재 구현된 API

| 메서드 | 경로 | 파라미터 | 역할 제한 | 상태 |
|--------|------|---------|---------|------|
| GET | `/api/admin/members` | search, authority, page, size | WM/SA | ✅ |
| GET | `/api/admin/members/{id}` | - | WM/SA | ✅ |
| PATCH | `/api/admin/members/{id}/role` | `{ authority }` | WM | ✅ |
| PATCH | `/api/admin/members/{id}/status` | `{ status, reason }` | WM/SA | ✅ |
| DELETE | `/api/admin/members/{id}` | - | WM | ✅ |

### 7-2. 추가 필요 API

#### P0 — 목록 개선

```
GET /api/admin/members?status=SUSPENDED
```
- **변경**: `status` 파라미터 추가 (AdminMemberService.getMembers 수정)
- **백엔드 작업**: MemberRepository.searchMembers()에 status 조건 추가

```
PATCH /api/admin/members/{id}/status
Request Body 확장:
{
  "status": "SUSPENDED",
  "reason": "스팸 행위",
  "suspendDays": 7          // null이면 영구 정지
}
```
- **변경**: `suspendDays` 파라미터 추가 → `suspendUntil = now + suspendDays`

#### P0 — 회원 상세

```
GET /api/admin/members/{id}/details
Response:
{
  "member": { ...AdminMemberDto (확장) },
  "recentPhotos": [...],        // 최근 6장
  "suspendHistory": [...],      // 정지 이력
  "verificationRequest": {...}  // 인증 신청 정보 (있을 경우)
}
```

#### P1 — CSV 내보내기

```
GET /api/admin/members/export?search=&authority=&status=
Response: text/csv; charset=UTF-8
Content-Disposition: attachment; filename="members-2026-06-26.csv"
```

**CSV 컬럼:** ID, 이름, 이메일, 프로필, 역할, 상태, 사진 수, 시리즈 수, 가입일

#### P1 — 작가 인증 관리

```
GET  /api/admin/verifications?status=PENDING&page=0&size=20
PATCH /api/admin/verifications/{id}/approve
PATCH /api/admin/verifications/{id}/reject
Request Body: { "rejectReason": "..." }
```

---

## 8. 구현 우선순위 & 로드맵

### 8-1. P0 — 즉시 착수 (예상 3~5일)

#### 백엔드

```
[ ] 1. AdminMemberService.getMembers() — status 파라미터 추가
[ ] 2. MemberRepository.searchMembers() — status 조건 추가 (JPQL)
[ ] 3. StatusUpdateRequest DTO — suspendDays 필드 추가
[ ] 4. AdminMemberService.updateStatus() — suspendUntil 계산 로직 추가
[ ] 5. AdminMemberDto — suspendUntil, suspendReason, isVerified, verifiedAt 필드 추가
[ ] 6. GET /api/admin/members/{id}/details 엔드포인트 신규 구현
```

#### 프론트엔드

```
[ ] 7. MemberListPage — 상태 필터 드롭다운 추가
[ ] 8. MemberListPage — 이름 셀 isVerified 인증 아이콘 추가 (ShieldCheck, lucide-react)
[ ] 9. MemberListPage — 정지 모달 기간 선택 라디오 추가 (3일/7일/30일/영구)
[10] MemberListPage — 목록에서 정지 중인 경우 남은 일수 표시
[11] MemberDetailPage.jsx 신규 생성 — /members/:id 라우트 추가
[12] MemberDetailPage — 헤더 (아바타, 기본 정보, 역할/상태/정지/삭제 버튼)
[13] MemberDetailPage — 언더라인 탭 (활동 요약 / 사진 / 시리즈 / 문의)
[14] MemberDetailPage — 활동 요약 탭 (KPI 카드 + 최근 사진 + 정지 이력)
[15] MemberDetailPage — 사진 탭 (기존 PhotoListPage API 재활용, memberId 고정)
[16] MemberDetailPage — 시리즈 탭 (기존 SeriesListPage API 재활용)
[17] MemberDetailPage — 문의 탭 (기존 InquiryListPage API 재활용)
[18] App.jsx — /members/:id 라우트 추가
```

### 8-2. P1 — 단기 (예상 2~3일)

```
[ ] 19. CSV 내보내기 (백엔드 + 프론트엔드)
[ ] 20. AdminVerificationController 신규 생성
[ ] 21. AdminVerificationService 신규 생성
[ ] 22. VerificationListPage.jsx 신규 생성 (/verifications)
[ ] 23. 인증 심사 SlideOver 컴포넌트
[ ] 24. 회원 상세 페이지 — 인증 신청 카드 노출
```

### 8-3. 의존성 다이어그램

```
P0 백엔드 (1~6) → P0 프론트엔드 (7~18)
                    ↓
              P1 CSV (19)
              P1 인증 (20~24)
```

---

## 9. 디자인 가이드

### 9-1. 공통 컨벤션 (CLAUDE.md 준수)

- CSS 변수 `var(--color-*)` 전용 (하드코딩 금지)
- 이미지: `<ImgWithFallback />` 컴포넌트 사용
- 탭: Cosmos 스타일 언더라인 슬라이딩 인디케이터 (JS `offsetLeft + offsetWidth`)
- 애니메이션: 탭 콘텐츠 전환 시 `opacity 0→1, translateY 8px→0`
- 아이콘: lucide-react (`ShieldCheck`, `User`, `Image`, `MessageSquare`, `BookOpen`, `FolderOpen`)

### 9-2. 상태 배지 색상

| 상태 | 클래스 | 색상 |
|------|--------|------|
| ACTIVE | `badge-green` | 초록 |
| SUSPENDED | `badge-red` | 빨강 |
| INACTIVE | `badge-yellow` | 노랑 |
| DELETED | `badge-red` | 빨강 |

### 9-3. 회원 상세 페이지 레이아웃

```css
/* 회원 상세 페이지 구조 */
.member-detail-page { max-width: 960px; margin: 0 auto; }
.member-profile-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: 28px; margin-bottom: 24px; }
.member-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--color-brand-100); color: var(--color-brand-600); font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.member-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--color-border); margin-bottom: 24px; position: relative; }
.member-tab { padding: 10px 20px; font-size: 14px; font-weight: 600; color: var(--color-text-secondary); cursor: pointer; border: none; background: none; }
.member-tab.active { color: var(--color-brand-500); }
.member-tab-indicator { position: absolute; bottom: -2px; height: 2px; background: var(--color-brand-500); transition: left 0.2s ease, width 0.2s ease; }
.member-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.member-kpi-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 20px; text-align: center; box-shadow: var(--shadow-sm); }
```

### 9-4. 정지 기간 선택 UI

```css
.suspend-period-group { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.period-chip {
  padding: 6px 14px; border-radius: var(--radius-full); font-size: 13px; font-weight: 600;
  border: 1.5px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.15s;
}
.period-chip.selected { border-color: var(--color-danger); background: var(--color-danger-bg); color: var(--color-danger); }
.period-chip:hover:not(.selected) { border-color: var(--color-brand-400); }
```

---

## 구현 파일 목록

### 신규 생성 파일

| 파일 | 역할 |
|------|------|
| `frontend/src/pages/MemberDetailPage.jsx` | 회원 상세 페이지 |
| `frontend/src/pages/MemberDetailPage.css` | 회원 상세 스타일 |
| `frontend/src/pages/VerificationListPage.jsx` | 작가 인증 목록 (P1) |
| `frontend/src/pages/VerificationListPage.css` | 작가 인증 스타일 (P1) |
| `backend/.../controller/AdminVerificationController.java` | 인증 관리 API (P1) |
| `backend/.../service/AdminVerificationService.java` | 인증 비즈니스 로직 (P1) |
| `backend/.../dto/VerificationDto.java` | 인증 DTO (P1) |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `MemberListPage.jsx` | 상태 필터, 인증 배지, 정지 모달 기간 선택 추가 |
| `AdminMemberController.java` | details 엔드포인트, status 파라미터 추가 |
| `AdminMemberService.java` | getMembers status 필터, updateStatus suspendDays 처리 |
| `AdminMemberDto.java` | suspendUntil, isVerified 등 필드 추가 |
| `StatusUpdateRequest.java` | suspendDays 필드 추가 |
| `MemberRepository.java` | searchMembers() status 조건 추가 |
| `App.jsx` | `/members/:id` 라우트 추가 |
| `Sidebar.jsx` | `/verifications` 이미 추가됨 ✅ |
