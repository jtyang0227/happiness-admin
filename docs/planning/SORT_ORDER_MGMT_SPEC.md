# 정렬 순서 관리 기획서

> **목적**: 어드민에서 설정한 정렬 순서가 앱(happiness-app)의 갤러리·시리즈·포트폴리오 화면에 즉시 반영되는 통합 순서 관리 시스템
>
> **작성일**: 2026-06-26
> **연동 방식**: 동일 DB 공유 → Admin이 `displayOrder` 값을 쓰면, App API가 해당 값으로 정렬해서 응답

---

## 1. 현황 분석

### 1.1 현재 `displayOrder` 지원 현황

| 엔티티 | 필드 | 현황 | 비고 |
|--------|------|------|------|
| `Photo` | `displayOrder` | ❌ **없음** | 현재 `createdAt DESC` 고정 정렬 |
| `Series` | `displayOrder` | ❌ **없음** | 현재 `createdAt DESC` 고정 정렬 |
| `SeriesPhoto` | `displayOrder` | ✅ 있음 | 시리즈 내 사진 순서 (앱에서만 변경 가능) |
| `PortfolioItem` | `displayOrder` | ✅ 있음 | 포트폴리오 아이템 순서 (앱에서만 변경 가능) |

### 1.2 문제점

```
1. 사진 갤러리 순서
   앱: GET /api/photos?memberId=X → createdAt DESC 고정
   → 작가가 큐레이션한 노출 순서 설정 불가
   → 어드민도 수동 변경 불가

2. 시리즈 순서
   작가 프로필의 시리즈 목록 → createdAt DESC 고정
   → 대표 시리즈를 상단 노출 불가

3. 시리즈 내 사진 순서 / 포트폴리오 아이템 순서
   SeriesPhoto.displayOrder, PortfolioItem.displayOrder 존재하지만
   → 앱 클라이언트에서만 변경 가능, 어드민 UI 없음
   → 작가 계정 접근 없이 운영팀이 수정 불가
```

### 1.3 앱 연동 구조

```
┌────────────────────────────────────────────────────────────────────┐
│                        공유 DB (H2 → MySQL)                        │
│                                                                    │
│   Photo.displayOrder   SeriesPhoto.displayOrder                   │
│   Series.displayOrder  PortfolioItem.displayOrder                 │
└─────────────────┬──────────────────────┬──────────────────────────┘
                  │                      │
          ┌───────▼──────┐    ┌──────────▼──────────┐
          │  Admin API   │    │       App API        │
          │  (8081)      │    │  GET /photos         │
          │  PUT /reorder│    │  → ORDER BY          │
          │  (쓰기)      │    │  displayOrder ASC,   │
          └──────────────┘    │  createdAt DESC      │
                              │  (읽기)              │
                              └─────────────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │   happiness-app    │
                              │   갤러리 화면      │
                              │   시리즈 상세      │
                              │   포트폴리오 상세  │
                              └────────────────────┘
```

**실시간 반영**: Admin에서 저장 → DB 즉시 업데이트 → App 다음 API 요청 시 반영 (캐시 무효화 고려)

---

## 2. 데이터 모델 변경

### 2.1 Photo 엔티티 — `displayOrder` 추가

```java
// Photo.java 에 추가
@Column(name = "display_order", nullable = false)
@Builder.Default
private int displayOrder = 0;  // 0 = 미설정 (기본 createdAt 정렬)
```

**정렬 우선순위 규칙**:
```sql
ORDER BY
  CASE WHEN display_order = 0 THEN 1 ELSE 0 END ASC,  -- 설정된 것 우선
  display_order ASC,                                    -- 설정값 순서
  created_at DESC                                       -- 미설정은 최신순
```

### 2.2 Series 엔티티 — `displayOrder` 추가

```java
// Series.java 에 추가
@Column(name = "display_order", nullable = false)
@Builder.Default
private int displayOrder = 0;
```

### 2.3 변경 요약 테이블

