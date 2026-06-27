# Happiness Admin — App 기능 이관 기획서

> **목적**: `happiness-app` 에 구현된 기능 중 어드민이 관리·감독해야 할 기능을 `happiness-admin` 으로 이관
> **기준 분기**: App 브랜치 분석일 2026-06-23 기준
> **디자인 컨셉**: Cosmos × Pinterest 퓨전 (COSMOS_DESIGN_SPEC.md + PINTEREST_DESIGN_SPEC.md 기준)

---

## 현재 구현 현황 (2026-06-23 기준)

| # | 기능 | 백엔드 엔드포인트 | 프론트엔드 페이지 | 구현 상태 |
|---|------|----------------|----------------|---------|
| 1 | 갤러리 순서 관리 | `PUT /api/admin/photos/reorder` ❌ | `/gallery-order` ❌ | **미구현 (P0)** |
| 2 | 방문자 분석 | `GET /api/admin/analytics/**` ❌ | `/analytics` ❌ | **미구현 (P0)** |
| 3 | 납품 포털 | `GET /api/admin/deliveries/**` ❌ | `/deliveries` ❌ | **미구현 (P1)** |
| 4 | 촬영 예약 | `GET /api/admin/bookings/**` ❌ | `/bookings` ❌ | **미구현 (P1)** |
| 5 | 장르 분류 | `GET /api/admin/genres/**` ❌ | `/genres` ❌ | **미구현 (P1)** |
| 6 | 보안 감사 로그 | `GET /api/admin/audit-logs/**` ❌ | `/audit-logs` ❌ | **미구현 (P2)** |
| 7 | 태그 관리 | `GET /api/admin/tags/**` ❌ | `/tags` ❌ | **미구현 (P2)** |
| 8 | 신고/제재 | `GET /api/admin/reports/**` ❌ | `/reports` ❌ | **미구현 (P2)** |

> **다음 구현 우선순위**: P0 (갤러리 순서 → 방문자 분석) → P1 (납품/예약/장르) → P2 (보안/태그/신고)

---

## 1. 분석 요약 — 이관 대상 기능 목록

### 1.1 App에 존재하는 기능 vs Admin 현황

| # | 기능 | App 구현 상태 | Admin 현황 | 이관 우선순위 |
|---|------|-------------|-----------|-------------|
| 1 | **갤러리 순서 관리** | ✅ `/admin/gallery-order` | ❌ 없음 | 🔴 P0 |
| 2 | **방문자 분석 대시보드** | ✅ AnalyticsEvent 엔티티 + API | ❌ 없음 | 🔴 P0 |
| 3 | **납품 포털 관리** | ✅ DeliverySet 엔티티 + API | ❌ 없음 | 🟠 P1 |
| 4 | **촬영 예약 관리** | ✅ Booking 엔티티 + API | ❌ 없음 | 🟠 P1 |
| 5 | **장르 분류 관리** | ✅ 12종 genre 기획 완료 | ❌ 없음 | 🟠 P1 |
| 6 | **보안 감사 로그** | ✅ SecurityAuditLog 엔티티 | ❌ 없음 | 🟡 P2 |
| 7 | **태그 현황 관리** | ✅ PhotoTag 엔티티 | ❌ 없음 | 🟡 P2 |
| 8 | **신고/제재 시스템** | ⬜ 기획 중 | ❌ 없음 | 🟡 P2 |

### 1.2 현재 Admin 기능 (이미 구현)

```
✅ 대시보드 (요약 통계)
✅ 회원 관리 (목록·검색·권한)
✅ 사진 관리 (목록·삭제·카테고리 코드)
✅ 포트폴리오 관리 (승인·반려·비공개)
✅ 시리즈 관리
✅ 문의 관리
✅ 통계 페이지
✅ 5단계 카테고리 코드 시스템
```

---

## 2. P0 — 갤러리 순서 관리 (Gallery Order)

### 2.1 배경

