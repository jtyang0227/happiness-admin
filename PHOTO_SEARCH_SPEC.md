# 사진 관리 — 키워드 검색 고도화 기획서

> 작성일: 2026-06-20  
> 대상 페이지: `/photos` (PhotoListPage)  
> 현재 상태: 제목·작가명 LIKE 검색 + 색채무드 필터 + 정렬 구현 완료

---

## 0. 현황 분석

### 현재 구현 범위

| 기능 | 상태 | 비고 |
|------|------|------|
| 키워드 검색 (title, member.name) | ✅ | 300ms debounce, JPQL LIKE |
| 색채무드 필터 (단일 선택) | ✅ | WARM·COOL·NEUTRAL·VIVID·DARK·SOFT |
| 정렬 (최신·좋아요·저장·공유) | ✅ | |
| description 필드 검색 | ❌ | Photo.description 필드 미활용 |
| 태그 검색 | ❌ | photo_tags 테이블 미연동 |
| 날짜 범위 필터 | ❌ | |
| 인기도 임계값 필터 | ❌ | |
| 다중 무드 선택 | ❌ | 현재 단일 선택만 |
| 검색 결과 카운트 표시 | ❌ | |
| 검색어 하이라이트 | ❌ | |
| 최근 검색어 저장 | ❌ | |
| 그리드/리스트 뷰 전환 | ❌ | |
| 체크박스 선택 + 벌크 삭제 | ❌ | |
| CSV 내보내기 | ❌ | |
| URL 상태 동기화 | ❌ | 새로고침 시 검색 조건 초기화 |

### 문제 정의

1. **검색 범위 좁음** — 제목·작가명만 검색 가능. description, 태그, profileName(@아이디)은 탐색 불가
2. **필터 조합 제한** — 무드를 1개만 선택 가능, 날짜/인기도 조건 없음
3. **검색 UX 부재** — 결과 수 미표시, 검색어 강조 없음, 빈 결과 안내 없음
4. **URL 미동기화** — 공유·북마크 불가, 새로고침 시 검색 조건 소멸
5. **대량 작업 불가** — 검색 후 일괄 삭제/내보내기 수단 없음

---

## 1. 목표 및 범위

### 목표

관리자가 **30만 건 이상의 사진 데이터**에서 원하는 사진을 빠르게 찾고, 확인하고, 처리(삭제·내보내기)할 수 있는 검색 경험 제공

### 핵심 지표

| 지표 | As-Is | To-Be |
|------|-------|-------|
| 검색 가능 필드 수 | 2개 (제목, 작가명) | 6개+ |
| 필터 조합 | 단일 무드만 | 날짜·무드복수·인기도 |
| 검색 → 삭제 평균 클릭 수 | 6클릭 (검색→찾기→개별삭제) | 3클릭 (검색→선택→벌크삭제) |
| 검색 상태 유지 | ❌ | ✅ URL 동기화 |

---

## 2. 기능 상세 기획

### Phase 1 — 검색 범위 확장 (즉시 구현 가능, 백엔드만)

#### 2-1. 설명(description) 필드 검색 추가

현재 `Photo.description` 필드가 DB에 존재하지만 검색에 미포함.

```sql
-- 현재 JPQL
(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%',:search,'%'))
  OR LOWER(p.member.name) LIKE LOWER(CONCAT('%',:search,'%')))

-- 변경 후
(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%',:search,'%'))
  OR LOWER(p.member.name) LIKE LOWER(CONCAT('%',:search,'%'))
  OR LOWER(p.description) LIKE LOWER(CONCAT('%',:search,'%'))
  OR LOWER(p.member.profileName) LIKE LOWER(CONCAT('%',:search,'%')))
```

**추가 검색 필드:** description(설명), member.profileName(@아이디)

#### 2-2. colorMood 한국어 별칭 검색

현재 `search=따뜻한` 입력 시 결과 없음 → 별칭 매핑 추가

| 영문 | 한국어 별칭 | 검색 예시 |
|------|------------|----------|
| WARM | 따뜻한, 웜 | "따뜻", "warm" |
| COOL | 차가운, 쿨 | "차가운", "쿨톤" |
| NEUTRAL | 중성, 뉴트럴 | "중성", "자연스러운" |
| VIVID | 선명한, 비비드 | "선명", "강렬" |
| DARK | 어두운, 다크 | "어두운", "무거운" |
| SOFT | 부드러운, 소프트 | "부드러운", "파스텔" |