| 파일 | 변경 | 영향 범위 |
|------|------|---------|
| `Photo.java` | `displayOrder` 필드 추가 | 갤러리 노출 순서 |
| `Series.java` | `displayOrder` 필드 추가 | 프로필 시리즈 순서 |
| `PhotoRepository` | `displayOrder` 포함 정렬 쿼리 추가 | App API 정렬 변경 |
| `SeriesRepository` | `displayOrder` 포함 정렬 쿼리 추가 | App API 정렬 변경 |
| Admin DTO 2종 | `displayOrder` 노출 추가 | - |

---

## 3. 정렬 관리 페이지 구조 (3종)

```
/sort/photos            — 사진 갤러리 순서 (작가 선택 → 전체 사진 DnD)
/sort/series            — 시리즈 순서 (작가 선택 → 시리즈 DnD)
/sort/series/:id        — 시리즈 내 사진 순서 (해당 시리즈 사진 DnD)
/sort/portfolio/:id     — 포트폴리오 아이템 순서 (해당 포트폴리오 DnD)
```

**진입 경로**:
- 사이드바: `사진 관리 → 갤러리 순서` / `시리즈 → 순서`
- 시리즈 목록 행 우측 `[순서]` 버튼 → `/sort/series/:id`
- 포트폴리오 목록 행 우측 `[순서]` 버튼 → `/sort/portfolio/:id`

---

## 4. Type A — 사진 갤러리 순서 관리 (`/sort/photos`)

### 4.1 기능 정의

| 기능 | 설명 |
|------|------|
| 작가 선택 | 드롭다운 → 해당 작가 사진 전체 로드 |
| 드래그 앤 드롭 | 카드 순서 변경 (HTML5 DnD) |
| 순서 번호 뱃지 | 각 카드 좌상단에 현재 순서 번호 표시 |
| Dirty 상태 표시 | 변경 시 저장 버튼 강조 + 노란 경고 배너 |
| 이탈 경고 | `beforeunload` — 미저장 시 브라우저 네이티브 경고 |
| 자동 정렬 | 날짜순 ↓ / 좋아요순 ↓ / 저장수순 ↓ 빠른 정렬 버튼 |
| 되돌리기 | 원래 로드된 순서로 초기화 |
| 저장 | `PUT /api/admin/photos/reorder` → 즉시 앱 반영 |

### 4.2 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────────────┐
│  📷 갤러리 순서 관리                                                  │
│  작가별 사진 노출 순서를 설정합니다. 저장 즉시 앱에 반영됩니다.          │
├─────────────────────────────────────────────────────────────────────┤
│  작가 선택                                                           │
│  ┌──────────────────────────────────────────────────┐              │
│  │  [아바타] 김하늘 @user1   ▾   |  사진 24장       │              │
│  └──────────────────────────────────────────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ⚠️ 3개 항목이 변경되었습니다.           [되돌리기]  [💾 순서 저장]  │
│  [날짜순] [좋아요순] [저장수순]                                       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │  ①      │  │  ②      │  │  ③   ⋮ │  │  ④      │  │  ⑤      │ │
│  │         │  │         │  │         │  │         │  │         │ │
│  │  [img]  │  │  [img]  │  │ dragging│  │  [img]  │  │  [img]  │ │
│  │         │  │         │  │         │  │         │  │         │ │
│  │ 봄의기억 │  │ 황혼    │  │ 여름의끝 │  │ 가을빛  │  │ 첫눈   │ │
│  │ ♥ 241  │  │ ♥ 189  │  │ ♥ 156  │  │ ♥ 98   │  │ ♥ 67   │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │
│                                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ← drop-zone (점선)        │
│  │  ⑥      │  │  ⑦      │  │         │                            │
│  │         │  │         │  │    +    │                            │
│  └─────────┘  └─────────┘  └─────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 카드 상태별 스타일

