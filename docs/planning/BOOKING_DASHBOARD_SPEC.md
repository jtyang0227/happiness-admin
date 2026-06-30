# 촬영 예약 대시보드 연동 기획서

> **기능명**: 대시보드 — 촬영 예약 현황 위젯  
> **작성일**: 2026-06-30  
> **담당**: Claude Code (구현) / Pomelli (기획) / Stitch (디자인)  
> **연관 스펙**: `APP_TO_ADMIN_SPEC.md` §5 (촬영 예약 관리 P1)  
> **구현 대상 브랜치**: `master`

---

## 1. 배경 및 목적

### 1.1 배경

`happiness-app`에서 사용자는 작가에게 **캘린더로 촬영 날짜를 지정해 약속(예약)**을 잡을 수 있다.  
앱 백엔드에는 `Booking` 엔티티와 `BookingController`가 이미 구현되어 있으며 상태 흐름은 다음과 같다:

```
REQUESTED → CONFIRMED
          → REJECTED
          → CANCELLED
```

현재 어드민 대시보드는 문의(Inquiry) 기반 `shootDate`만 표시하고 있어,  
**확정된 예약 일정을 달력 형태로 한눈에 파악하기 어렵다**.

### 1.2 목적

- 관리자가 대시보드에서 **오늘·이번 주·이번 달 예약 현황**을 즉시 확인한다.
- **캘린더 미니 위젯**으로 날짜별 예약 밀도를 시각화한다.
- 이상 상황(예약 급증·급감, 미확정 예약 적체)을 조기에 감지한다.
- 클릭 한 번으로 `/bookings` 예약 관리 페이지로 이동한다.

---

## 2. 기능 정의

### 2.1 대시보드 변경 요약

| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| 요약 카드 영역 | 회원 수 / 사진 수 / 오늘 문의 / 미읽음 문의 (4개) | 위 4개 유지 + **예약 KPI 카드 2개 추가** (총 6개) |
| 대시보드 중단 | 사진 업로드 차트 / 인기 사진 TOP5 | 위 2개 유지 + **미니 캘린더 위젯 추가** |
| 대시보드 하단 | 최근 문의 5건 테이블 | 위 테이블 유지 + **이번 주 예약 리스트 추가** |

### 2.2 신규 KPI 카드 (2개)

| 카드 | 데이터 | 링크 |
|------|--------|------|
| 오늘 예약 | 촬영일 = 오늘인 CONFIRMED 예약 수 | `/bookings?date=today` |
| 미확정 예약 | 상태 = REQUESTED 전체 수 | `/bookings?status=REQUESTED` |

### 2.3 미니 캘린더 위젯

```
기능:
- 이번 달 달력 표시 (월 이동 버튼 ◀ ▶)
- 예약이 있는 날짜에 도트(●) 표시
- 날짜 클릭 → 해당 날짜의 예약 목록 사이드패널 표시
- 오늘 날짜 강조 (brand color 원형 배경)
- 예약 수에 따라 도트 색상 구분
  · 1~2건: --color-info (파랑)
  · 3~5건: --color-warning (주황)
  · 6건+:  --color-brand  (빨강)
```

### 2.4 이번 주 예약 리스트

```
기능:
- 오늘~7일 이내 촬영일 기준 예약 표시
- 날짜 오름차순 정렬
- 각 항목: 촬영일 / 작가명 / 클라이언트명 / 촬영 종류 / 상태 뱃지
- 최대 10건 표시, 초과 시 "전체 보기 →" 링크
- 빈 상태: "이번 주 예정된 촬영이 없습니다." 문구
```

---

## 3. 화면 설계

### 3.1 대시보드 전체 레이아웃 (변경 후)