App의 `/gallery/sort` (PhotoSortPage)는 **사용자 앱에서 제거**됐다.
표시 순서(`displayOrder`) 관리는 **어드민 전용 기능**으로 이관된다.
작가가 직접 드래그하던 UI를 어드민이 대신 관리하는 형태로 전환.

### 2.2 기능 정의

```
진입 경로: 사이드바 → 사진 관리 → [갤러리 순서]
URL: /gallery-order
```

| 기능 | 설명 |
|------|------|
| 작가 선택 | 드롭다운으로 회원 선택 → 해당 작가 사진 로드 |
| 드래그 정렬 | HTML5 Drag & Drop으로 순서 변경 |
| Dirty 상태 | 변경 사항 있을 때 경고 배너 표시 |
| 이탈 경고 | `beforeunload` — 미저장 시 브라우저 경고 |
| 일괄 저장 | `PUT /api/admin/photos/reorder` — [{id, displayOrder}] 배열 |
| 되돌리기 | 원래 로드된 순서로 초기화 |
| 자동 정렬 | 날짜순 / 좋아요순 / 색감순 자동 정렬 버튼 |

### 2.3 Pinterest 디자인 — 갤러리 순서 페이지

```
┌──────────────────────────────────────────────────────────────────┐
│  갤러리 순서 관리                                                  │
│  드래그로 표시 순서를 변경한 뒤 저장하세요                          │
├──────────────────────────────────────────────────────────────────┤
│  [작가 선택 ▾]           사진 24장        [날짜순] [좋아요순]      │
│                                                                  │
│  ⚠️ 저장하지 않은 변경사항이 있습니다        [되돌리기] [순서 저장] │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  ①  ──────┐  ②  ──────┐  ③  ──────┐  ④  ──────┐    │    │
│  │     │     │     │     │     │     │     │     │    │    │
│  │     │img  │     │img  │     │img  │     │img  │ ⠿ │    │
│  │     │     │     │     │     │     │     │     │    │    │
│  │     └─────┘     └─────┘     └─────┘     └─────┘    │    │
│  │  제목1          제목2          제목3          제목4  │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

**카드 상태별 스타일**

```css
/* 기본 */
.order-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-pin);
  cursor: grab;
  position: relative;
}

/* 드래그 중 */
.order-card.dragging {
  opacity: 0.4;
  transform: scale(1.02);
  box-shadow: var(--shadow-lg);
  cursor: grabbing;
}

/* 드롭 타겟 */
.order-card.drag-over {
  border: 2px dashed var(--pin-red);
  background: var(--pin-red-light);
}