```css
/* 기본 */
.sort-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: grab;
  border: 2px solid transparent;
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
  user-select: none;
  position: relative;
  overflow: hidden;
}
.sort-card:hover { box-shadow: var(--shadow-md); }

/* 드래그 중 (grabbing) */
.sort-card.dragging {
  opacity: 0.35;
  transform: scale(0.96);
  cursor: grabbing;
}

/* 드롭 대상 위치 하이라이트 */
.sort-card.drag-over {
  border-color: var(--color-brand, #E60023);
  background: var(--color-brand-light, #fff0f1);
  box-shadow: 0 0 0 3px rgba(230, 0, 35, 0.15);
}

/* 순서 번호 뱃지 */
.sort-order-badge {
  position: absolute; top: 8px; left: 8px; z-index: 2;
  width: 24px; height: 24px; border-radius: var(--radius-full);
  background: var(--color-brand, #E60023); color: #fff;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
}

/* 변경된 카드 (dirty) */
.sort-card.changed {
  border-color: var(--color-warning, #f59e0b);
}

/* 드래그 핸들 아이콘 */
.sort-drag-handle {
  position: absolute; top: 8px; right: 8px; z-index: 2;
  color: rgba(255,255,255,0.85); cursor: grab;
  opacity: 0; transition: opacity 0.15s;
}
.sort-card:hover .sort-drag-handle { opacity: 1; }
```

### 4.4 저장 버튼 상태 전이

```
미변경     →   변경됨       →   저장 중     →   완료
[순서 저장]   [● 순서 저장]   [저장 중...]   [✓ 저장됨]
(회색, 비활성)  (Pin Red, 활성)   (로딩 스피너)   (초록, 1.5초 후 원상복귀)
```

```css
.save-btn { transition: all 0.2s; }
.save-btn--idle    { background: var(--color-surface-2); color: var(--color-text-tertiary); }
.save-btn--dirty   { background: var(--color-brand, #E60023); color: #fff; }
.save-btn--saving  { background: var(--color-warning, #f59e0b); color: #fff; }
.save-btn--saved   { background: var(--color-success, #22c55e); color: #fff; }
```

### 4.5 자동 정렬 동작

| 버튼 | 정렬 기준 | 효과 |
|------|----------|------|
| 날짜순 | `createdAt DESC` | 최신 사진이 1번 |
| 좋아요순 | `likesCount DESC` | 인기 사진이 1번 |
| 저장수순 | `savesCount DESC` | 많이 저장된 사진이 1번 |

자동 정렬 적용 시 즉시 `dirty` 상태로 전환 → 사용자가 확인 후 저장해야 실제 반영.

---

## 5. Type B — 시리즈 순서 관리 (`/sort/series`)

### 5.1 기능 정의

| 기능 | 설명 |
|------|------|
| 작가 선택 | 드롭다운 → 해당 작가의 시리즈 전체 로드 |
| 시리즈 카드 DnD | 시리즈 커버이미지 + 제목 카드를 드래그 |
| 순서 저장 | `PUT /api/admin/series/reorder` |
| 시리즈 내 순서 진입 | 각 카드에 [사진 순서] 버튼 → `/sort/series/:id` |

### 5.2 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────────────┐
│  📚 시리즈 순서 관리                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  [아바타] 김하늘 @user1 ▾  |  시리즈 6개                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  ①  ┌──────┐  봄 여행 시리즈        사진 12장          ⠿     │  │
│  │     │cover │  2026.03.12 생성        [사진 순서 →]            │  │
│  │     └──────┘                                                  │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  ②  ┌──────┐  웨딩 스냅 컬렉션      사진 8장           ⠿     │  │
│  │     │cover │  2026.05.20 생성        [사진 순서 →]            │  │
│  │     └──────┘                                                  │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  ③  ┌──────┐  가을 포트레이트       사진 15장          ⠿     │  │
│  │     │cover │  2026.06.01 생성        [사진 순서 →]            │  │
│  │     └──────┘                                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                          [되돌리기] [💾 순서 저장]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Type C — 시리즈 내 사진 순서 (`/sort/series/:id`)

### 6.1 기능 정의

| 기능 | 설명 |
|------|------|
| 시리즈 정보 헤더 | 제목 + 총 사진수 + 작가명 |
| 사진 DnD | 시리즈에 속한 사진들을 드래그 |
| 저장 | `PUT /api/admin/series/:id/photos/reorder` |
| 앱 반영 | `SeriesPhoto.displayOrder` 업데이트 → 앱 시리즈 상세 화면에 즉시 반영 |