```
┌──────────────────────────────────────────────────────────────────────┐
│  대시보드                                                             │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ 👥 전체  │ │ 📷 전체  │ │ 📬 오늘  │ │ 🔔 미읽  │               │
│  │   회원   │ │   사진   │ │  신규문의 │ │  음문의  │               │
│  │  1,284  │ │  8,921  │ │    12    │ │    34   │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│  ┌───────────────────────┐  ┌───────────────────────┐               │
│  │ 📅 오늘 예약           │  │ ⏳ 미확정 예약         │   ← NEW      │
│  │         3건           │  │        18건           │               │
│  │   오늘 촬영 일정       │  │  확정 대기 중인 예약   │               │
│  └───────────────────────┘  └───────────────────────┘               │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌─────────────────────────────┐    │
│  │  최근 7일 사진 업로드       │  │  인기 사진 TOP 5             │    │
│  │  [바 차트]                 │  │  [이미지 + 제목 + 좋아요]     │    │
│  └────────────────────────────┘  └─────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  📅 촬영 예약 캘린더                        [◀ 2026년 6월 ▶]  │  │  ← NEW
│  │  ─────────────────────────────────────────────────────────    │  │
│  │  월  화  수  목  금  토  일                                     │  │
│  │   1   2   3   4   5   6   7                                   │  │
│  │   8   9  10  11  12  13  14                                   │  │
│  │  15  16  17 [18] 19  20  21   ← [18] = 오늘 (brand 배경)      │  │
│  │  22  23  24  25  26  27  28   ← 날짜 아래 ●(도트) = 예약있음  │  │
│  │  29  30                                                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  이번 주 예약 (6.30 ~ 7.6)                    전체 보기 →      │  │  ← NEW
│  │  ──────────────────────────────────────────────────────────   │  │
│  │  촬영일      작가         클라이언트    촬영 종류   상태         │  │
│  │  6.30(월)   김하늘       홍길동 부부   웨딩 스냅  ● CONFIRMED  │  │
│  │  7.02(수)   박준호       이민수 가족   가족 촬영  ● REQUESTED  │  │
│  │  7.04(금)   최수아       정태양       프로필     ● CONFIRMED  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  최근 문의 5건                                전체 문의 보기 → │  │
│  │  [기존 테이블 유지]                                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 캘린더 날짜 클릭 — 사이드패널

```
날짜 클릭 시 오른쪽에서 슬라이드인:

┌─────────────────────────────┐
│  6월 28일 예약 (3건)    [✕] │
├─────────────────────────────┤
│  ● CONFIRMED                │
│  웨딩 스냅                   │
│  작가: 김하늘                │
│  클라이언트: 홍길동 부부      │
│  예산: 800,000원             │
├─────────────────────────────┤
│  ● CONFIRMED                │
│  프로필 촬영                  │
│  작가: 이민지                │
│  클라이언트: 박현우           │
│  예산: 200,000원             │
├─────────────────────────────┤
│  ⏳ REQUESTED               │
│  가족 촬영                   │
│  작가: 정태양                │
│  클라이언트: 최수아 가족      │
│  예산: 350,000원             │
│                              │
│  [예약 관리 전체 보기 →]     │
└─────────────────────────────┘
```

---

## 4. 데이터 모델

### 4.1 Booking 엔티티 (신규 — app에서 이관)

```java
// backend/src/main/java/com/happiness/admin/entity/Booking.java

@Entity
@Table(name = "bookings")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photographer_id")
    private Member photographer;          // 작가 (수신자)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Member client;               // 클라이언트 (요청자)

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "shoot_type", length = 50)
    private String shootType;            // 웨딩 스냅 / 가족 촬영 / 프로필 등

    @Column(name = "shoot_date", nullable = false)
    private LocalDate shootDate;         // 촬영 희망일

    @Column(name = "shoot_location", length = 200)
    private String shootLocation;

    private String budget;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;        // REQUESTED / CONFIRMED / REJECTED / CANCELLED

    @Column(name = "rejected_reason", columnDefinition = "TEXT")
    private String rejectedReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

