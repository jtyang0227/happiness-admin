# 신고·콘텐츠 심사 트리아지 AI 어시스트 — 기획서

> **작성 방식**: "AX 도입"이라는 요청을 받고, 실제로 어디에 필요한지 추측이 아니라 코드로
> 확인했다 — `Report` 엔티티, `AdminReportController`/`AdminReportService`,
> `ReportRepository`, `ReportListPage.jsx`, 그리고 `DataInitializer`의 시드 데이터를 직접
> 읽고 지금 신고 처리 흐름이 정확히 어떻게 동작하는지 대조한 뒤에 설계했다.
>
> **본 문서는 신고 트리아지를 메인으로 다룬다.** 문의 답변 초안·통계 자연어 질의는 §8에
> 향후 확장 후보로만 짧게 언급한다.

## 1. 왜 지금인가

### 1.1 지금 당장 급한 문제는 아니다 — 실측

`DataInitializer.java` 기준 신고 데이터는 **8건**(`for (int i = 0; i < 8; i++)`), 사유
5종(부적절 콘텐츠/스팸/저작권 침해/허위 정보/혐오 발언), 대상 유형 3종(PHOTO/MEMBER/SERIES)
이 전부다. `ReportListPage.jsx`는 페이지당 20건(`size=20`)을 보여주므로 지금 규모에서는
**한 페이지에 전체가 다 들어간다** — 관리자가 "뭐부터 봐야 하는지" 고민할 만큼 목록이
길지 않다. 즉 **오늘 이 순간 트리아지 AI가 없어서 업무가 막히는 상황은 아니다.**

### 1.2 그럼에도 선제적으로 투자할 근거

- **처리 흐름 자체가 이미 "판단 비용"을 요구하는 구조다.** `openReview()`가 신고를 열 때마다
  대상 콘텐츠(`GET /admin/photos|members/series/{id}`)를 별도로 불러오고, 관리자는 신고
  사유·상세·대상 미리보기를 직접 대조한 뒤 5가지 조치(`DISMISS/HIDE_CONTENT/DELETE_CONTENT/
  WARN_AUTHOR/SUSPEND_AUTHOR`) 중 하나를 골라야 한다 — 건당 판단 비용이 이미 존재하고,
  이 비용은 건수와 무관하게 건당 고정이라 **건수가 늘면 총 비용이 선형으로 늘어난다.**
- **목록에 우선순위 신호가 전혀 없다.** 현재 정렬은 `createdAt.descending()`(접수 최신순)
  뿐이고, `PENDING`이면 행 배경색만 다를 뿐(`row-pending`) 심각도·정책위반 가능성 같은
  정렬/필터 기준이 없다 — 8건일 때는 안 보이던 문제지만, 신고가 수십~수백 건으로 늘면
  "최신순으로 위에서부터 다 열어본다"는 지금 방식은 그대로 무너진다.
- **결론**: 이번 작업은 "지금 당장 불끄기"가 아니라, **데이터가 늘기 전에 트리아지 신호를
  먼저 깔아두는 선제적 투자**다. 그래서 MVP는 최소 범위로 좁히고(§6), 비용은 관리자가
  명시적으로 트리거하는 구조로 설계해 규모가 작을 때 불필요한 API 비용이 나가지 않게 한다.

## 2. 대상 화면/데이터 실측

### 2.1 `Report` 엔티티 (`entity/Report.java`)

| 필드 | 타입 | 비고 |
|---|---|---|
| `reporter` | `Member` (LAZY, nullable) | 탈퇴 회원이면 null — 프론트는 `'(탈퇴 회원)'`로 표시 |
| `targetType` | `String` | `PHOTO`/`MEMBER`/`SERIES` |
| `targetId` | `Long` | 대상 PK |
| `reason` | `String(100)` | 신고 사유 카테고리 (자유 문자열, enum 아님) |
| `details` | `String(500)`, nullable | 신고자가 적은 상세 설명 |
| `status` | `String(20)` | `PENDING`/`IN_REVIEW`/`ACTION_TAKEN`/`DISMISSED` |
| `processMemo` | `String(500)`, nullable | 관리자 처리 메모 |
| `processedById`, `processedAt` | | 처리 이력 |
| `createdAt` | | `@PrePersist`로 자동 설정 |