### 6.2 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← 시리즈 순서                                                        │
│                                                                     │
│  봄 여행 시리즈 · 12장 · 김하늘(@user1)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                          [되돌리기] [💾 순서 저장]   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │  1      │  │  2      │  │  3   ⠿ │  │  4      │              │
│  │ [img]   │  │ [img]   │  │ [img]   │  │ [img]   │              │
│  │ 제목1   │  │ 제목2   │  │ 제목3   │  │ 제목4   │              │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │
│                                                                     │
│  ┌─────────┐  ┌─────────┐                                          │
│  │  5      │  │  6      │                                          │
│  │ [img]   │  │ [img]   │                                          │
│  └─────────┘  └─────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Type D — 포트폴리오 아이템 순서 (`/sort/portfolio/:id`)

### 7.1 기능 정의

| 기능 | 설명 |
|------|------|
| 포트폴리오 정보 헤더 | 제목 + 상태 뱃지 + 작가명 |
| 아이템 DnD | PHOTO / SERIES 아이템 혼합 목록 드래그 |
| 섹션명 편집 | 아이템별 `sectionName` 인라인 편집 |
| 대표 지정 | `isFeatured` 토글 (커버 이미지로 사용) |
| 저장 | `PUT /api/admin/portfolios/:id/items/reorder` |
| 앱 반영 | `PortfolioItem.displayOrder` 업데이트 |

### 7.2 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← 포트폴리오 목록                                                   │
│                                                                     │
│  봄 웨딩 컬렉션 2026  ● APPROVED  김하늘(@user1)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                          [되돌리기] [💾 순서 저장]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⠿ │ ★ │ [img 3×1] 봄 웨딩 스냅  · SERIES · 섹션명: 메인   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ ⠿ │   │ [img]     황혼 포트레이트 · PHOTO  · 섹션명: 서브   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ ⠿ │   │ [img]     결혼식 본식    · PHOTO  · 섹션명: 서브   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ ⠿ │ ★ │ [img 3×1] 야외 촬영     · SERIES · 섹션명: 엔딩   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ⠿ = 드래그 핸들   ★ = 대표(featured) 토글                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. API 설계 (전체)

### 8.1 신규 엔드포인트

| Method | URL | 설명 | 앱 영향 |
|--------|-----|------|--------|
| `GET` | `/api/admin/members?authority=US&size=100` | 작가 목록 (드롭다운용) | — |
| `GET` | `/api/admin/photos?memberId=:id&sortBy=displayOrder&size=200` | 작가 사진 목록 | — |
| `PUT` | `/api/admin/photos/reorder` | 사진 순서 저장 | ✅ 앱 갤러리 즉시 반영 |
| `GET` | `/api/admin/series?memberId=:id&size=100` | 작가 시리즈 목록 | — |
| `PUT` | `/api/admin/series/reorder` | 시리즈 순서 저장 | ✅ 앱 프로필 반영 |
| `GET` | `/api/admin/series/:id/photos` | 시리즈 내 사진 목록 | — |
| `PUT` | `/api/admin/series/:id/photos/reorder` | 시리즈 내 사진 순서 저장 | ✅ 앱 시리즈 상세 반영 |
| `GET` | `/api/admin/portfolios/:id/items` | 포트폴리오 아이템 목록 | — |
| `PUT` | `/api/admin/portfolios/:id/items/reorder` | 포트폴리오 아이템 순서 저장 | ✅ 앱 포트폴리오 반영 |

### 8.2 요청/응답 형식

**사진 순서 저장**
```
PUT /api/admin/photos/reorder
Content-Type: application/json

[
  { "id": 12, "displayOrder": 1 },
  { "id": 7,  "displayOrder": 2 },
  { "id": 23, "displayOrder": 3 },
  ...
]

Response: { "updated": 24, "memberId": 5, "message": "순서가 저장되었습니다." }
```

