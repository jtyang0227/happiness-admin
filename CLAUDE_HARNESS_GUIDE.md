# Happiness Admin — Claude Code 하네스 스킬 & 에이전트 활용 가이드

> 이 프로젝트에서 실제로 유용한 Claude Code 기능만 추려 정리한 실전 가이드.  
> 각 항목 옆에 **어떤 상황에서 쓰는지** 구체적으로 명시했습니다.

---

## 1. 스킬 (Slash Commands)

Claude Code 대화창에서 `/스킬명`으로 바로 실행합니다.

### `/review` — PR 코드 리뷰

**언제 쓰나**: Phase 구현 완료 후 커밋 전, 또는 GitHub PR 번호가 있을 때

```
/review
```

```
/review 12
```

**이 프로젝트에서 유용한 시점**:
- Phase 1(ConfirmDialog) 구현 후 → ESC 핸들러, Portal 누락 여부 검토
- Phase 6(백엔드 search 추가) 후 → JPQL 쿼리 N+1 문제, @Transactional 누락 체크
- Phase 7(반응형) 구현 후 → 미디어쿼리 누락 페이지 탐지

---

### `/security-review` — 보안 리뷰

**언제 쓰나**: JWT 인증, API 엔드포인트, 권한 체계 변경 시 반드시 실행

```
/security-review
```

**이 프로젝트에서 유용한 시점**:
- `SecurityConfig.java` 수정 시 (새 엔드포인트 추가할 때마다)
- `JwtTokenProvider.java` 또는 `JwtAuthenticationFilter.java` 변경 시
- Phase 6에서 `PATCH /api/admin/inquiries/read-all` 같은 새 PATCH 엔드포인트 추가 시
- Admin 활동 로그 기능 추가 시 (민감 데이터 노출 위험)

**체크 포인트**:
- `/api/admin/**` 엔드포인트에 `ROLE_WM` 또는 `ROLE_SA` JWT 검증이 빠졌는지
- `@DeleteMapping` 엔드포인트에 인가 조건이 올바른지
- `window.location.href = '/login'` 이외 인증 우회 경로가 없는지

---

### `/simplify` — 구현 후 코드 품질 개선

**언제 쓰나**: Phase 구현 직후, 중복 코드나 추상화 기회가 보일 때

```
/simplify
```

**이 프로젝트에서 유용한 시점**:
- Phase 4 Toast 추가 후 → 4개 페이지에 동일한 try/catch 패턴이 반복되므로 공통 훅 추출 제안
- Phase 6 search debounce 후 → MemberListPage, PhotoListPage, SeriesListPage에 동일 debounce 패턴이 3번 반복
- Phase 8 StatsPage KPI 카드 → StatCard와 KpiCard가 유사 구조이면 통합 제안

---

### `/fewer-permission-prompts` — 허용 목록 자동 생성

**언제 쓰나**: 처음 프로젝트를 세팅할 때 또는 허가 팝업이 너무 자주 뜰 때

```
/fewer-permission-prompts
```

**동작**: 최근 대화에서 반복적으로 사용한 Bash/MCP 명령어를 분석해 `.claude/settings.json`의 `allow` 목록에 자동 추가.

**이 프로젝트에서 이미 허용된 명령어** (`.claude/settings.json`에 사전 등록):
```
git status / diff / log / add / commit / push / pull
find frontend/src -type f*
find backend/src -type f*
grep -r * frontend/src
grep -r * backend/src
npm run build (nvm 경로 포함)
npm run test
npx eslint frontend/src
```

추가로 자주 쓰게 될 명령어 발생 시 이 스킬로 자동 추가하세요.

---

### `/update-config` — 자동화 훅 설정

**언제 쓰나**: "파일 저장할 때마다 자동으로 ~해줘" 같은 자동화 행동을 등록할 때

```
/update-config
```

**이 프로젝트 추천 훅 설정 예시**:

| 상황 | 훅 설정 요청 문구 |
|---|---|
| 프론트 파일 수정 후 ESLint 자동 실행 | "frontend/src 파일 수정 후 자동으로 eslint 실행해줘" |
| 백엔드 Java 파일 수정 후 빌드 알림 | "backend/src 파일 수정 후 ./gradlew build 알림 띄워줘" |
| 작업 완료 후 git status 표시 | "Claude가 응답을 마칠 때마다 git status 보여줘" |

---

### `/loop` — 반복 작업 자동화

**언제 쓰나**: 장시간 작업(빌드 대기, 서버 시작 대기)을 모니터링하거나 반복 검증할 때

```
/loop 30s npm run build 결과 확인해줘
```

```
/loop 2m 백엔드 서버가 localhost:8081/api/admin/hello에 응답하는지 확인해줘
```

**이 프로젝트에서 유용한 시점**:
- `./gradlew bootRun` 실행 후 서버 기동 완료를 30초마다 체크할 때
- Phase 6 백엔드 수정 후 빌드가 성공하는지 반복 확인할 때
- 통계 API 응답 데이터 구조를 주기적으로 검증할 때

---

### `/init` — CLAUDE.md 업데이트