**구현:** 서비스 레이어에서 한국어 → 영문 변환 후 colorMood 필터 적용

```java
private String normalizeColorMood(String input) {
    if (input == null) return null;
    Map<String, String> aliases = Map.of(
        "따뜻", "WARM", "웜", "WARM",
        "차가운", "COOL", "쿨", "COOL",
        "중성", "NEUTRAL", "뉴트럴", "NEUTRAL",
        "선명", "VIVID", "비비드", "VIVID",
        "어두운", "DARK", "다크", "DARK",
        "부드러운", "SOFT", "소프트", "SOFT"
    );
    // 별칭 매칭 → colorMood 자동 적용
}
```

---

### Phase 2 — 고급 필터 (백엔드 + 프론트엔드)

#### 2-3. 날짜 범위 필터

```
등록일: [2026-01-01] ~ [2026-06-30]  ← DateRange 입력
```

**백엔드 파라미터:**
- `dateFrom`: LocalDate (ISO 8601)
- `dateTo`: LocalDate

**JPQL 조건 추가:**
```java
"AND (:dateFrom IS NULL OR p.createdAt >= :dateFrom) " +
"AND (:dateTo IS NULL OR p.createdAt <= :dateTo)"
```

**프론트엔드 UI:** 날짜 입력 2개 → `filter-bar`에 인라인 배치. 기간 프리셋 버튼 제공:
- `오늘` `이번 주` `이번 달` `최근 3개월`

#### 2-4. 인기도 임계값 필터

```
좋아요 [  10  ] 개 이상만 표시
```

**백엔드 파라미터:** `minLikes: int` (기본값 0)

**UX:** 슬라이더 또는 숫자 입력 (max: 실제 최대 좋아요 수 동적 조회)

#### 2-5. 다중 색채무드 선택 (멀티셀렉트)

현재 단일 select → 체크박스 드롭다운으로 변경

```
[무드 선택 ▼]
 ☑ WARM   ☑ COOL
 ☐ VIVID  ☑ DARK
 ☐ SOFT   ☐ NEUTRAL
```

**백엔드 파라미터:** `colorMoods: List<String>` (쉼표 구분 or 다중 파라미터)

---

### Phase 3 — 검색 UX 고도화 (프론트엔드)

#### 2-6. URL 상태 동기화

검색 조건을 URL 쿼리 파라미터로 유지 → 새로고침·공유·브라우저 뒤로가기 지원

```
/photos?search=기억&colorMood=WARM&dateFrom=2026-01-01&page=2
```

**구현:** `useSearchParams()` (React Router v6) 활용

```jsx
const [searchParams, setSearchParams] = useSearchParams();
const search   = searchParams.get('search') || '';
const colorMood = searchParams.get('colorMood') || '';
const page     = parseInt(searchParams.get('page') || '0');

// 필터 변경 시
setSearchParams({ search, colorMood, page: '0' });
```

#### 2-7. 검색 결과 카운트 & 빈 결과 처리

```
"기억" 검색 결과 — 2개
┌─────────────────────────────────────┐
│ 봄의 기억          │ 기억             │
└─────────────────────────────────────┘

빈 결과:
┌─────────────────────────────────────┐
│     🔍 "xyzabc"에 대한 결과 없음     │
│   검색어를 다시 확인하거나 필터를     │
│   변경해 보세요.                     │
└─────────────────────────────────────┘
```

#### 2-8. 검색어 하이라이트

검색 결과에서 매칭된 텍스트를 강조 표시

```jsx
const Highlight = ({ text, keyword }) => {
  if (!keyword) return text;
  const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <mark key={i} className="search-highlight">{part}</mark>
      : part
  );
};
```

**적용 위치:** 카드의 `photo-title`, `photo-author`

```css
.search-highlight {
  background: #fef08a;  /* 노란 형광 */
  color: #1e293b;
  border-radius: 2px;
  padding: 0 2px;
}
```

#### 2-9. 최근 검색어 (localStorage)

```
최근 검색어:  [기억 ×]  [웨딩 ×]  [웹관리자 ×]  [전체 삭제]
```

- 최대 10개, 중복 제거, 가장 최근 검색어가 앞에
- 입력 포커스 시 드롭다운으로 표시
- 각 항목 클릭 시 검색어 자동 입력