**시리즈 순서 저장**
```
PUT /api/admin/series/reorder
[
  { "id": 3, "displayOrder": 1 },
  { "id": 1, "displayOrder": 2 },
  ...
]
Response: { "updated": 6 }
```

**시리즈 내 사진 순서 저장**
```
PUT /api/admin/series/8/photos/reorder
[
  { "seriesPhotoId": 45, "displayOrder": 1 },
  { "seriesPhotoId": 32, "displayOrder": 2 },
  ...
]
Response: { "updated": 12, "seriesId": 8 }
```

**포트폴리오 아이템 순서 + 섹션명 저장**
```
PUT /api/admin/portfolios/3/items/reorder
[
  { "itemId": 7, "displayOrder": 1, "sectionName": "메인", "featured": true },
  { "itemId": 2, "displayOrder": 2, "sectionName": "서브", "featured": false },
  ...
]
Response: { "updated": 4, "portfolioId": 3 }
```

### 8.3 앱 API 정렬 변경 (백엔드 수정 사항)

```java
// 사진 정렬 — 앱 API (AppPhotoController)
// 기존: ORDER BY p.createdAt DESC
// 변경:
@Query("SELECT p FROM Photo p WHERE p.member.id = :memberId " +
       "ORDER BY " +
       "  CASE WHEN p.displayOrder = 0 THEN 1 ELSE 0 END ASC, " +
       "  p.displayOrder ASC, " +
       "  p.createdAt DESC")
List<Photo> findByMemberIdOrderByDisplayOrder(@Param("memberId") Long memberId);

// 시리즈 내 사진 정렬 — 앱 API
// SeriesPhoto는 이미 displayOrder 있음 → 쿼리에서 ORDER BY displayOrder ASC 추가
```

---

## 9. 백엔드 구현 명세

### 9.1 신규 DTO

```java
// ReorderRequest.java (범용)
public record ReorderRequest(Long id, int displayOrder) {}

// SeriesPhotoReorderRequest.java
public record SeriesPhotoReorderRequest(Long seriesPhotoId, int displayOrder) {}

// PortfolioItemReorderRequest.java
public record PortfolioItemReorderRequest(
    Long itemId, int displayOrder,
    String sectionName, boolean featured) {}
```

### 9.2 AdminSortController.java (신규)

```java
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminSortController {

    private final AdminSortService sortService;

    // 사진 순서
    @PutMapping("/photos/reorder")
    public ResponseEntity<?> reorderPhotos(@RequestBody List<ReorderRequest> items) {
        int updated = sortService.reorderPhotos(items);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    // 시리즈 순서
    @PutMapping("/series/reorder")
    public ResponseEntity<?> reorderSeries(@RequestBody List<ReorderRequest> items) {
        int updated = sortService.reorderSeries(items);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    // 시리즈 내 사진 순서
    @GetMapping("/series/{id}/photos")
    public ResponseEntity<?> seriesPhotos(@PathVariable Long id) {
        return ResponseEntity.ok(sortService.getSeriesPhotos(id));
    }

    @PutMapping("/series/{id}/photos/reorder")
    public ResponseEntity<?> reorderSeriesPhotos(
            @PathVariable Long id,
            @RequestBody List<SeriesPhotoReorderRequest> items) {
        int updated = sortService.reorderSeriesPhotos(id, items);
        return ResponseEntity.ok(Map.of("updated", updated, "seriesId", id));
    }

    // 포트폴리오 아이템 순서
    @GetMapping("/portfolios/{id}/items")
    public ResponseEntity<?> portfolioItems(@PathVariable Long id) {
        return ResponseEntity.ok(sortService.getPortfolioItems(id));
    }

    @PutMapping("/portfolios/{id}/items/reorder")
    public ResponseEntity<?> reorderPortfolioItems(
            @PathVariable Long id,
            @RequestBody List<PortfolioItemReorderRequest> items) {
        int updated = sortService.reorderPortfolioItems(id, items);
        return ResponseEntity.ok(Map.of("updated", updated, "portfolioId", id));
    }
}
```

### 9.3 AdminSortService.java 핵심 로직