**실측 중 발견한 기존 버그(본 작업 범위 밖, 별도 기록만)**: `DataInitializer`가 시드
데이터를 만들 때 `targetType`이 `MEMBER`/`SERIES`여도 `targetId`는 항상
`photos.get(i % photos.size()).getId())`로 **사진 ID를 그대로 넣는다.** 즉 시드 데이터
기준으로는 `MEMBER`/`SERIES` 타입 신고 중 상당수가 실제 회원/시리즈 ID가 아닌 사진 ID를
가리켜, `openReview()`가 `/admin/members/{id}` 또는 `/admin/series/{id}`를 잘못된 ID로
조회하게 된다(운 좋게 ID가 겹치면 엉뚱한 대상이 뜨고, 없으면 `targetError` 처리). 이 AI
기능은 대상 콘텐츠 조회 실패 시 원본 그대로 "대상 콘텐츠를 찾을 수 없음"으로 폴백하므로
AI 기능 자체는 이 버그에 안전하지만, **트리아지 요약의 정확도 자체가 이 시드 데이터 버그의
영향을 받을 수 있다는 점을 기록해둔다.**

### 2.2 처리 흐름 (`AdminReportService`, `ReportListPage.jsx`)

1. 목록 조회: `GET /admin/reports?status&targetType&page&size` — `status`/`targetType` 필터,
   `createdAt` 내림차순.
2. 상단 카운트 배지: `GET /admin/reports/counts` — 4개 상태별 건수.
3. 관리자가 행 또는 "검토" 버튼 클릭 → `openReview()` → 대상 콘텐츠를 `TARGET_ENDPOINTS`로
   추가 조회(PHOTO→`/admin/photos/{id}`, MEMBER→`/admin/members/{id}`,
   SERIES→`/admin/series/{id}`) → 모달에 신고자/사유/상세/대상 미리보기 표시.
4. 관리자가 5가지 조치 중 하나 선택 + 메모 입력 → `POST /admin/reports/{id}/process`
   → `AdminReportService.process()`가 `status`를 `DISMISSED` 또는 `ACTION_TAKEN`으로 바꾸고,
   `DELETE_CONTENT`일 때만 실제로 사진을 삭제(`deleteTarget()` — 현재 PHOTO만 구현, MEMBER/
   SERIES 삭제는 미구현이며 `default -> ACTION_TAKEN`으로만 상태 전환됨. 이 갭도 본 작업
   범위 밖이라 기록만 한다).
5. `ACTION_TAKEN`/`DISMISSED` 상태는 모달이 읽기 전용으로 바뀌고 "닫기"만 가능.

**핵심 관찰**: 지금 관리자가 판단에 쓰는 입력은 (a) 신고 사유 카테고리, (b) 신고자가 적은
자유 텍스트 상세, (c) 대상 콘텐츠(사진 제목/설명 또는 회원 이름/상태 또는 시리즈 제목/설명)
세 가지뿐이다. AI 트리아지가 요약해야 할 입력 범위도 정확히 이 세 가지로 한정된다 — 그
이상의 맥락(예: 신고자의 과거 신고 이력, 대상의 과거 제재 이력)은 지금 화면에 애초에
없으므로 이번 MVP에서 다루지 않는다.

## 3. AI-사람 경계선

**AI가 하는 일**: 신고 1건을 입력받아 (1) 2문장 이내 한국어 요약, (2) 심각도
`LOW`/`MEDIUM`/`HIGH`, (3) 참고용 처리 방법 제안(`DISMISS`/`HIDE_CONTENT`/`DELETE_CONTENT`/
`WARN_AUTHOR`/`SUSPEND_AUTHOR` 중 하나) — **딱 여기까지만.**

**사람이 하는 일**: 실제 상태 전환(`POST /admin/reports/{id}/process`)은 예외 없이 관리자가
모달에서 조치를 선택하고 "처리 완료" 버튼을 직접 눌러야만 일어난다. AI의 제안은 라디오
버튼의 **초기 선택값을 미리 채워주는 것 이상의 권한을 갖지 않는다** — 관리자가 다른 조치로
바꿔도 되고, AI 요약이 아예 없어도(분석 실패/미실행) 지금과 동일하게 수동으로 처리할 수
있어야 한다. 백엔드 `process()` 엔드포인트는 AI 관련 파라미터를 전혀 받지 않는다 — AI
호출 경로와 실제 조치 실행 경로는 완전히 분리된 별개의 API다. 이렇게 분리해야 "AI가
자동으로 오탐 조치를 내렸다"는 책임 소재 문제가 구조적으로 발생할 수 없다.