```java
// BookingStatus.java
public enum BookingStatus {
    REQUESTED, CONFIRMED, REJECTED, CANCELLED
}
```

### 4.2 BookingRepository

```java
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // 오늘 촬영일 + CONFIRMED 예약 수
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.shootDate = :today AND b.status = 'CONFIRMED'")
    long countTodayConfirmed(@Param("today") LocalDate today);

    // 미확정(REQUESTED) 예약 수
    long countByStatus(BookingStatus status);

    // 이번 주 예약 목록 (촬영일 기준)
    @Query("""
        SELECT b FROM Booking b
        WHERE b.shootDate BETWEEN :from AND :to
        ORDER BY b.shootDate ASC, b.createdAt ASC
        """)
    List<Booking> findByShootDateBetween(
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    // 월별 예약 날짜 + 건수 집계 (캘린더 도트용)
    @Query("""
        SELECT b.shootDate, COUNT(b)
        FROM Booking b
        WHERE YEAR(b.shootDate) = :year AND MONTH(b.shootDate) = :month
        GROUP BY b.shootDate
        ORDER BY b.shootDate ASC
        """)
    List<Object[]> countByDay(@Param("year") int year, @Param("month") int month);
}
```

### 4.3 DTO

```java
// AdminBookingDto.java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminBookingDto {
    private Long id;
    private Long photographerId;
    private String photographerName;
    private String photographerProfileName;
    private Long clientId;
    private String clientName;
    private String shootType;
    private LocalDate shootDate;
    private String shootLocation;
    private String budget;
    private String message;
    private String status;
    private String rejectedReason;
    private LocalDateTime createdAt;

    public static AdminBookingDto from(Booking b) { ... }
}

// BookingCalendarDotDto.java — 캘린더 도트용
@Data @AllArgsConstructor
public class BookingCalendarDotDto {
    private LocalDate date;
    private long count;
}

// DashboardBookingStatsDto.java — 대시보드 KPI용
@Data @Builder
public class DashboardBookingStatsDto {
    private long todayConfirmed;      // 오늘 CONFIRMED 예약
    private long pendingRequested;    // 미확정 REQUESTED 예약
}
```

---

## 5. API 설계

### 5.1 대시보드 전용 (기존 stats API 확장)

```
GET /api/admin/stats/summary

기존 Response 필드 유지 + 신규 필드 추가:
{
  "totalMembers":    1284,
  "totalPhotos":     8921,
  "todayInquiries":  12,
  "unreadInquiries": 34,
  "todayBookings":   3,          ← NEW
  "pendingBookings": 18          ← NEW
}
```

변경 최소화를 위해 기존 `StatsSummaryDto`와 `AdminStatsService`만 확장한다.

### 5.2 캘린더 도트 데이터

```
GET /api/admin/bookings/calendar?year=2026&month=6

Response:
[
  { "date": "2026-06-08", "count": 3 },
  { "date": "2026-06-15", "count": 1 },
  { "date": "2026-06-22", "count": 5 },
  { "date": "2026-06-28", "count": 2 }
]
```

### 5.3 특정 날짜 예약 목록 (사이드패널용)

```
GET /api/admin/bookings?date=2026-06-28&status=&page=0&size=20

Response: Page<AdminBookingDto>
```

### 5.4 이번 주 예약 목록

```
GET /api/admin/bookings/this-week

Response: List<AdminBookingDto>  (최대 10건, 촬영일 오름차순)
```

---

## 6. 백엔드 구현

### 6.1 신규 파일

| 파일 | 역할 |
|------|------|
| `entity/Booking.java` | 예약 엔티티 |
| `entity/BookingStatus.java` | 상태 enum |
| `repository/BookingRepository.java` | 쿼리 정의 |
| `dto/AdminBookingDto.java` | 예약 응답 DTO |
| `dto/BookingCalendarDotDto.java` | 캘린더 도트 DTO |
| `service/AdminBookingService.java` | 비즈니스 로직 |
| `controller/AdminBookingController.java` | REST 엔드포인트 |