```java
@Transactional
public int reorderPhotos(List<ReorderRequest> items) {
    items.forEach(req -> {
        Photo photo = photoRepository.findById(req.id())
            .orElseThrow(() -> new IllegalArgumentException("사진을 찾을 수 없습니다: " + req.id()));
        photo.setDisplayOrder(req.displayOrder());
        photoRepository.save(photo);
    });
    return items.size();
}

@Transactional
public int reorderSeriesPhotos(Long seriesId, List<SeriesPhotoReorderRequest> items) {
    items.forEach(req -> {
        SeriesPhoto sp = seriesPhotoRepository.findById(req.seriesPhotoId())
            .orElseThrow();
        if (!sp.getSeries().getId().equals(seriesId)) {
            throw new IllegalArgumentException("시리즈 불일치");
        }
        sp.setDisplayOrder(req.displayOrder());
        seriesPhotoRepository.save(sp);
    });
    return items.size();
}
```

---

## 10. 프론트엔드 구현 명세

### 10.1 신규 파일 목록

```
frontend/src/pages/
  SortPhotosPage.jsx          Type A — 사진 갤러리 순서
  SortPhotosPage.css
  SortSeriesPage.jsx          Type B — 시리즈 순서
  SortSeriesPage.css
  SortSeriesDetailPage.jsx    Type C — 시리즈 내 사진 순서
  SortSeriesDetailPage.css
  SortPortfolioPage.jsx       Type D — 포트폴리오 아이템 순서
  SortPortfolioPage.css

frontend/src/hooks/
  useDragSort.js              HTML5 DnD 공통 훅 (4개 페이지 재사용)

frontend/src/utils/
  reorderArray.js             배열 재정렬 유틸
```

### 10.2 `useDragSort` 훅

```js
// 드래그 상태 관리 공통 훅
// - items: 현재 순서 배열
// - isDirty: 원본 대비 변경 여부
// - dragStart / dragOver / drop 이벤트 핸들러
// - reorderAuto(sortKey): 자동 정렬
// - reset(): 원본으로 초기화

const useDragSort = (initialItems, sortKey = 'displayOrder') => {
  const [items, setItems] = useState(initialItems);
  const [original, setOriginal] = useState(initialItems);
  const [draggingId, setDraggingId] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const isDirty = JSON.stringify(items.map(i => i.id)) !==
                  JSON.stringify(original.map(i => i.id));

  const handleDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = items.findIndex(i => i.id === draggingId);
    if (fromIndex === toIndex) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
    setDraggingId(null);
    setOverIndex(null);
  };

  const reset = () => setItems(original);

  const reorderAuto = (key) => {
    setItems(prev => [...prev].sort((a, b) => b[key] - a[key]));
  };

  const toReorderPayload = () =>
    items.map((item, idx) => ({ id: item.id, displayOrder: idx + 1 }));

  return {
    items, isDirty, draggingId, overIndex,
    handleDragStart, handleDragOver, handleDrop,
    reset, reorderAuto, toReorderPayload,
  };
};
```

### 10.3 SortPhotosPage 구조 (핵심 JSX)

```jsx
const SortPhotosPage = () => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [rawItems, setRawItems] = useState([]);
  const [saveState, setSaveState] = useState('idle'); // idle | dirty | saving | saved
  const { items, isDirty, draggingId, overIndex,
          handleDragStart, handleDragOver, handleDrop,
          reset, reorderAuto, toReorderPayload } = useDragSort(rawItems);

  // 저장 상태 동기화
  useEffect(() => {
    setSaveState(isDirty ? 'dirty' : saveState === 'saved' ? 'saved' : 'idle');
  }, [isDirty]);

  // 이탈 경고
  useEffect(() => {
    const handler = e => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = async () => {
    setSaveState('saving');
    try {
      await putApi('/admin/photos/reorder', toReorderPayload());
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      toast.error('저장에 실패했습니다.');
      setSaveState('dirty');
    }
  };

  return (
    <div className="sort-page">
      {/* 헤더, 작가 선택, dirty 배너, 자동정렬, 카드 그리드 */}
    </div>
  );
};
```