```js
const RECENT_KEY = 'photo_recent_searches';
const saveRecent = (term) => {
  const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  const updated = [term, ...prev.filter(t => t !== term)].slice(0, 10);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
};
```

#### 2-10. 검색어 자동완성 (Autocomplete)

입력 중 작가명·무드명 후보 표시 (클라이언트 사이드 또는 API)

```
"김" 입력 →  [김민준]  [김채원]  ...
"wa"  입력 →  [WARM]  ...
```

**구현 방식:** 기존 목록 데이터에서 클라이언트 측 필터링 (별도 API 불필요)
- 초기 마운트 시 `GET /api/admin/photos/suggestions` (작가명·무드 목록) 한 번 로드
- 입력어로 필터링 후 드롭다운 표시

---

### Phase 4 — 뷰 모드 전환

#### 2-11. 그리드 / 리스트 뷰 토글

**그리드 뷰 (현재):** 썸네일 중심, 4컬럼

**리스트 뷰 (신규):** 한 줄에 상세 정보 + description 미리보기

```
┌────┬──────────────────┬──────────┬─────┬──────┬──────┬─────────┐
│ ☐  │  [썸]  제목       │ @작가     │ 무드 │ ❤️ 10│ 🔖 5 │ 2026-06 │
│    │        설명 미리보기...        │          │     │      │         │
└────┴──────────────────┴──────────┴─────┴──────┴──────┴─────────┘
```

**토글 버튼:** 우측 상단에 Grid/List 아이콘 버튼

```jsx
// 상태 유지: localStorage에 저장
const [viewMode, setViewMode] = useState(
  localStorage.getItem('photo_view_mode') || 'grid'
);
```

---

### Phase 5 — 벌크 작업

#### 2-12. 체크박스 선택 + 벌크 삭제

**선택 UI:**
- 각 카드/행에 체크박스 추가
- 헤더 "전체 선택" 체크박스
- 선택 시 하단 액션 바 슬라이드업

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3개 선택됨         [선택 해제]  [일괄 삭제 🗑]  [CSV 내보내기 📥]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**백엔드:** `DELETE /api/admin/photos/bulk` (body: `{ ids: [1, 2, 3] }`)

**cascade 순서:** photo_likes → photo_saves → photo_shares → photo_tags → series_photos → photos

#### 2-13. CSV 내보내기

현재 검색 조건 전체 결과를 CSV 파일로 다운로드

**내보내기 필드:**
```
ID, 제목, 설명, 작가명, @아이디, 색채무드, 좋아요수, 저장수, 공유수, 등록일
```

**구현:** 프론트엔드에서 전체 페이지를 순차 호출 후 CSV 생성 (or 백엔드 전용 엔드포인트)