## 4. 기술 방식

### 4.1 호출 시점 — 관리자가 명시적으로 트리거하는 온디맨드 배치

세 가지 옵션을 검토했다:

| 옵션 | 문제 |
|---|---|
| 신고 접수 즉시 호출 | 신고 자체는 앱(happiness-app) 사용자가 만드는 이벤트라 admin 백엔드가 알기 어렵고, 스팸성 대량 신고가 들어오면 호출 비용이 관리자 행동과 무관하게 폭증한다 |
| 관리자가 신고 목록 열 때마다 자동 호출 | 페이지네이션(`size=20`)마다, 필터를 바꿀 때마다 재호출되면 같은 신고를 반복 분석하게 되고 비용이 "본 횟수"에 비례해버린다 |
| **관리자가 버튼을 눌러 미분석 건을 일괄 분석 (채택)** | 관리자가 비용 발생 시점을 통제하고, 결과를 `Report`에 캐싱해 같은 신고를 두 번 분석하지 않는다 |

`ReportListPage`에 **"AI 분석 실행"** 버튼을 추가한다. 클릭 시
`POST /admin/reports/ai-triage/run`을 호출 → 아직 분석 안 된(`aiAnalyzedAt IS NULL`) 미결
상태(`PENDING`/`IN_REVIEW`) 신고를 최대 20건까지 한 번에 분석 → 결과를 `Report`에 저장 →
목록을 다시 불러와 배지로 표시한다. 상세 모달을 열 때 추가 API 호출은 없다 — 이미 목록
조회에 AI 결과가 포함돼 있다(§4.3).

### 4.2 백엔드 변경

**`Report` 엔티티에 컬럼 4개 추가** (모두 nullable — 기존 데이터/미분석 건과 호환):
`aiSummary`(String, 500), `aiSeverity`(String, 20: LOW/MEDIUM/HIGH),
`aiSuggestedAction`(String, 20: `ReportProcessRequest.action`과 동일한 값 집합),
`aiAnalyzedAt`(LocalDateTime).

**신규 서비스** `AdminReportAiTriageService`:
- `ReportRepository`에 `findPendingWithoutAiTriage(Pageable)` 쿼리 추가 —
  `status IN ('PENDING','IN_REVIEW') AND aiAnalyzedAt IS NULL ORDER BY createdAt ASC`.
- 신고 1건당 대상 콘텐츠를 기존 리포지토리(`PhotoRepository`/`MemberRepository`/
  `SeriesRepository`)로 조회해 제목/설명(또는 이름/상태) 텍스트를 만들고, 신고 사유·상세와
  합쳐 Claude API에 전달한다.
- 모델은 `claude-api` 스킬의 기본 원칙(명시적 요청이 없는 한 항상 `claude-opus-5`, 비용
  때문에 하위 모델로 낮추지 않는다)을 따르되, 이 작업은 스킬이 명시적으로 "저효용에서도
  잘 되는 대표 사례"로 꼽는 **분류/고빈도 라우트**이므로 모델은 그대로 두고
  `OutputConfig.Effort.LOW` + `ThinkingConfigDisabled`로 비용·지연을 낮춘다(모델 다운그레이드
  대신 effort 파라미터로 비용을 통제 — SDK가 권장하는 방식).