**언제 쓰나**: 프로젝트 구조가 크게 변경되었을 때 (신규 엔티티 추가, 디렉토리 재구성)

```
/init
```

**이 프로젝트에서 유용한 시점**:
- Phase 6에서 백엔드에 `Report`, `Notice`, `Banner` 엔티티를 추가한 후
- Phase 7에서 `AdminHeader.jsx` 등 새 컴포넌트 구조가 생긴 후
- 현재 `CLAUDE.md`의 컨트롤러/서비스/엔티티 목록을 최신화할 때

---

## 2. 에이전트 (Agent Types)

`Agent()` 도구로 Claude Code가 자동으로 서브에이전트를 활용합니다.  
사용자가 직접 요청하거나 Claude Code가 판단해서 자동 실행합니다.

---

### `Explore` — 코드 탐색 전용 에이전트

**목적**: 특정 파일·심볼·패턴 위치를 빠르게 찾는 읽기 전용 에이전트.  
**주의**: 코드 리뷰, 설계 분석에는 부적합 (파일을 발췌 읽으므로 전체 문맥 놓칠 수 있음).

**이 프로젝트에서 쓰면 좋은 시나리오**:

```
# 특정 API 엔드포인트가 어느 컨트롤러에 있는지 찾을 때
"Explore: /api/admin/stats 경로가 어느 파일에 정의되어 있나요? quick"

# 특정 CSS 클래스가 어디서 사용되는지 찾을 때
"Explore: .stat-card 클래스가 사용되는 파일 목록 알려줘. medium"

# 특정 패턴이 몇 군데에 있는지 확인할 때
"Explore: window.confirm() 사용처 전부 찾아줘. quick"

# 신규 기능 추가 전 연관 파일 파악
"Explore: Report 엔티티 추가 시 연관될 파일들 파악해줘. thorough"
```

**breadth 파라미터 가이드**:
| 상황 | 권장 breadth |
|---|---|
| 특정 심볼 하나 찾기 | `quick` |
| 관련 파일 5~10개 탐색 | `medium` |
| 프로젝트 전체 패턴 파악 | `very thorough` |

---

### `Plan` — 구현 전 설계 에이전트

**목적**: 코드를 작성하기 전에 구현 전략, 영향 범위, 파일 목록을 계획하는 에이전트.  
**주의**: 코드 작성은 하지 않음. 계획만 반환.

**이 프로젝트에서 쓰면 좋은 시나리오**:

```
# Phase 시작 전 설계
"Plan: Phase 6 백엔드 search 파라미터 추가를 어떻게 구현할지 계획해줘.
현재 AdminPhotoController는 memberId/colorMood/sortBy/page/size만 받는다.
JPA Repository에 검색 조건을 어떻게 추가할지 포함해서."

# 신규 엔티티 추가 계획
"Plan: Report(신고) 엔티티를 추가하려 한다.
Member, Photo, Inquiry와 연관관계를 어떻게 설계할지,
어떤 파일을 신규 생성하고 어떤 파일을 수정해야 하는지 정리해줘."

# 리팩토링 계획
"Plan: 4개 페이지(Member/Photo/Inquiry/Series)의 
중복된 try/catch + toast 패턴을 커스텀 훅으로 추출하려 한다.
어떤 구조로 만들면 좋은지 설계해줘."
```

---

### `general-purpose` — 복잡한 멀티스텝 작업

**목적**: 여러 파일을 읽고 분석한 뒤 결과를 도출해야 하는 복잡한 태스크.  
코드 탐색 + 분석 + 판단이 모두 필요할 때 사용.

**이 프로젝트에서 쓰면 좋은 시나리오**:

```
# 의존성 충돌 분석
"general-purpose: 현재 frontend/package.json의 react-scripts@5가
lucide-react@1.18, react-hot-toast@2.6과 호환성 문제가 없는지 분석해줘."

# 전체 코드 품질 감사
"general-purpose: frontend/src 전체에서 
직접 접근하는 localStorage 호출(admin_token 제외)을 모두 찾고,
api.js의 토큰 관리 패턴과 불일치하는 부분을 리포트해줘."

# 복잡한 버그 분석
"general-purpose: StatsPage에서 days 변경 시 
무드 분포 파이차트가 깜빡이는 원인을 분석해줘.
useEffect 의존성 배열과 실제 데이터 흐름을 추적해서."
```

---

### `claude-code-guide` — Claude Code 사용법 질문

**목적**: Claude Code 자체(CLI, 훅, MCP, 설정) 사용 방법 질문.

**이 프로젝트에서 쓰면 좋은 시나리오**:

```
"Claude Code에서 PostToolUse 훅으로 파일 저장 후 ESLint를 자동 실행하려면 어떻게 설정해?"

"CLAUDE.md에 커스텀 명령어를 등록하는 방법이 있어?"

"MCP 서버를 이 프로젝트에 추가하려면 어떻게 해?"
```

---

## 3. 이 프로젝트 맞춤 활용 시나리오

### Phase 구현 표준 워크플로우