### 6.2 기존 파일 수정

| 파일 | 수정 내용 |
|------|---------|
| `dto/StatsSummaryDto.java` | `todayBookings`, `pendingBookings` 필드 추가 |
| `service/AdminStatsService.java` | `getSummary()`에서 BookingRepository 조회 추가 |
| `DataInitializer.java` | 테스트용 Booking 데이터 삽입 |
| `config/SecurityConfig.java` | `/api/admin/bookings/**` — `ROLE_WM` or `ROLE_SA` 허용 확인 |

### 6.3 AdminBookingService 핵심 로직

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminBookingService {

    private final BookingRepository bookingRepository;

    // 대시보드 KPI
    public DashboardBookingStatsDto getDashboardStats() {
        return DashboardBookingStatsDto.builder()
            .todayConfirmed(bookingRepository.countTodayConfirmed(LocalDate.now()))
            .pendingRequested(bookingRepository.countByStatus(BookingStatus.REQUESTED))
            .build();
    }

    // 캘린더 도트
    public List<BookingCalendarDotDto> getCalendarDots(int year, int month) {
        return bookingRepository.countByDay(year, month).stream()
            .map(r -> new BookingCalendarDotDto((LocalDate) r[0], (Long) r[1]))
            .toList();
    }

    // 이번 주 예약
    public List<AdminBookingDto> getThisWeek() {
        LocalDate today = LocalDate.now();
        return bookingRepository.findByShootDateBetween(today, today.plusDays(6))
            .stream().map(AdminBookingDto::from).toList();
    }

    // 날짜별 예약 목록
    public Page<AdminBookingDto> getByDate(LocalDate date, Pageable pageable) {
        return bookingRepository.findByShootDate(date, pageable)
            .map(AdminBookingDto::from);
    }
}
```

### 6.4 AdminBookingController

```java
@RestController
@RequestMapping("/api/admin/bookings")
@RequiredArgsConstructor
public class AdminBookingController {

    private final AdminBookingService bookingService;

    @GetMapping("/calendar")
    public ResponseEntity<?> calendar(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(bookingService.getCalendarDots(year, month));
    }

