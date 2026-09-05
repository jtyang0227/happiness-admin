# 배치 로직 도입 기획서

> **작성 방식**: "배치 로직이 필요하다"는 요청을 받고, 실제로 어디에 필요한지 추측이 아니라
> 코드로 확인했다 — 시간 기반 상태(`suspendUntil`, `expiresAt`, `startsAt`/`endsAt`)를 가진
> 엔티티 5개(Member/Notice/Banner/Popup/FeaturedItem)를 전부 찾아, 각각의 저장된 상태
> 필드가 실제로 시간에 따라 갱신되는지 서비스·레포지토리 코드를 직접 대조했다.
>
> **본 문서는 기획까지만 다룬다. 구현은 별도 커밋으로 진행한다.**

## 1. 실측 결과 — 지금 아무것도 자동으로 안 돌아간다

`backend/src/main/java`에 `@Scheduled`/`@EnableScheduling`이 **단 한 곳도 없다**(grep으로
확인). 즉 이 프로젝트에는 배치 인프라 자체가 아직 없다. 그 상태에서 시간 기반 필드를 가진
5개 엔티티를 하나씩 대조한 결과:

| 엔티티 | 시간 필드 | 저장된 상태 플래그 | 현재 갱신 방식 | 갭 |
|---|---|---|---|---|
| `Member` | `suspendUntil` | `status`(SUSPENDED) | `AdminMemberService.updateStatus()`로 관리자가 수동 변경할 때만 | **정지 기간이 지나도 관리자가 "정지 해제"를 누르기 전까지 영구히 SUSPENDED로 남는다** |
| `Notice` | `expiresAt` | `status`(문자열, 주석에 `"DRAFT/PUBLISHED/EXPIRED"`라고 명시) | `AdminNoticeService`가 요청값 그대로 저장만 함 | **EXPIRED로 설계된 상태값인데 아무도 전이시키지 않는다** — 만료된 공지가 계속 PUBLISHED로 보임 |
| `Banner` | `startsAt`/`endsAt` | `isActive`(boolean) | 생성 시 값만 저장, 이후 아무 데서도 날짜와 대조 안 함 | `isActive=true`로 만든 배너는 `startsAt`/`endsAt`과 무관하게 계속 노출됨 — **날짜 필드가 사실상 장식**임을 코드로 확인 |
| `Popup` | `startsAt`/`endsAt` | `isActive`(boolean) | `PopupRepository`에 `(startsAt IS NULL OR startsAt <= :now) AND (endsAt IS NULL OR endsAt >= :now)` **동적 쿼리가 이미 있음** | 실서빙 경로는 이미 정확함 — 배치 불필요. 다만 관리자 목록의 `isActive` 표시가 "지금 실제로 뜨는지"와 별개일 수 있다는 표시상 불일치만 남음(우선순위 낮음) |
| `FeaturedItem` | `startsAt`/`endsAt` | 없음(상태 플래그 자체가 없음) | `FeaturedItemRepository.findAllByOrderByDisplayOrderAsc()`가 **날짜 조건 없이 전체 반환** | 배치가 아니라 별도 버그에 가깝다 — 애초에 날짜로 거를 곳이 없다. 본 문서 범위에서 제외하고 §6에 별도 기록 |

**결론**: "배치 로직이 필요한 부분"은 명확히 3곳이다 — **회원 정지 자동 해제, 공지사항 자동
만료, 배너 자동 활성/비활성 전환.** Popup은 이미 해결돼 있고, FeaturedItem은 배치가 아니라
필터링 누락이라는 다른 종류의 문제라 이번 범위에서 제외한다.

## 2. 왜 지금까지 안 드러났는가

세 경우 모두 "관리자가 목록에서 상태를 보고 수동으로 처리"하는 것이 지금까지의 유일한
경로였다 — 데이터 양이 적은 개발/초기 운영 단계에서는 관리자가 직접 챙기면 티가 안 난다.
운영 기간이 길어지고 정지 건수·공지·배너가 쌓일수록 "이미 끝났어야 하는데 안 끝난 것"이
누적되는 구조적 문제다.

## 3. 배치 설계

### 3.1 실행 방식

별도 스케줄러 인프라(Quartz, 외부 cron)는 과하다 — Railway에 단일 프로세스로 상시 구동되는
백엔드이므로 Spring `@Scheduled` + `@EnableScheduling`으로 충분하다. 새 패키지
`com.happiness.admin.batch`에 배치 컴포넌트를 모은다.

```java
@Configuration
@EnableScheduling
public class SchedulingConfig { }

@Component
@RequiredArgsConstructor
public class ExpirationBatchJob {

    private final MemberRepository memberRepository;
    private final NoticeRepository noticeRepository;
    private final BannerRepository bannerRepository;
    private final AdminActivityLogRepository activityLogRepository;

    @Scheduled(cron = "0 */10 * * * *") // 10분마다 — §5에서 최종 주기 논의
    @Transactional
    public void unsuspendExpiredMembers() { ... }

    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void expireNotices() { ... }

    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void syncBannerActiveState() { ... }
}
```

세 메서드를 하나의 크론에 몰아도 되고 분리해도 된다 — 서로 독립적이라 실패해도 나머지에
영향 없음. 초안은 분리해서 각각 실패가 격리되게 한다.

### 3.2 각 배치의 정확한 조건

