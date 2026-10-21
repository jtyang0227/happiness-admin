# WORK_QUEUE — 미구현 항목 이어하기

> 세션이 끊기거나(토큰 소진 등) 다시 시작되면 **이 파일부터 읽고** 첫 번째 미완료(`[ ]`) 항목을 이어서 진행한다.
> 항목 하나를 끝낼 때마다: 빌드(프론트 `npm run build` + ESLint 0 / 백엔드 `./gradlew build -x test`) → 체크 표시 → 커밋·푸시.
> 브랜치: `claude/admin-planning-doc-120dha` · 근거 문서: `APP_FEATURE_SYNC_PLAN.md` §2 매트릭스

## 원칙
- App과 같은 Postgres를 쓰므로 App 엔티티의 테이블·컬럼명을 그대로 부분 매핑한다(새 NOT NULL 컬럼 추가 금지).
- 삭제 같은 조치는 `useConfirm` + `AdminActivityRecorder` 활동 로그를 반드시 남긴다.
- 개인 간 거래 데이터(미팅·납품)는 **메타데이터만** 노출 — 메시지 본문·사진·피드백·비밀번호 해시·토큰은 응답에 넣지 않는다.

## 큐

- [x] **Q1 보안 감사 로그** `/security-audit` (설정 그룹) — App `security_audit_log` 읽기 전용 뷰어: 유형·성공여부·기간 필터, 최근 24시간 로그인 실패 집계
- [x] **Q2 작가 프로필 콘텐츠 점검** `/profile-content` (회원 그룹) — `testimonials`·`pricing_packages`·`press_features`·`achievements`·`client_brands` 탭별 목록 + 삭제(허위 후기·부적절 콘텐츠 대응)
- [x] **Q3 뉴스레터 구독자** `/newsletter` (운영·마케팅) — `newsletter_subscribers` 목록·구독/해지 집계·CSV 내보내기(token 제외)
- [ ] **Q4 미팅·납품 운영 현황** `/transactions` (운영·마케팅) — `meets`·`delivery_sets` 상태 집계와 장기 정체 건(미팅 PENDING 7일+, 납품 만료 임박/만료) 목록, 메타데이터만
- [ ] **Q5 V14 잔여** — 신고·작가인증·통계 필터를 `SegmentedControl`로 교체, 404 버튼 블랙 pill, CLAUDE.md의 낡은 Toss 표기(CSS 변수 예시·Design Files·DashboardPage 설명·Design Rule 2) 정리
- [ ] **Q6 마무리** — `qa-check.sh` ROUTES·CommandPalette·CLAUDE.md 갱신, 전 라우트 QA, `APP_FEATURE_SYNC_PLAN.md` 매트릭스 상태 갱신

## 보류(구현하지 않음)
- 태그 관리 — App 사진에 키워드 태그 데이터가 없음(App 태그 관리 화면도 목업). 데이터 모델이 생기면 재검토.
- moodboard·follow — 개인 비공개 데이터, 운영 대상 아님.