### 10.4 공통 SortCard 컴포넌트

```jsx
const SortCard = ({
  item, index, isDragging, isOver,
  onDragStart, onDragOver, onDrop,
}) => (
  <div
    className={[
      'sort-card',
      isDragging ? 'dragging' : '',
      isOver ? 'drag-over' : '',
    ].join(' ')}
    draggable
    onDragStart={e => onDragStart(e, item.id)}
    onDragOver={e => onDragOver(e, index)}
    onDrop={e => onDrop(e, index)}
    onDragEnd={() => {}}
  >
    <span className="sort-order-badge">{index + 1}</span>
    <div className="sort-drag-handle">⠿</div>
    <div className="sort-card-img-wrap">
      <img
        src={item.thumbnailUrl || item.coverImageUrl}
        alt={item.title}
        className="sort-card-img"
        loading="lazy"
      />
    </div>
    <div className="sort-card-body">
      <div className="sort-card-title">{item.title}</div>
      {item.likesCount !== undefined && (
        <div className="sort-card-meta">♥ {item.likesCount}</div>
      )}
    </div>
  </div>
);
```

---

## 11. 라우팅 및 사이드바 추가

### 11.1 App.jsx 라우트 추가

```jsx
// 정렬 관리 (4종)
<Route path="/sort/photos"          element={<ProtectedRoute><SortPhotosPage /></ProtectedRoute>} />
<Route path="/sort/series"          element={<ProtectedRoute><SortSeriesPage /></ProtectedRoute>} />
<Route path="/sort/series/:id"      element={<ProtectedRoute><SortSeriesDetailPage /></ProtectedRoute>} />
<Route path="/sort/portfolio/:id"   element={<ProtectedRoute><SortPortfolioPage /></ProtectedRoute>} />
```

### 11.2 Sidebar.jsx 네비게이션 추가

```jsx
// 사진 관리 그룹
{ path: '/photos',      label: '사진 관리',     Icon: Image },
{ path: '/sort/photos', label: '갤러리 순서',    Icon: GripVertical, sub: true },

// 시리즈 그룹
{ path: '/series',      label: '시리즈',        Icon: BookOpen },
{ path: '/sort/series', label: '시리즈 순서',    Icon: GripVertical, sub: true },
```

---

## 12. UX 세부 규칙

### 12.1 드래그 앤 드롭 UX

| 상황 | 동작 |
|------|------|
| 드래그 시작 | 카드 opacity 35%, grab → grabbing 커서 |
| 드롭 위치 진입 | 점선 border + 연한 Pin Red 배경 |
| 드롭 완료 | 애니메이션 없이 즉시 재정렬 (React state 업데이트) |
| 드롭 취소 (ESC) | 원래 위치 유지 |
| 모바일 | 터치 드래그 미지원 → `[↑] [↓]` 버튼으로 대체 |

### 12.2 Dirty 배너

```
┌────────────────────────────────────────────────────────────────┐
│ ⚠️  N개 항목의 순서가 변경되었습니다.    [되돌리기] [💾 저장]  │
└────────────────────────────────────────────────────────────────┘
```

```css
.dirty-banner {
  display: flex; align-items: center; gap: 12px; justify-content: space-between;
  padding: 12px 16px; border-radius: var(--radius-lg);
  background: var(--color-warning-bg);
  border: 1px solid #fde68a;
  margin-bottom: 16px;
  font-size: var(--text-sm); color: #92400e;
  animation: slideDown 0.2s var(--ease-out);
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 12.3 작가 선택 드롭다운 (공통)

```jsx
// 모든 Sort 페이지 공통 컴포넌트
const MemberSelector = ({ value, onChange }) => {
  const [members, setMembers] = useState([]);
  useEffect(() => {
    getApi('/admin/members?authority=US&size=100')
      .then(r => setMembers(r.content || []));
  }, []);

  return (
    <div className="member-selector">
      <div className="selector-avatar" style={{ background: avatarColor(value?.name) }}>
        {value?.name?.charAt(0) || '?'}
      </div>
      <select
        className="selector-select"
        value={value?.id || ''}
        onChange={e => onChange(members.find(m => m.id === +e.target.value))}
      >
        <option value="">작가를 선택하세요</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>
            {m.name} @{m.profileName || m.email}
          </option>
        ))}
      </select>
    </div>
  );
};
```

---

## 13. 공통 CSS 패턴

### 13.1 정렬 페이지 그리드

```css
/* 사진 / 시리즈 내 사진 — 4열 카드 그리드 */
.sort-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 900px)  { .sort-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px)  { .sort-grid { grid-template-columns: repeat(2, 1fr); } }