- 응답은 JSON만 반환하도록 프롬프트에 명시하고 `ObjectMapper`로 파싱(마크다운 코드펜스로
  감싸 응답할 가능성을 대비해 파싱 전 ```\s*json 등 펜스를 벗겨낸다), `severity`/
  `suggestedAction` 값이 허용 집합 밖이거나 `summary`가 DB 컬럼 길이(500자)를 넘으면 실패로
  간주(초과분을 자르지 않고 실패 처리 — 모델이 형식을 어겼다는 신호이므로 다음 실행에
  재시도하는 편이 잘린 요약을 저장하는 것보다 안전).
- 신고당 성공/실패를 각각 카운트해 `AiTriageRunResultDto{requested, succeeded, failed}`로
  반환.
- **트랜잭션 경계는 신고 1건 단위다.** 배치 전체를 하나의 `@Transactional`로 묶지 않는다 —
  `runBatch()` 자체는 트랜잭션이 없고, 신고 1건을 분석·저장하는 내부 메서드만
  `@Transactional(propagation = REQUIRES_NEW)`로 독립시킨다. 이렇게 해야 15번째 신고에서
  API 예외가 나도 1~14번째의 저장은 그대로 유지된다 — 그렇지 않으면 하나의 트랜잭션 안에서
  런타임 예외가 이미 성공한 건까지 전부 롤백시켜 "실패한 신고만 건너뛴다"는 §5의 전제가
  깨진다.

**신규 엔드포인트**: `POST /api/admin/reports/ai-triage/run?limit=20`
(`AdminReportController`에 추가). 기존 `/api/admin/reports/**`와 동일하게
`ROLE_WM`/`ROLE_SA`만 접근 가능(전역 시큐리티 설정 그대로 적용됨 — 별도 설정 불필요).

**`AdminReportDto`에 필드 4개 추가**(`aiSummary`/`aiSeverity`/`aiSuggestedAction`/
`aiAnalyzedAt`)해 기존 목록/상세 조회 응답에 그대로 포함시킨다 — 프론트가 상세를 보기 위해
추가 API를 호출할 필요가 없다.

**환경 변수**: `ANTHROPIC_API_KEY` — `application.properties`에 새 키를 하드코딩하지 않고
환경변수로만 주입(JWT 시크릿과 동일한 패턴). 키가 없는 개발 환경에서도 서버 기동이 실패하면
안 되므로 `AnthropicOkHttpClient`는 빈 등록 시점이 아니라 **실제 분석 호출 시점에
지연 생성**한다 — 키가 없으면 그 시점에 예외가 나고 §5의 실패 처리 경로를 그대로 탄다.

### 4.3 프론트 변경 (`ReportListPage.jsx`)

- 필터 바에 **"AI 분석 실행"** 버튼 추가 — 로딩 중 스피너, 완료 시
  `toast.success('N건 분석 완료(M건 실패)')` 후 목록 재조회.
- 목록 테이블에 **"AI 심각도"** 열 추가 — `aiSeverity` 있으면 색상 배지(HIGH=red/MEDIUM=
  yellow/LOW=gray), 없으면 `—`(미분석). 정렬 열 추가는 이번 MVP 범위 밖(§6).
- 검토 모달(`review-target-preview` 아래)에 **AI 요약 블록** 추가 — "AI 제안 · 참고용,
  최종 판단은 관리자가 합니다"라는 고정 라벨과 함께 `aiSummary`/`aiSeverity` 표시.
  `aiSuggestedAction`이 있으면 조치 라디오의 초기 선택값으로만 사용(§3) — 버튼 텍스트나
  동작은 변경하지 않는다.
- `aiSummary`가 없으면(미분석 또는 실패) 이 블록 자체를 렌더링하지 않는다 — 지금 화면과
  동일하게 원본 신고 사유/상세/대상 미리보기만 보인다. 이것이 §5의 실패 폴백이다.

## 5. 비용·지연·실패 처리

- **실패 폴백**: API 호출 실패(네트워크/레이트리밋/키 없음/JSON 파싱 실패) 시 해당 신고는
  `aiAnalyzedAt`을 갱신하지 않고 건너뛴다 — 다음 "AI 분석 실행" 클릭 때 다시 시도 대상에
  포함된다. 프론트는 미분석 건과 실패 건을 구분하지 않고 동일하게 "원본만 표시"로 처리한다
  (사용자 입장에서 둘 다 "아직 AI 도움을 못 받은 상태"로 동일하게 안전).
- **지연 처리 + 타임아웃 위험**: 일괄 분석은 버튼 클릭 후 최대 20건을 순차 호출하므로
  건당 1~3초만 잡아도 총 20~60초가 걸릴 수 있다 — 이는 Railway·브라우저의 기본 요청
  타임아웃(통상 30~60초)을 넘길 수 있는 구간이라, 위 "트랜잭션 경계는 신고 1건 단위"
  설계가 이 문제의 실질적 완화책이다: 프록시가 요청을 끊어도 그 시점까지 분석된 건은
  이미 `aiAnalyzedAt`이 채워져 저장돼 있으므로, 관리자가 실패 토스트를 보고 버튼을 다시
  누르면 나머지 미분석 건만 이어서 처리된다 — 데이터 손실이나 중복 과금 없이 "여러 번
  나눠 완료"되는 구조. 프론트는 이 실패를 일반 네트워크 에러와 동일하게 처리하면 되고
  별도 재시도 로직을 새로 만들 필요는 없다.
  버튼은 처리 중 비활성화 + 로딩 텍스트("분석 중...")로 표시, 목록 조회 자체는 이 호출과
  무관하게 항상 즉시 응답한다(캐시된 값만 읽으므로).
- **비용 구조 — 구체적 추정치**: `claude-api` 스킬로 확인한 Claude Opus 5 정가는
  **입력 $5 / 출력 $25 (per MTok)**. 신고 1건의 입력(신고 사유·상세·대상 제목/설명, 시스템
  프롬프트 포함)은 대략 500~800 토큰, 출력(JSON 요약)은 100~150 토큰 수준으로 추정되므로
  **건당 약 $0.005~$0.01**(캐싱 미적용 기준). 기본 상한 20건 기준 **클릭 1회 최대 약
  $0.1~$0.2** — 이 정도면 개발 단계 실험 비용으로는 무시할 만한 수준이지만, "누적 신고
  건수에 선형"이라는 구조적 특성 자체는 그대로 유효하다(§1.1의 "선제적 투자" 근거).
  실행 1회당 상한(`limit`, 기본 20건)을 둬 한 번의 클릭이 유발하는 최대 비용을 관리자가
  예측 가능하게 만든다.

## 6. 우선순위표

| 구분 | 범위 | 비고 |
|---|---|---|
| **Quick win (이번 MVP)** | `Report` 컬럼 추가, `AdminReportAiTriageService`(온디맨드 배치, 최대 20건), `POST /ai-triage/run`, `ReportListPage`에 실행 버튼 + 심각도 배지 + 모달 AI 요약 블록 | 본 문서 §4~5 그대로 |
| **중기** | 심각도 기준 목록 정렬/필터(`aiSeverity` desc), 신고 접수 시 비동기 자동 분석(Spring `@Scheduled` 도입 필요 — `BATCH_JOB_PLAN.md`와 인프라 공유 가능), 개별 신고 "재분석" 버튼 | 신고 건수가 실제로 늘어난 뒤 판단 |
| **장기 / 향후 확장 후보** | 문의 답변 초안 작성 AI, 통계 페이지 자연어 질의 | 본 문서 범위 밖 — §8 |

## 7. 남은 결정 사항

- **일괄 분석 상한(`limit`)**: 기본 20건으로 초안을 잡았다 — 더 낮추면(예: 10) 클릭당
  지연·비용이 줄지만 한 번에 정리되는 건수도 줄어든다. 운영 감각에 맞춰 조정 필요.
- **AI 제안 조치를 라디오 초기값으로 미리 채울지 여부**: §3에서는 "미리 채우되 관리자가
  바꿀 수 있다"로 설계했다 — 이것도 일종의 넛지라 "결국 관리자가 AI 제안을 그대로 클릭하는
  습관이 들지 않을까"라는 우려가 있을 수 있다. 원한다면 초기값을 항상 `DISMISS`(현재 기본값)
  로 고정하고 AI 제안은 텍스트로만 보여주는 더 보수적인 옵션도 가능.
- **시드 데이터의 `targetId` 버그(§2.1) 수정 여부**: 이번 AI 기능 자체와는 무관하지만,
  고쳐두지 않으면 개발 환경에서 AI 요약이 "사진 정보"를 기반으로 만들어지는데 신고
  유형은 "회원"으로 표시되는 어색한 상황이 계속된다 — 이번 작업에서 같이 고칠지, 별도
  이슈로 뺄지 결정 필요.
- **`ANTHROPIC_API_KEY` 발급/과금 주체**: 이 저장소의 CI/배포 환경(Railway)에 키를 어떤
  계정으로 등록할지는 코드 밖의 결정이라 별도 확인 필요.

## 8. 향후 확장 후보 (이번 범위 아님)

- **문의 답변 초안 작성**: `AdminInquiryController`/`InquiryListPage`에 문의 내용을 넣으면
  AI가 답변 초안을 생성 — 관리자가 수정 후 전송하는 구조(트리아지와 동일하게 "제안까지만
  AI, 전송은 사람"). 
- **통계 페이지 자연어 질의**: `StatsPage`/`AdminStatsController`의 기존 집계 데이터를
  자연어 질문으로 조회 — 새 집계 로직을 AI가 만드는 게 아니라 기존 API 응답을 요약하는
  형태로 한정해야 수치 오류 리스크가 없다.
