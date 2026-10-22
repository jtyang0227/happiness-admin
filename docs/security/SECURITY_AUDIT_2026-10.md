# 보안 점검 보고서 — 2026-10-22

> 범위: `backend/`(Spring Boot), `frontend/`(React), `happiness-admin-mcp-server/`, 배포 설정(`vercel.json`, `application-prod.properties`)
> 방법: 코드 전수 검색(인증·인가·입력 검증·출력·설정·의존성) → **실제 요청으로 재현** → 수정 → 회귀 테스트 + 재현 재실행
> 선행 작업: `docs/planning/PRIVACY_PROTECTION_PLAN.md`(공개 API 개인정보 유출·로그인 열거 등은 이미 수정됨)

## 발견 및 조치

| # | 취약점 | 심각도 | 재현(수정 전) | 조치 | 검증(수정 후) |
|---|---|---|---|---|---|
| S1 | **강등·정지된 관리자 토큰이 만료(최대 8시간)까지 계속 유효** — JWT의 권한 클레임만 믿고 DB 상태를 보지 않음 | 높음 | SA 토큰으로 조회 200 → SA를 US로 강등·정지 후 같은 토큰 200 | `JwtAuthenticationFilter`가 매 요청 DB에서 회원을 다시 읽어 `ACTIVE` + WM/SA일 때만 인증, 권한도 DB 값 사용(토큰 클레임으로 권한 상승 불가) | 강등·정지 직후 403, 위조 WM 클레임으로 WM 전용 API 403 |
| S2 | **활동 로그 위조·덮어쓰기** — `POST /api/admin/system/activity-logs`가 엔티티를 그대로 저장(mass assignment), `id`를 넣으면 기존 로그를 덮어씀 | 높음 | id=1 로그를 "운영자/위조된 기록"으로 덮어쓰기 성공 | 엔드포인트 삭제(프론트·MCP 미사용). 로그는 서버 내부(`AdminActivityRecorder`)에서만 기록 | 400 |
| S3 | **사용자 입력 URL의 `javascript:` 링크** — App 작가가 입력한 언론 보도 URL·포트폴리오 URL을 관리자 화면이 그대로 `href`로 렌더 → 관리자가 클릭하면 스크립트 실행(localStorage 토큰 탈취 가능) | 높음 | 코드상 `href={item.linkUrl}`, `href={v.portfolioUrl}` 무검증 | 프론트 `safeHref()`로 http(s)만 링크 허용. 관리자가 입력해 App에 노출되는 배너·팝업 링크/이미지는 서버 `UrlSafety`로 http(s)·앱 내부 경로만 허용 | `javascript:` 배너 링크 400, 단위 테스트(프론트 7종·백엔드 6종 스킴) |
| S4 | **CORS가 모든 Origin + 자격증명 허용** | 중간 | `Origin: https://evil.example` → `Allow-Origin: evil.example`, `Allow-Credentials: true` | 허용 Origin을 설정값(`cors.allowed-origins`, 운영 `CORS_ALLOWED_ORIGINS`)으로, 자격증명(쿠키) 비허용, 허용 헤더를 `Authorization, Content-Type`으로 축소 | 미허용 Origin에 CORS 헤더 없음 |
| S5 | **CSV 수식 주입** — 회원 이름 등 사용자 입력이 `=`·`+`·`-`·`@`로 시작하면 엑셀에서 수식 실행 | 중간 | 코드상 그대로 셀에 기록 | 공통 `utils/csv.js`가 수식 시작 문자 앞에 `'`를 붙임(회원·뉴스레터 내보내기) | 단위 테스트 |
| S6 | **접속기록 IP 위조** — `X-Forwarded-For`를 그대로 신뢰 | 중간 | 헤더 값이 그대로 기록되는 구조 | `getRemoteAddr()`만 사용, 운영은 `server.forward-headers-strategy=framework`로 신뢰 프록시 헤더만 반영 | `X-Forwarded-For: 6.6.6.6` 보내도 실제 IP 기록 |
| S7 | **프론트 보안 헤더 부재**(CSP·클릭재킹·MIME 스니핑) | 중간 | `vercel.json`에 헤더 없음 | `vercel.json`에 CSP(`script-src 'self'`, `frame-ancestors 'none'` 등)·X-Frame-Options·nosniff·Referrer-Policy·Permissions-Policy·HSTS. CRA 인라인 런타임 스크립트를 끄도록 `.env.production`(`INLINE_RUNTIME_CHUNK=false`, 소스맵 비공개) | 운영 빌드를 동일 헤더로 서빙해 7개 화면 순회 — CSP 위반 0, 폰트·차트 정상 |
| S8 | 로그인 잠금 맵 무제한 증가(임의 이메일로 메모리 고갈) | 낮음 | — | 추적 상한 10,000, 초과 시 잠금 해제된 항목만 정리(잠긴 계정 유지) | 단위 테스트 |
| S9 | 잘못된 파라미터가 500 | 낮음 | `?page=abc` → 500 | 타입 불일치·본문 파싱·필수 파라미터 누락은 400, 없는 경로 404 | 400 |
| S10 | **의존성 취약점** | 중간~높음 | Spring Boot 3.5.0(이후 Spring Security·Tomcat 보안 패치 누락), `react-router-dom` 6.x(오픈 리다이렉트 GHSA-wrjc-x8rr-h8h6 등), MCP 서버(`@modelcontextprotocol/sdk` 자격증명 전송, `proxy-addr` IP 위조 등) | Spring Boot **3.5.16**, React Router **7.18.4**, MCP 서버 `npm audit fix` | 백엔드 테스트 33개·프론트 빌드·전 라우트 QA 27개 통과, MCP 서버 `npm audit` 0건, 프론트 런타임 의존성 중 react-router 경고 해소 |

## 점검했으나 문제없음
- 하드코딩된 비밀값·커밋된 `.env`/키 파일 없음(개발용 JWT 기본값은 dev 전용, 운영은 `JWT_SECRET` 필수)
- SQL 인젝션: 문자열 연결 쿼리·네이티브 쿼리 없음(전부 파라미터 바인딩 JPQL)
- JWT: HS 키 32바이트 이상 강제, 서명 검증(`verifyWith`) 후 파싱
- 운영 actuator는 `health`만 노출·상세 비공개, H2 콘솔은 운영 비활성
- `dangerouslySetInnerHTML`·`eval` 없음, AI 트리아지 출력은 텍스트로만 렌더
- 파일 업로드 엔드포인트 없음

## 남은 위험(이번 범위 밖)
1. **프론트 빌드 도구 의존성**(`react-scripts` 5 하위 webpack-dev-server·jest·svgo 등 100여 건): 운영 번들에 포함되지 않는 빌드/테스트 도구이며 수정은 `react-scripts` 교체(Vite 등 메이저 마이그레이션)가 필요하다. 개발 서버를 외부에 노출하지 말 것.
2. **토큰 저장 위치**: JWT가 `localStorage`에 있어 XSS 발생 시 탈취될 수 있다. S3·S7로 XSS 경로를 줄였으나, 근본적으로는 HttpOnly 쿠키 + CSRF 토큰 구조로 전환을 검토할 것.
3. **운영 CORS**: `CORS_ALLOWED_ORIGINS` 미설정 시 `*`(자격증명 없음)로 동작하며 경고 로그를 남긴다 — 프론트 도메인을 설정할 것.
4. 다중 인스턴스 배포 시 로그인 잠금·접속기록 해시 체인 직렬화를 공유 저장소 기반으로.
5. 관리자 2단계 인증(외부 접속 시 안전한 인증수단 — 안전성 확보조치 기준 제6조②).