```js
// 클라이언트 사이드 CSV
const downloadCSV = (data) => {
  const rows = [
    ['ID', '제목', '작가명', '색채무드', '좋아요', '저장', '등록일'],
    ...data.map(p => [p.id, p.title, p.authorName, p.colorMood,
                      p.likesCount, p.savesCount, p.createdAt?.slice(0,10)])
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `photos_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
};
```

---

### Phase 6 — 태그 검색 연동

#### 2-14. PhotoTag 테이블 연동

happiness-app의 `photo_tags` 테이블에 사진별 태그가 저장되어 있음.
현재 admin에 `Tag`, `PhotoTag` 엔티티 미정의.

**엔티티 추가:**
```java
@Entity @Table(name = "photo_tags")
public class PhotoTag {
    @Id @GeneratedValue Long id;
    @ManyToOne @JoinColumn(name = "photo_id") Photo photo;
    @Column String tag;
}
```

**JPQL 서브쿼리로 태그 검색 추가:**
```sql
OR EXISTS (
  SELECT 1 FROM PhotoTag pt WHERE pt.photo = p
  AND LOWER(pt.tag) LIKE LOWER(CONCAT('%', :search, '%'))
)
```

**태그 클라우드 UI** (필터 바 아래):
```
인기 태그: [#웨딩] [#스냅] [#야외] [#빈티지] [#흑백] ...
```

---

### Phase 7 — AI 보조 기능 (장기 로드맵)

#### 2-15. 색채 유사 사진 추천

특정 사진의 colorMood + 색상 분포를 기반으로 유사한 분위기의 사진 추천.

**데이터 수집:** 향후 happiness-app에서 색상 팔레트 정보(RGB 대표색) 저장 시 활용

#### 2-16. 자동 무드 재분류 제안

현재 colorMood가 `null`인 사진 (미분류) 목록 집계 →
관리자가 일괄 무드 지정 가능한 UI 제공

```
미분류 사진 14장 — [무드 일괄 지정]
```

---

## 3. 화면 설계

### 3-1. 필터 바 레이아웃 (Phase 1~3 통합 후)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🔍 키워드 검색...          ] [무드 ▾] [정렬 ▾] [날짜 ▾] [Grid|List]│
│ 최근검색: [기억 ×] [웨딩 ×]                     2개 결과 | CSV ↓    │
└─────────────────────────────────────────────────────────────────────┘
```

**레이아웃 원칙:**
- 1행: 핵심 입력 (검색창 + 주요 필터 + 뷰 전환)
- 2행 (검색 중에만 표시): 최근 검색어 + 결과 수 + CSV 버튼
- 모바일: 1행 → 세로 스택, 필터 버튼은 "필터 ▾" 드롭다운으로 통합

### 3-2. 검색 결과 상태별 UI

| 상태 | 표시 |
|------|------|
| 초기 (검색어 없음) | 전체 사진 그리드 |
| 검색 중 (debounce 대기) | 스켈레톤 또는 기존 유지 |
| 검색 결과 있음 | 결과 카운트 + 하이라이트 카드 |
| 검색 결과 없음 | 빈 상태 일러스트 + 안내 문구 |

### 3-3. 상세 모달 (SlideOver)

사진 카드 클릭 시 우측 SlideOver 패널:

```
┌──────────────────────────┐
│  [큰 이미지]              │
│                           │
│  제목: 봄의 기억           │
│  작가: 웹관리자 (@admin)  │
│  무드: WARM               │
│  설명: 봄날의 따뜻한 기억을│
│        담은 사진입니다...  │
│                           │
│  ❤️ 10  🔖 5  🔄 2        │
│  등록일: 2026-06-20       │
│                           │
│  태그: #봄 #야외 #따뜻함   │
│                           │
│  [삭제]              [닫기]│
└──────────────────────────┘
```

---

## 4. API 설계

### 기존 API 확장

```
GET /api/admin/photos
```

| 파라미터 | 타입 | 기존 | 변경 |
|----------|------|------|------|
| `search` | String | ✅ title·authorName | + description·profileName |
| `colorMood` | String | ✅ 단일 | → `colorMoods` List<String> |
| `colorMoods` | String (CSV) | ❌ | 신규: `WARM,COOL` |
| `dateFrom` | LocalDate | ❌ | 신규: `2026-01-01` |
| `dateTo` | LocalDate | ❌ | 신규: `2026-06-30` |
| `minLikes` | int | ❌ | 신규: `10` |
| `sortBy` | String | ✅ | 유지 |
| `page`, `size` | int | ✅ | 유지 |

### 신규 엔드포인트

```
DELETE /api/admin/photos/bulk          → 일괄 삭제 (body: {ids: [1,2,3]})
GET    /api/admin/photos/suggestions   → 자동완성 후보 (작가명 목록)
GET    /api/admin/photos/{id}          → 상세 (description·태그 포함)
```

---

## 5. 구현 우선순위 & 로드맵

### 임팩트 × 난이도 매트릭스

| 기능 | 임팩트 | 난이도 | 우선순위 |
|------|--------|--------|----------|
| description·profileName 검색 추가 | 높음 | 낮음 | **P0** |
| URL 상태 동기화 | 높음 | 낮음 | **P0** |
| 검색 결과 카운트 + 빈 상태 UI | 중간 | 낮음 | **P0** |
| colorMood 한국어 별칭 | 중간 | 낮음 | **P0** |
| 날짜 범위 필터 | 높음 | 중간 | **P1** |
| 다중 무드 선택 | 중간 | 중간 | **P1** |
| 검색어 하이라이트 | 중간 | 낮음 | **P1** |
| 최근 검색어 | 낮음 | 낮음 | **P1** |
| 그리드/리스트 뷰 전환 | 중간 | 중간 | **P2** |
| 체크박스 선택 + 벌크 삭제 | 높음 | 높음 | **P2** |
| CSV 내보내기 | 중간 | 중간 | **P2** |
| 자동완성 Autocomplete | 낮음 | 중간 | **P3** |
| 사진 상세 SlideOver | 중간 | 중간 | **P3** |
| 태그 검색 연동 | 높음 | 높음 | **P3** |
| 인기도 임계값 슬라이더 | 낮음 | 중간 | **P3** |
| AI 유사 사진 추천 | 높음 | 매우 높음 | **장기** |

### 단계별 로드맵

```
Phase 1 (1일) ──────────────────────────────────────
  [x] description·profileName JPQL 추가
  [x] colorMood 한국어 별칭 서비스 변환
  [x] 검색 결과 카운트 표시 (UI)
  [x] 빈 결과 Empty State 컴포넌트
  [x] URL 상태 동기화 (useSearchParams)

Phase 2 (2일) ──────────────────────────────────────
  [ ] 날짜 범위 필터 (백엔드 + 프론트)
  [ ] 다중 색채무드 체크박스 드롭다운
  [ ] 검색어 하이라이트 컴포넌트
  [ ] 최근 검색어 localStorage

Phase 3 (2일) ──────────────────────────────────────
  [ ] 그리드/리스트 뷰 토글
  [ ] 리스트 뷰 레이아웃 (description 미리보기)
  [ ] 사진 상세 SlideOver 패널

Phase 4 (2~3일) ────────────────────────────────────
  [ ] 체크박스 멀티셀렉트 UI
  [ ] 벌크 삭제 API + 하단 액션 바
  [ ] CSV 내보내기 (BOM 포함, Excel 호환)

Phase 5 (3~5일) ────────────────────────────────────
  [ ] PhotoTag 엔티티 연동
  [ ] 태그 검색 JPQL
  [ ] 태그 클라우드 UI

장기 ──────────────────────────────────────────────
  [ ] 자동완성 API + 드롭다운 UI
  [ ] 미분류 사진 일괄 무드 지정
  [ ] AI 기반 유사 사진 추천
```

---

## 6. 기술 결정 사항

### Full-text Search vs LIKE

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| JPQL LIKE (현재) | 추가 설정 불필요 | 대용량 시 느림, 형태소 미지원 | **소규모 유지** |
| PostgreSQL Full-Text Search (tsvector) | 형태소 분석, 성능 우수 | H2 미지원, 인덱스 필요 | 운영 DB 전환 시 고려 |
| Elasticsearch | 최고 성능, 자동완성 | 별도 인프라 | 10만건 이상 시 고려 |

**현재 결정:** H2 개발 환경 유지를 위해 JPQL LIKE 방식 유지.  
PostgreSQL 운영 전환 시 `pg_trgm` 인덱스 + `ILIKE` 개선 적용.

### 검색 debounce 시간

| 환경 | debounce | 이유 |
|------|----------|------|
| 로컬 H2 | 300ms (현재) | 빠른 응답 |
| 운영 PostgreSQL | 500ms | 네트워크 지연 고려 |

### URL 동기화 라이브러리

React Router v6의 `useSearchParams()` 사용 (외부 라이브러리 불필요)

---

## 7. 접근성 & 성능

### 접근성 (WCAG 2.1 AA)
- 검색 입력: `aria-label="사진 키워드 검색"`, `aria-controls="photo-grid"`
- 검색 결과 카운트: `role="status"` `aria-live="polite"` (결과 수 변경 시 스크린리더 고지)
- 빈 상태: `aria-label="검색 결과 없음"` + 검색어 안내 텍스트
- 체크박스: `aria-checked`, `aria-label="[제목] 선택"`

### 성능 최적화
- **Intersection Observer** 로 가상 스크롤 검토 (1000건 이상 그리드)
- **React.memo** 로 개별 PhotoCard 메모이제이션 (검색어 변경 시 불필요한 리렌더 방지)
- **keepPreviousData 패턴** — debounce 대기 중 이전 결과 유지 (깜빡임 방지)

---

## 8. 향후 확장 포인트

1. **저장된 검색 (Saved Searches)** — 자주 쓰는 검색 조건을 "즐겨찾기"로 저장
2. **검색 기록 분석** — 어떤 키워드로 검색이 많은지 → 콘텐츠 트렌드 파악
3. **사진 일괄 무드 재분류** — 검색 결과 전체에 무드 레이블 일괄 변경
4. **중복 사진 탐지** — 동일 작가의 유사 사진 자동 감지 (해시 비교)
5. **신고된 사진 우선 표시** — 향후 신고 시스템 연동 시 `isReported=true` 필터 추가