**회원 정지 자동 해제**
```sql
UPDATE members SET status = 'ACTIVE', suspend_until = NULL, suspend_reason = NULL
WHERE status = 'SUSPENDED' AND suspend_until IS NOT NULL AND suspend_until <= NOW()
```
- `suspend_until IS NULL`인 정지(영구 정지, `AdminMemberService`에서 `suspendDays`가 0/null일
  때의 케이스)는 대상에서 제외 — 영구 정지는 배치가 손대면 안 된다. 이미 조건에 `IS NOT NULL`로
  반영됨.

**공지사항 자동 만료**
```sql
UPDATE notices SET status = 'EXPIRED'
WHERE status = 'PUBLISHED' AND expires_at IS NOT NULL AND expires_at <= NOW()
```

**배너 자동 활성/비활성 전환**
- 시작 시각 도래: `isActive=false` + `startsAt <= NOW()` + (`endsAt IS NULL OR endsAt > NOW()`) → `isActive=true`
- 종료 시각 경과: `isActive=true` + `endsAt IS NOT NULL` + `endsAt <= NOW()` → `isActive=false`
- 관리자가 명시적으로 꺼둔 배너(`isActive=false`이고 애초에 기간이 아직 안 됐거나 이미
  지난 경우)는 건드리지 않는다 — "지금이 그 기간이라서 켜졌어야 하는데 안 켜진 것"과
  "그 기간이 지나서 꺼졌어야 하는데 안 꺼진 것"만 정정한다.

### 3.3 감사 로그 연동

`AdminActivityLog.adminId`/`adminName`은 둘 다 nullable이고 `adminName`은 조인이 아니라
문자열 저장이라(코드 확인) 시스템 주체를 넣어도 깨지지 않는다:

```java
activityLogRepository.save(AdminActivityLog.builder()
    .adminId(null)
    .adminName("시스템(자동)")
    .action("MEMBER_AUTO_ACTIVATE")
    .targetType("MEMBER").targetId(member.getId())
    .details("정지 기간 만료로 자동 해제")
    .build());
```

프론트 `SystemPage.jsx`의 `ACTION_LABELS` 맵에 없는 액션은 원문 그대로 표시되므로(안 깨짐,
`ACTION_LABELS[log.action] || log.action`) 새 액션 3종(`MEMBER_AUTO_ACTIVATE`,
`NOTICE_AUTO_EXPIRE`, `BANNER_AUTO_TOGGLE`)을 추가해 한글 라벨을 붙여준다 — 관리자 활동
히트맵·로그에 "시스템이 한 일"과 "사람이 한 일"이 구분돼 보이는 부수 효과도 있다.

## 4. 엣지 케이스

- **멱등성**: 세 쿼리 모두 `WHERE` 조건에 현재 상태를 포함하므로(예: `status='SUSPENDED'`
  일 때만) 같은 배치가 여러 번 돌아도 이미 처리된 행은 다시 안 걸린다.
- **서버 다운타임**: `@Scheduled`는 "다음 실행 시각에 조건에 맞는 전체"를 다시 조회하는
  방식이라, 서버가 몇 시간 꺼져 있다가 켜져도 그 사이 만료됐어야 할 항목들이 다음 실행에
  한 번에 정리된다 — 놓치는 시간대가 없다.
- **동시 수정 충돌**: 배치가 도는 바로 그 순간 관리자가 같은 회원의 정지를 수동 해제하면
  레이스가 있을 수 있으나, 두 경로 다 최종 상태가 ACTIVE라 결과가 같다 — 실질적 충돌 없음.
- **영구 정지 보호**: 위 3.2에서 이미 반영 — `suspend_until IS NULL`(영구)은 배치 대상에서
  명시적으로 제외.

## 5. 남은 결정 사항 (구현 착수 전 확인 필요)

- **배치 주기**: 10분 간격으로 초안을 잡았다. 더 즉각적인 반영이 필요하면 1~5분, 부하를
  더 줄이고 싶으면 1시간도 무방하다(회원 정지·공지·배너 모두 "약간 늦게 반영돼도 치명적이지
  않은" 성격) — 운영 감각에 맞춰 조정 가능.
- **Popup 포함 여부**: 실서빙은 이미 정확하지만, 관리자 목록의 `isActive` 표시를 "지금
  실제로 노출 중"과 일치시키고 싶다면 Popup도 같은 배치에 포함시킬 수 있다 — 기능적으로는
  불필요, UI 일관성 차원의 선택 사항.
- **FeaturedItem 별도 처리**: 본 문서 범위 밖으로 뺐지만, 날짜 필드가 아예 필터링에
  안 쓰이는 건 배치와 무관하게 한 번은 짚어야 할 문제다 — 별도 이슈로 다룰지, 이번 배치
  작업에 묶어서 `FeaturedItemRepository`에 날짜 조건 쿼리를 추가할지 결정 필요.

## 6. 검증 계획 (구현 시)

- 각 배치 메서드에 단위 테스트 3종(대상 있음/대상 없음/영구 정지 등 제외 대상) —
  `LocalDateTime.now()`를 기준으로 과거/미래 값을 가진 테스트 데이터를 직접 세팅해 검증.
  가짜 시계(Clock 주입) 도입 여부는 구현 시 결정.
- `./gradlew test` + 기존 API 전체 회귀 확인.
- SystemPage 활동 로그·히트맵에 시스템 액션이 정상적으로 집계되는지 Playwright로 확인.