/* 순서 번호 뱃지 */
.order-badge {
  position: absolute; top: 8px; left: 8px;
  background: var(--pin-red); color: #fff;
  width: 24px; height: 24px; border-radius: 50%;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
```

**저장 버튼 상태**

```
미변경: 비활성 (gray)         변경됨: 활성 (pin-red)         저장됨: 완료 (green)
[순서 저장]                  [● 순서 저장]                 [✓ 저장됨]
```

### 2.4 API 설계

```
GET  /api/admin/photos?memberId={id}&sortBy=displayOrder&size=100
PUT  /api/admin/photos/reorder
     Body: [{ id: 1, displayOrder: 0 }, { id: 2, displayOrder: 1 }, ...]

Response: { updated: 24, message: "순서가 저장되었습니다." }
```

### 2.5 백엔드 구현 포인트

```java
// AdminPhotoController 추가
@PutMapping("/reorder")
public ResponseEntity<?> reorder(@RequestBody List<ReorderRequest> items) {
    photoService.reorder(items); // displayOrder 일괄 업데이트
    return ResponseEntity.ok(Map.of("updated", items.size()));
}

// ReorderRequest DTO
public record ReorderRequest(Long id, int displayOrder) {}
```

---

## 3. P0 — 방문자 분석 대시보드 (Visitor Analytics)

### 3.1 배경

App에 `AnalyticsEvent` 엔티티와 `AnalyticsController` 가 구현되어 있다.
이벤트 타입: `PORTFOLIO_VIEW`, `PHOTO_VIEW`, `PHOTO_LIKE`, `PHOTO_SAVE`, `INQUIRY_SENT`
어드민은 **플랫폼 전체 + 개별 작가 단위** 분석을 볼 수 있어야 한다.

### 3.2 기능 정의

| 기능 | 설명 |
|------|------|
| 플랫폼 KPI | 전체 포트폴리오 방문 수 / 좋아요 / 저장 / 문의 건수 |
| 기간 선택 | 7일 / 30일 / 90일 / 1년 |
| 추이 차트 | 일별 이벤트 수 라인 차트 (Recharts) |
| 인기 작가 TOP 5 | 방문 수 기준 |
| 인기 사진 TOP 5 | 좋아요 기준 |
| 작가별 드릴다운 | 특정 작가 선택 → 해당 작가 analytics |
| 이벤트 타입 필터 | PORTFOLIO_VIEW / PHOTO_VIEW / PHOTO_LIKE 등 |

### 3.3 Pinterest 디자인 — 분석 대시보드

```
┌──────────────────────────────────────────────────────────────────┐
│  방문자 분석                          [7일] [30일] [90일] [1년]   │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │ 포트폴리오   │ │   총 좋아요  │ │   총 저장    │ │ 문의 수 │ │
│  │   방문 수    │ │              │ │              │ │         │ │
│  │   12,847    │ │    3,421    │ │     891     │ │    67   │ │
│  │  ↑ 23%     │ │  ↑ 8%      │ │  ↓ 2%      │ │ ↑ 50%  │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  방문 추이                                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                        /\                │    │
│  │                               /\     /  \               │    │
│  │                    /\        /  \   /    \              │    │
│  │          /\       /  \______/    \_/      \___          │    │
│  │    ─────/  \─────/                                       │    │
│  │  6/17  6/18  6/19  6/20  6/21  6/22  6/23              │    │
│  └──────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│  인기 작가 TOP 5             인기 사진 TOP 5                       │
│  ┌───────────────────┐       ┌──────────────────┐               │
│  │  1. 김하늘  3,241 │       │  1. [img] 봄의 기억 1,241│        │
│  │  2. 이민지  2,891 │       │  2. [img] 여름의 끝  892│         │
│  │  3. 박준호  1,447 │       │  3. [img] 황혼        678│        │
│  │  4. 최수아   891 │       │  4. [img] 골든아워   421│         │
│  │  5. 정태양   672 │       │  5. [img] 첫눈       334│         │
│  └───────────────────┘       └──────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

**KPI 카드 컴포넌트**

```css
.analytics-kpi-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  box-shadow: var(--shadow-pin);
  display: flex; flex-direction: column; gap: 8px;
}
.kpi-number {
  font-size: var(--text-3xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-text-primary);
  line-height: 1;
}
.kpi-delta-up   { color: var(--color-success); font-size: var(--text-xs); }
.kpi-delta-down { color: var(--color-danger);  font-size: var(--text-xs); }
```

**기간 선택 Pills**

```css
.period-pills { display: flex; gap: 6px; }
.period-pill {
  padding: 6px 14px; border-radius: var(--radius-full);
  font-size: var(--text-sm); font-weight: var(--fw-medium);
  background: var(--color-surface-2); border: 1.5px solid var(--color-border);
  color: var(--color-text-secondary); cursor: pointer;
  transition: all var(--dur-fast);
}
.period-pill.active {
  background: var(--pin-red); border-color: var(--pin-red); color: #fff;
}
```

### 3.4 API 설계

```
GET /api/admin/analytics/summary?period=7d
    Response: { portfolioViews, photoViews, likes, saves, inquiries,
                portfolioViewsDelta, likesDelta, ... }

GET /api/admin/analytics/daily?period=30d&eventType=PORTFOLIO_VIEW
    Response: [{ date: "2026-06-01", count: 142 }, ...]

GET /api/admin/analytics/top-members?period=30d&limit=5
    Response: [{ memberId, authorName, viewCount }, ...]

GET /api/admin/analytics/top-photos?period=30d&limit=5
    Response: [{ photoId, title, thumbnailUrl, likesCount }, ...]

GET /api/admin/analytics/member/{memberId}?period=30d
    Response: { kpi, daily, topPhotos } (작가 단위 드릴다운)
```

### 3.5 백엔드 구현 포인트

```java
// AdminAnalyticsController.java
@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    @GetMapping("/summary")
    public ResponseEntity<?> summary(@RequestParam(defaultValue = "7d") String period) {
        // AnalyticsEventRepository에서 기간별 집계
        // period → LocalDateTime.now().minusDays(7/30/90/365)
    }

    @GetMapping("/daily")
    public ResponseEntity<?> daily(
        @RequestParam(defaultValue = "30d") String period,
        @RequestParam(required = false) String eventType) {
        // GROUP BY DATE(created_at) COUNT(*)
    }

    @GetMapping("/top-members")
    public ResponseEntity<?> topMembers(
        @RequestParam(defaultValue = "30d") String period,
        @RequestParam(defaultValue = "5") int limit) {
        // GROUP BY member_id ORDER BY count DESC LIMIT :limit
    }
}
```

---

## 4. P1 — 납품 포털 관리 (Client Delivery Portal)

### 4.1 배경

App에 `DeliverySet` 엔티티가 구현되어 있다.
작가가 클라이언트에게 비공개 토큰 링크로 사진을 공유하는 기능.
어드민은 **플랫폼 전체 납품 현황을 감독**해야 한다:
- 만료 임박 납품 세트 알림
- 클라이언트 피드백 내용 검토
- 분쟁 발생 시 납품 내용 확인

### 4.2 기능 정의

| 기능 | 설명 |
|------|------|
| 납품 세트 목록 | 작가 / 상태 / 만료일 / 클라이언트명 필터 |
| 상태 필터 | PENDING / REVIEWED / APPROVED / REJECTED |
| 만료 임박 | D-7 이내 만료 세트 강조 표시 |
| 상세 보기 | 납품 사진 목록 / 클라이언트 피드백 |
| 강제 만료 | 어드민 강제 토큰 무효화 |
| 통계 | 월별 납품 건수 / 승인률 |

### 4.3 Pinterest 디자인 — 납품 관리 페이지

```
┌──────────────────────────────────────────────────────────────────┐
│  납품 포털 관리                                     총 89건       │
├──────────────────────────────────────────────────────────────────┤
│  [전체] [대기 32] [열람됨 24] [승인 28] [반려 5]                  │
│  🔍 [클라이언트명, 작가명 검색]          [만료 임박 ▾] [최신순 ▾] │
├──────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ 홍길동 웨딩 스드메         김하늘(@user1)      ● APPROVED   │  │
│ │ 클라이언트: 홍길동         42장 · 2026.06.10   만료 D-18    │  │
│ │ [열람 기록] [피드백 보기] [강제 만료]                        │  │
│ ├─────────────────────────────────────────────────────────────┤  │
│ │ 이준혁 프로필 촬영         박준호(@user3)      ● PENDING    │  │
│ │ 클라이언트: 이준혁         12장 · 2026.06.18   만료 D-5 ⚠  │  │
│ │ [열람 기록] [피드백 보기] [만료 연장] [강제 만료]            │  │
│ └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**만료 임박 뱃지 스타일**

```css
/* D-7 이내 — 경고 */
.expire-warn {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--color-warning); font-size: var(--text-xs); font-weight: 700;
}
/* D-3 이내 — 위험 */
.expire-danger {
  color: var(--color-danger); animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 4.4 API 설계

```
GET  /api/admin/deliveries?status=&memberId=&page=
GET  /api/admin/deliveries/stats
     Response: { total, pending, reviewed, approved, rejected, expiringIn7days }
GET  /api/admin/deliveries/{id}
     Response: DeliverySet + photos[] + feedback
DELETE /api/admin/deliveries/{id}/expire   (강제 만료)
```

---

## 5. P1 — 촬영 예약 관리 (Booking Management)

### 5.1 배경

App에 `Booking` 엔티티와 `BookingController` 가 구현되어 있다.
상태 흐름: `REQUESTED → CONFIRMED / REJECTED / CANCELLED`
어드민은 **분쟁 발생 시 예약 내역 조회** 및 **플랫폼 예약 현황 모니터링** 이 필요하다.

### 5.2 기능 정의

| 기능 | 설명 |
|------|------|
| 예약 목록 | 작가명 / 클라이언트명 / 촬영일 / 상태 필터 |
| 상태 필터 | REQUESTED / CONFIRMED / REJECTED / CANCELLED |
| 기간 필터 | 촬영일 기준 날짜 범위 |
| 상세 보기 | 예약 정보 (촬영 종류, 날짜, 메모, 연락처) |
| 월별 캘린더 뷰 | 전체 예약을 달력으로 시각화 |
| 통계 | 월별 예약 건수 / 확정률 / 취소율 |

### 5.3 Pinterest 디자인 — 예약 관리 페이지

```
┌──────────────────────────────────────────────────────────────────┐
│  촬영 예약 관리                                     총 156건       │
├──────────────────────────────────────────────────────────────────┤
│  [목록 보기] [캘린더 보기]                                         │
│  [전체] [대기 23] [확정 98] [거절 12] [취소 23]                    │
│  🔍 [작가명, 클라이언트명 검색]           [이번 달 ▾] [최신순 ▾]   │
├──────────────────────────────────────────────────────────────────┤
│  ── 목록 뷰 ──────────────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 2026.06.28 토     웨딩 스냅                  ● CONFIRMED   │  │
│  │ 작가: 김하늘(@user1)  클라이언트: 홍길동부부  D-5          │  │
│  │ [상세 보기]                                                 │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ 2026.07.02 수     가족 촬영                  ● REQUESTED   │  │
│  │ 작가: 박준호(@user3)  클라이언트: 이민수가족  D+9          │  │
│  │ [상세 보기]                                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ── 캘린더 뷰 ────────────────────────────────────────────────   │
│  [2026년 6월 ◀ ▶]                                               │
│  Mo  Tu  We  Th  Fr  Sa  Su                                     │
│  ──  ──  ──  ──  ──  ──  ──                                     │
│  ··  ··  ··  ··  ··  1   2                                      │
│  3   4   5   6   7  [8●] 9       ← ● = 예약 있음               │
│  ··  ··  ··  ··  ··  ··  ··                                     │
└──────────────────────────────────────────────────────────────────┘
```

**캘린더 날짜 셀 스타일**

```css
.cal-day { width: 40px; height: 40px; border-radius: 50%; display: flex;
           align-items: center; justify-content: center; font-size: var(--text-sm);
           cursor: pointer; position: relative; }
.cal-day:hover { background: var(--warm-200); }
.cal-day.has-booking::after {
  content: '';
  position: absolute; bottom: 4px;
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--pin-red);
}
.cal-day.today { background: var(--pin-red); color: #fff; font-weight: 700; }
```

### 5.4 API 설계

```
GET /api/admin/bookings?status=&memberId=&from=&to=&page=
GET /api/admin/bookings/stats?year=2026&month=6
    Response: { total, requested, confirmed, rejected, cancelled,
                byDay: { "2026-06-08": 3, "2026-06-15": 1, ... } }
GET /api/admin/bookings/{id}
```

---

## 6. P1 — 장르 분류 관리 (Genre Classification)

### 6.1 배경

App의 기획서(DESIGN_PROMPTS/26)에 **12종 장르 분류** 시스템이 정의되어 있다.

| 코드 | 이모지 | 한글명 |
|------|--------|--------|
| PORTRAIT | 👤 | 인물 |
| WEDDING | 💍 | 웨딩 |
| LANDSCAPE | 🏔 | 풍경 |
| NATURE | 🌿 | 자연 |
| STREET | 🚶 | 스트리트 |
| ARCHITECTURE | 🏛 | 건축 |
| FOOD | 🍽 | 음식 |
| TRAVEL | ✈️ | 여행 |
| FASHION | 👗 | 패션 |
| LIFESTYLE | ☀️ | 라이프스타일 |
| COMMERCIAL | 📦 | 상업 |
| FINE_ART | 🎨 | 파인아트 |

어드민은 **장르별 사진 현황 모니터링** 및 **장르 추가/수정/비활성화** 를 해야 한다.

### 6.2 기능 정의

| 기능 | 설명 |
|------|------|
| 장르 현황 카드 | 장르별 사진 수 / 작가 수 / 이번 달 업로드 수 |
| 사진 드릴다운 | 특정 장르 클릭 → 해당 장르 사진 목록 |
| 장르 추가/수정 | 코드 / 한글명 / 영문명 / 이모지 / 정렬순서 / 활성여부 |
| 장르 비활성화 | 비활성화된 장르는 앱 업로드 폼에서 숨김 |

### 6.3 Pinterest 디자인 — 장르 관리 페이지

```
┌──────────────────────────────────────────────────────────────────┐
│  장르 분류 관리                                    [+ 장르 추가]   │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  💍 웨딩     │ │  👤 인물     │ │  🏔 풍경     │            │
│  │  사진 1,284  │ │  사진 892    │ │  사진 634    │            │
│  │  작가 42명   │ │  작가 89명   │ │  작가 31명   │            │
│  │  이번달 +23  │ │  이번달 +18  │ │  이번달 +7   │            │
│  │  [사진 보기] │ │  [사진 보기] │ │  [사진 보기] │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  🌿 자연     │ │  🚶 스트리트 │ │  🏛 건축     │            │
│  │  사진 447    │ │  사진 312    │ │  사진 189    │            │
│  │  ...         │ │  ...         │ │  ...         │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 API 설계

```
GET  /api/admin/genres
     Response: [{ code, nameKo, nameEn, emoji, photoCount, memberCount,
                  monthlyUploads, active, sortOrder }]

POST /api/admin/genres
     Body: { code, nameKo, nameEn, emoji, sortOrder }

PATCH /api/admin/genres/{code}
      Body: { nameKo?, nameEn?, emoji?, active?, sortOrder? }

GET  /api/admin/genres/{code}/photos?page=&size=
     (해당 장르의 사진 목록)
```

### 6.5 백엔드 구현 포인트

```java
// Genre enum 또는 PhotoGenre 엔티티 (App에서 이관)
// Photo 엔티티에 genre 필드 추가 필요
// @Column(length = 20) private String genre;  // PORTRAIT, WEDDING, ...
// @Column(length = 40) private String subGenres; // "LIFESTYLE,FASHION" (콤마 구분)
```

---

## 7. P2 — 보안 감사 로그 (Security Audit Log)

### 7.1 배경

App에 `SecurityAuditLog` 엔티티와 `@AuditLog` AOP 어노테이션이 구현되어 있다.
어드민 액션(로그인 / 권한 변경 / 삭제 / 승인)에 대한 감사 로그가 필요하다.

### 7.2 기능 정의

| 기능 | 설명 |
|------|------|
| 로그 목록 | 액션 타입 / 수행자 / 대상 / 시간 |
| 필터 | 액션 타입 / 어드민 계정 / 기간 |
| 상세 | 변경 전후 값 diff 표시 |
| 검색 | 대상 ID / 어드민 이메일 검색 |

### 7.3 Pinterest 디자인 — 감사 로그

```
┌──────────────────────────────────────────────────────────────────┐
│  보안 감사 로그                                                    │
├──────────────────────────────────────────────────────────────────┤
│  [삭제 ▾] [승인 ▾] [권한변경 ▾]  🔍 [어드민 이메일 검색]          │
├──────────────────────────────────────────────────────────────────┤
│  ┌──── 2026-06-23 ──────────────────────────────────────────┐    │
│  │ 14:32  PHOTO_DELETE    admin@happiness.dev   사진 #1247  │    │
│  │ 14:28  PORTFOLIO_APPROVE                     포트폴리오 #89│   │
│  │ 13:55  MEMBER_ROLE_CHANGE  WM→SA             회원 #342   │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──── 2026-06-22 ──────────────────────────────────────────┐    │
│  │ 18:42  PORTFOLIO_REJECT                     포트폴리오 #88│    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

**로그 타입별 색상**

```css
.log-action-delete  { color: var(--color-danger); }
.log-action-approve { color: var(--color-success); }
.log-action-reject  { color: var(--color-warning); }
.log-action-role    { color: var(--color-info); }
.log-action-login   { color: var(--color-text-secondary); }
```

### 7.4 API 설계

```
GET /api/admin/audit-logs?action=&adminId=&from=&to=&page=
    Response: Page<SecurityAuditLogDto>
```

---

## 8. P2 — 태그 현황 관리 (Tag Management)

### 8.1 기능 정의

| 기능 | 설명 |
|------|------|
| 태그 클라우드 | 전체 태그 사용 빈도 시각화 |
| 태그 목록 | 태그명 / 사용 사진 수 / 최근 사용일 |
| 태그 삭제 | 특정 태그를 모든 사진에서 제거 |
| 태그 병합 | 두 태그를 하나로 통합 |

### 8.2 Pinterest 디자인 — 태그 관리

```
┌──────────────────────────────────────────────────────────────────┐
│  태그 관리                          🔍 [태그 검색]                 │
├──────────────────────────────────────────────────────────────────┤
│  태그 클라우드                                                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  #웨딩(342) #인물(289) #스냅(241) #야외(198) #포트레이트  │    │
│  │  #골든아워(156) #소프트(134) #로맨틱(121) #봄(98) ...    │    │
│  └──────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│  태그명        사용 수   최근 사용      액션                        │
│  #웨딩         342장   2026.06.22    [병합] [삭제]                │
│  #인물         289장   2026.06.23    [병합] [삭제]                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. 공통 디자인 패턴 (Pinterest 컨셉 적용)

### 9.1 페이지 헤더 공통 구조

```
┌──────────────────────────────────────────────────────────────────┐
│  [페이지 제목]                                    [주요 액션 버튼] │
│  [상태 요약 / 총 건수]                                            │
│  ──────────────────────────────────────────────────────────────  │
│  [Stat Card][Stat Card][Stat Card][Stat Card]                    │
│  ──────────────────────────────────────────────────────────────  │
│  [Filter Pills]                     [검색] [정렬▾]               │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 데이터 없음 / 로딩 상태

```css
/* Pin Skeleton — 로딩 중 */
.pin-skeleton-grid {
  column-count: 4; column-gap: 16px;
}
.pin-skeleton-card {
  break-inside: avoid; margin-bottom: 16px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg,
    var(--warm-200) 25%, var(--warm-300) 50%, var(--warm-200) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* 빈 상태 */
.pin-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: var(--space-16); color: var(--color-text-tertiary);
  gap: var(--space-4);
}
.pin-empty-icon { font-size: 3rem; opacity: 0.4; }
.pin-empty-title { font-size: var(--text-lg); font-weight: var(--fw-semibold); color: var(--color-text-secondary); }
.pin-empty-desc  { font-size: var(--text-sm); }
```

### 9.3 테이블 → 카드 전환 방침

기존 어드민의 `<table>` 기반 UI를 Pinterest 카드로 전환하는 기준:

| 콘텐츠 타입 | 권장 레이아웃 |
|-----------|------------|
| 사진/포트폴리오 | ✅ Masonry Card Grid |
| 예약/납품 목록 | ✅ 리스트 카드 (이미지 없음) |
| 로그/감사 기록 | ✅ 타임라인 (날짜별 그룹) |
| 통계/분석 | ✅ KPI Card + 차트 |
| 장르/카테고리 | ✅ 아이콘 카드 Grid |
| 회원 목록 | ✅ 테이블 유지 (정보 밀도 필요) |

---

## 10. 사이드바 확장 계획

현재 사이드바에 이관 기능들을 추가한 최종 네비게이션 구조:

```
🔥  (로고)
────
🏠  대시보드
────
👥  회원 관리
📷  사진 관리
    └─ 갤러리 순서 (sub)       ← NEW (P0)
📁  포트폴리오
📚  시리즈
🎭  장르 관리                   ← NEW (P1)
🏷  태그 관리                   ← NEW (P2)
────
💬  문의 관리
📦  납품 포털                   ← NEW (P1)
📅  촬영 예약                   ← NEW (P1)
────
📊  통계
📈  방문자 분석                  ← NEW (P0)
────
🔐  감사 로그                   ← NEW (P2)
⚙️  시스템
────
🌙  다크모드 토글
👤  내 계정
```

아이콘 레일 (68px) 구조 — 그룹별 구분선으로 분리:

```css
.rail-divider {
  width: 32px; height: 1px;
  background: var(--color-border);
  margin: 8px 0;
}
```

---

## 11. 구현 우선순위 & 일정

### Phase A — P0 (즉시 구현, 1주)

| 작업 | 예상 시간 |
|------|---------|
| 갤러리 순서 관리 페이지 (`/gallery-order`) | 1일 |
| `PUT /api/admin/photos/reorder` 백엔드 | 0.5일 |
| 방문자 분석 페이지 (`/analytics`) | 1.5일 |
| `AdminAnalyticsController` 백엔드 | 1일 |
| 사이드바 네비게이션 업데이트 | 0.5일 |
| **합계** | **4.5일** |

### Phase B — P1 (2주 내)

| 작업 | 예상 시간 |
|------|---------|
| 납품 포털 관리 (`/deliveries`) | 1.5일 |
| 촬영 예약 관리 (`/bookings`) | 1.5일 |
| 장르 분류 관리 (`/genres`) | 1일 |
| 각 백엔드 Controller 추가 | 1.5일 |
| **합계** | **5.5일** |

### Phase C — P2 (3주 내)

| 작업 | 예상 시간 |
|------|---------|
| 보안 감사 로그 (`/audit-logs`) | 1일 |
| 태그 관리 (`/tags`) | 0.5일 |
| **합계** | **1.5일** |

---

## 12. 기술 요구사항 요약

### 백엔드 신규 엔드포인트

```
# P0
PUT  /api/admin/photos/reorder
GET  /api/admin/analytics/summary
GET  /api/admin/analytics/daily
GET  /api/admin/analytics/top-members
GET  /api/admin/analytics/top-photos

# P1
GET  /api/admin/deliveries
GET  /api/admin/deliveries/{id}
DELETE /api/admin/deliveries/{id}/expire
GET  /api/admin/bookings
GET  /api/admin/bookings/{id}
GET  /api/admin/bookings/stats
GET  /api/admin/genres
POST /api/admin/genres
PATCH /api/admin/genres/{code}

# P2
GET  /api/admin/audit-logs
GET  /api/admin/tags
DELETE /api/admin/tags/{id}
PATCH /api/admin/tags/{id}/merge
```

### 프론트엔드 신규 파일

```
src/pages/
  GalleryOrderPage.jsx         ← P0
  AnalyticsPage.jsx            ← P0
  DeliveryListPage.jsx         ← P1
  BookingListPage.jsx          ← P1
  GenreListPage.jsx            ← P1
  AuditLogPage.jsx             ← P2
  TagListPage.jsx              ← P2

src/pages/GalleryOrderPage.css
src/pages/AnalyticsPage.css
src/pages/DeliveryListPage.css
src/pages/BookingListPage.css
src/pages/GenreListPage.css
```

### App에서 재사용 가능한 코드

| App 파일 | Admin 재사용 방법 |
|---------|---------------|
| `AdminGalleryOrderPage.jsx` | `GalleryOrderPage.jsx` 베이스로 사용 |
| `analyticsApi.js` | Admin analytics API 구조 참고 |
| `BookingController.java` | `AdminBookingController` 로 래핑 |
| `DeliverySetController.java` | `AdminDeliveryController` 로 래핑 |
| `SecurityAuditLog.java` | 그대로 사용 |

---

*Happiness Admin — App Feature Migration Spec v1.0*
*작성일: 2026-06-23*
*참조: happiness-app 브랜치 분석 (2026-06-23)*