/* 시리즈 / 포트폴리오 아이템 — 세로 리스트 */
.sort-list { display: flex; flex-direction: column; gap: 8px; }
.sort-list-item {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: grab;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.15s, background 0.15s;
}
.sort-list-item:hover { box-shadow: var(--shadow-md); }
.sort-list-item.drag-over {
  border-color: var(--color-brand, #E60023);
  background: var(--color-brand-light, #fff0f1);
}
```

### 13.2 카드 이미지 영역

```css
.sort-card-img-wrap {
  aspect-ratio: 4/3; overflow: hidden;
  background: var(--color-surface-2);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}
.sort-card-img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.25s var(--ease-default);
}
.sort-card:hover .sort-card-img { transform: scale(1.04); }

.sort-card-body {
  padding: 10px 12px;
}
.sort-card-title {
  font-size: var(--text-sm); font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sort-card-meta { font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: 2px; }
```

---

## 14. 구현 로드맵

### Phase 1 — P0 (즉시, 3일)

| 작업 | 담당 | 예상 시간 |
|------|------|---------|
| Photo.displayOrder 필드 추가 + migration | Backend | 0.5일 |
| Series.displayOrder 필드 추가 | Backend | 0.25일 |
| AdminSortController + AdminSortService 구현 | Backend | 0.5일 |
| useDragSort 훅 + SortCard 공통 컴포넌트 | Frontend | 0.5일 |
| SortPhotosPage.jsx + css (Type A) | Frontend | 0.5일 |
| SortSeriesDetailPage.jsx (Type C) | Frontend | 0.5일 |
| 사이드바 + 라우팅 추가 | Frontend | 0.25일 |
| **합계** | | **3일** |

### Phase 2 — P1 (1주 내)

| 작업 | 예상 시간 |
|------|---------|
| SortSeriesPage.jsx (Type B — 시리즈 전체 순서) | 0.5일 |
| SortPortfolioPage.jsx (Type D — 포트폴리오 아이템) | 0.5일 |
| 모바일 ↑↓ 버튼 대체 UX | 0.5일 |
| 앱 API 정렬 쿼리 변경 (displayOrder 포함) | 0.5일 |
| **합계** | **2일** |

### Phase 3 — P2 (선택)

| 작업 | 설명 |
|------|------|
| 실시간 미리보기 | 우측 패널에 앱 화면 시뮬레이션 |
| 정렬 히스토리 | 이전 순서로 되돌리기 (최근 3회) |
| 일괄 자동 정렬 | 모든 작가 사진을 좋아요순으로 일괄 재정렬 |

---

## 15. 앱 연동 체크리스트

구현 완료 후 앱 쪽에서 반드시 확인해야 할 사항:

```
□ App GET /api/photos?memberId=X → displayOrder ASC, createdAt DESC 정렬
□ App GET /api/series/:id/photos → SeriesPhoto.displayOrder ASC 정렬  
□ App GET /api/portfolios/:id → PortfolioItem.displayOrder ASC 정렬
□ App GET /api/members/:id/series → Series.displayOrder ASC 정렬
□ 어드민 저장 후 앱 API 호출 시 즉시 반영 확인 (캐시 없을 경우)
□ displayOrder = 0인 사진은 기존 동작 유지 (createdAt DESC)
```

---

*Happiness Admin — Sort Order Management Spec v1.0*
*작성일: 2026-06-26*
*관련 스펙: APP_TO_ADMIN_SPEC.md (Section 2), MEMBER_MGMT_SPEC.md*