각 Phase 작업 시 아래 순서로 스킬과 에이전트를 활용하세요.

```
1. [시작 전] Plan 에이전트로 구현 범위 확인
   → "Plan: DESIGN_ROADMAP.md의 Phase N 구현 범위와
      수정이 필요한 파일 목록을 정리해줘."

2. [탐색] Explore 에이전트로 연관 파일 확인
   → "Explore: Phase N과 관련된 컴포넌트/서비스 파일 찾아줘. medium"

3. [구현] Claude Code에 구현 요청
   → DESIGN_ROADMAP.md의 해당 Phase 프롬프트 그대로 사용

4. [검증] 빌드 확인 (CLAUDE.md 규칙)
   → 프론트: npm run build
   → 백엔드 포함 시: ./gradlew build

5. [리뷰] 스킬 실행
   → /simplify (코드 품질)
   → /security-review (백엔드 변경 포함 시)

6. [커밋] git add → git commit → git push
```

---

### 백엔드 신규 엔티티 추가 시 (Phase 6+)

```
# 1단계: 설계
"Plan: Report 엔티티를 추가한다. 
Member(신고자), Photo 또는 Inquiry(신고 대상) 참조.
reportType(SPAM/INAPPROPRIATE/COPYRIGHT), status(PENDING/REVIEWED/DISMISSED),
adminNote 필드 포함. 어떤 파일을 생성/수정해야 하는지 알려줘."

# 2단계: 구현 후 보안 검토
/security-review

# 3단계: 빌드 모니터링
/loop 30s ./gradlew build 결과 확인해줘
```

---

### 통계 데이터 API 검증

```
# 백엔드 서버가 켜진 상태에서
/loop 1m localhost:8081/api/admin/stats/summary 응답이 정상인지 확인해줘
```

---

### 대규모 리팩토링 (Phase 9 다크모드 등)

```
# 변경 전 영향 범위 파악
"Explore: var() CSS 변수를 사용하지 않고 색상을 하드코딩한 부분을
frontend/src 전체에서 찾아줘. very thorough"

# 리팩토링 후 검증
/review
```

---

## 4. `.claude/settings.json` 설정 현황

이 프로젝트의 `.claude/settings.json`에 아래 항목이 사전 설정되어 있습니다.

### 사전 허용된 명령어

```json
"allow": [
  "Bash(git status)",
  "Bash(git diff*)",
  "Bash(git log*)",
  "Bash(git add*)",
  "Bash(git commit*)",
  "Bash(git push*)",
  "Bash(git pull*)",
  "Bash(find frontend/src -type f*)",
  "Bash(find backend/src -type f*)",
  "Bash(grep -r * frontend/src)",
  "Bash(grep -r * backend/src)",
  "Bash(cat frontend/package.json)",
  "Bash(cat backend/build.gradle)",
  "Bash(PATH=*/.nvm/versions/node/*/bin:$PATH npm run build)",
  "Bash(PATH=*/.nvm/versions/node/*/bin:$PATH npm run test -- --watchAll=false*)",
  "Bash(PATH=*/.nvm/versions/node/*/bin:$PATH npx eslint frontend/src*)"
]
```

### 추가 허용이 필요한 경우

아래 상황에서 `/update-config` 또는 직접 settings.json 편집으로 추가하세요:

| 상황 | 추가할 허용 명령어 |
|---|---|
| Gradle 빌드 자동 허용 | `"Bash(cd backend && ./gradlew build*)"` |
| Gradle 테스트 자동 허용 | `"Bash(cd backend && ./gradlew test*)"` |
| curl API 테스트 허용 | `"Bash(curl -s http://localhost:8081/api*)"` |
| 백엔드 서버 실행 허용 | `"Bash(cd backend && ./gradlew bootRun)"` |

---

## 5. 자주 하는 질문

**Q. Phase 구현 중 어느 에이전트를 써야 할지 모르겠다.**

> 기준: 파일 위치·존재 여부 확인 → `Explore` / 구현 전 설계 → `Plan` / 분석+판단 필요 → `general-purpose` / 구현 자체는 Claude Code 메인 대화에서 직접.

**Q. `/review`와 `/security-review`는 언제 써야 하나?**

> - 프론트엔드만 변경: `/review` 또는 `/simplify`
> - 백엔드 API 변경: `/review` + `/security-review` 둘 다
> - JWT/인증/권한 변경: `/security-review` 필수

**Q. `Explore` 에이전트와 직접 `grep`의 차이는?**

> 찾으려는 대상이 명확하면 Bash로 직접 grep이 빠름. 대상이 불명확하거나("이 기능과 관련된 파일들이 어디 있지?") 여러 위치에 흩어져 있을 것 같으면 `Explore` 에이전트가 더 정확.

**Q. `Plan` 에이전트 결과가 틀릴 수도 있나?**

> 있음. Plan 에이전트는 코드를 발췌해서 읽으므로 전체 맥락을 놓칠 수 있음.  
> 계획을 받은 뒤 "이 파일들이 실제로 존재하나?" 정도는 직접 확인하는 것이 좋음.