    @GetMapping("/this-week")
    public ResponseEntity<?> thisWeek() {
        return ResponseEntity.ok(bookingService.getThisWeek());
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(bookingService.getList(date, status, PageRequest.of(page, size)));
    }
}
```

### 6.5 DataInitializer 테스트 데이터

```java
// 예약 테스트 데이터 (10건)
// - CONFIRMED 3건 (이번 주 촬영일)
// - REQUESTED 5건 (다음 2주 내)
// - CANCELLED 1건 / REJECTED 1건
```

---

## 7. 프론트엔드 구현

### 7.1 신규 파일

| 파일 | 역할 |
|------|------|
| `components/dashboard/BookingCalendar.jsx` | 미니 캘린더 위젯 컴포넌트 |
| `components/dashboard/BookingCalendar.css` | 캘린더 스타일 |
| `components/dashboard/WeeklyBookingList.jsx` | 이번 주 예약 리스트 컴포넌트 |

### 7.2 기존 파일 수정

| 파일 | 수정 내용 |
|------|---------|
| `pages/DashboardPage.jsx` | KPI 카드 2개 추가 + 캘린더 위젯 + 주간 예약 리스트 삽입 |
| `pages/DashboardPage.css` | stat-grid 6열 확장, 신규 카드 스타일 |

### 7.3 BookingCalendar 컴포넌트 설계

```jsx
// components/dashboard/BookingCalendar.jsx
const BookingCalendar = () => {
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [dots, setDots]   = useState({});          // { "2026-06-28": 3 }
  const [selected, setSelected] = useState(null);  // 선택된 날짜
  const [sideBookings, setSideBookings] = useState([]);

  // 월 변경 시 캘린더 도트 로드
  useEffect(() => {
    getApi(`/admin/bookings/calendar?year=${year}&month=${month}`)
      .then(data => {
        const map = {};
        data.forEach(d => { map[d.date] = d.count; });
        setDots(map);
      });
  }, [year, month]);

  // 날짜 클릭 시 사이드패널 예약 로드
  const handleDayClick = (dateStr) => {
    setSelected(dateStr);
    getApi(`/admin/bookings?date=${dateStr}&size=20`)
      .then(data => setSideBookings(data.content || []));
  };

  // 도트 색상: 1~2=info, 3~5=warning, 6+=brand
  const getDotColor = (count) => {
    if (count >= 6) return 'var(--color-brand)';
    if (count >= 3) return 'var(--color-warning)';
    return 'var(--color-info)';
  };

  return (
    <div className="dashboard-card booking-calendar-card">
      <div className="card-header">
        <h2 className="card-title">촬영 예약 캘린더</h2>
        <div className="cal-nav">
          <button onClick={() => prevMonth()}>◀</button>
          <span>{year}년 {month}월</span>
          <button onClick={() => nextMonth()}>▶</button>
        </div>
      </div>
      <div className="cal-grid">
        {/* 요일 헤더 */}
        {['월','화','수','목','금','토','일'].map(d => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}
        {/* 날짜 셀 */}
        {calDays.map(({ dateStr, day, isCurrentMonth }) => (
          <div
            key={dateStr}
            className={[
              'cal-day',
              isCurrentMonth ? '' : 'cal-day--other',
              dateStr === todayStr ? 'cal-day--today' : '',
              selected === dateStr ? 'cal-day--selected' : '',
              dots[dateStr] ? 'cal-day--has-booking' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => isCurrentMonth && handleDayClick(dateStr)}
          >
            <span className="cal-day-num">{day}</span>
            {dots[dateStr] && (
              <span
                className="cal-dot"
                style={{ background: getDotColor(dots[dateStr]) }}
              />
            )}
          </div>
        ))}
      </div>
      {/* 사이드패널 */}
      {selected && (
        <BookingDayPanel
          date={selected}
          bookings={sideBookings}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};
```

### 7.4 캘린더 CSS

```css
/* components/dashboard/BookingCalendar.css */

.booking-calendar-card { grid-column: 1 / -1; }

.cal-nav {
  display: flex; align-items: center; gap: 12px;
  font-size: var(--text-sm); font-weight: var(--fw-semibold);
  color: var(--color-text-primary);
}
.cal-nav button {
  background: none; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); width: 26px; height: 26px;
  cursor: pointer; color: var(--color-text-secondary); font-size: 11px;
}

.cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 2px; margin-top: 12px;
}
.cal-weekday {
  text-align: center; font-size: var(--text-xs);
  font-weight: var(--fw-semibold); color: var(--color-text-tertiary);
  padding: 6px 0;
}
.cal-day {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 2px;
  height: 44px; border-radius: var(--radius-md);
  cursor: pointer; position: relative;
  transition: background var(--dur-fast);
}
.cal-day:hover { background: var(--color-surface-2); }
.cal-day--other { opacity: 0.3; cursor: default; }
.cal-day--today .cal-day-num {
  background: var(--color-brand); color: #fff;
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: var(--fw-bold);
}
.cal-day--selected { background: var(--color-brand-50); }
.cal-day-num { font-size: var(--text-sm); color: var(--color-text-primary); }
.cal-dot {
  width: 6px; height: 6px; border-radius: 50%;
}

/* 사이드패널 */
.booking-day-panel {
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 320px; background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  overflow-y: auto; padding: 16px;
  animation: slide-in-right 0.2s ease;
}
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

### 7.5 DashboardPage.jsx 주요 변경

```jsx
// 기존 4개 API 호출에 2개 추가
Promise.all([
  getApi('/admin/stats/summary'),       // todayBookings, pendingBookings 필드 추가됨
  getApi('/admin/stats/daily?days=7'),
  getApi('/admin/stats/top-photos?sortBy=likes'),
  getApi('/admin/inquiries?page=0&size=5'),
]).then(([sum, dl, photos, inqs]) => { ... });

// KPI 카드 2개 추가
<StatCard icon="📅" label="오늘 예약"    value={summary?.todayBookings}   color="#0ea5e9" to="/bookings?date=today" />
<StatCard icon="⏳" label="미확정 예약"  value={summary?.pendingBookings} color="#f59e0b" to="/bookings?status=REQUESTED" />

// 캘린더 위젯 삽입 (dashboard-grid 아래)
<BookingCalendar />

// 이번 주 예약 리스트 삽입 (최근 문의 위)
<WeeklyBookingList />
```

---

## 8. 디자인 가이드

### 8.1 예약 상태 뱃지 색상

| 상태 | 한글 | CSS 클래스 | 색상 |
|------|------|-----------|------|
| CONFIRMED | 확정 | `badge-green` | `--color-success` |
| REQUESTED | 대기 | `badge-yellow` | `--color-warning` |
| REJECTED | 거절 | `badge-red` | `--color-danger` |
| CANCELLED | 취소 | `badge-gray` | `--color-text-tertiary` |

### 8.2 KPI 카드 확장 — stat-grid 6열

```css
/* DashboardPage.css 수정 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);  /* 기존 4 → 6 */
  gap: 12px;
}
@media (max-width: 1280px) {
  .stat-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}
```

### 8.3 빈 상태 메시지

```
캘린더: 해당 월 예약 없음 → "이번 달 예약이 없습니다"
주간 리스트: 예약 없음 → "이번 주 예정된 촬영이 없습니다 ☀️"
사이드패널: 해당 날짜 예약 없음 → "해당 날짜에 예약이 없습니다"
```

---

## 9. 구현 순서 (추천)

| 단계 | 작업 | 예상 시간 |
|------|------|---------|
| 1 | `Booking` 엔티티 + `BookingStatus` enum | 30분 |
| 2 | `BookingRepository` — 쿼리 4개 | 30분 |
| 3 | `StatsSummaryDto` + `AdminStatsService` 확장 | 20분 |
| 4 | `AdminBookingService` + `AdminBookingController` | 40분 |
| 5 | `DataInitializer` 테스트 데이터 추가 | 20분 |
| 6 | 백엔드 빌드 검증 + API curl 테스트 | 20분 |
| 7 | `BookingCalendar.jsx` 컴포넌트 구현 | 60분 |
| 8 | `WeeklyBookingList.jsx` 컴포넌트 구현 | 30분 |
| 9 | `DashboardPage.jsx` KPI 카드·위젯 연결 | 30분 |
| 10 | CSS 스타일링 | 30분 |
| 11 | 프론트엔드 빌드 검증 | 10분 |
| **합계** | | **약 5.5시간** |

---

## 10. 향후 확장 고려

이 기획서는 **대시보드 위젯**만 다룬다. 전체 예약 관리 페이지(`/bookings`)는 별도 스펙으로 분리한다.

| 기능 | 스코프 | 참조 |
|------|--------|------|
| `/bookings` 전체 목록 + 필터 + 상세 | 별도 구현 (P1) | `APP_TO_ADMIN_SPEC.md §5` |
| 예약 취소·강제 종료 | `/bookings` 페이지에서 처리 | P1 |
| 예약 분쟁 처리 | 문의 관리와 연계 | P2 |
| 월별 예약 통계 차트 | 통계 페이지 확장 | P2 |

---

*Happiness Admin — 촬영 예약 대시보드 연동 기획서 v1.0*  
*작성일: 2026-06-30*
