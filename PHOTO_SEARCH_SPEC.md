# 사진 관리 — 키워드 검색·정렬·5차 카테고리 분류 기획서

> 작성일: 2026-06-21 (v2.0 전면 개정)
> 대상 페이지: `/photos` (PhotoListPage)
> 현재 구현 상태: 제목·작가명·설명·@아이디 LIKE 검색 + 단일 무드 필터 + 4종 정렬 + URL 동기화 + 결과 카운트 + Highlight + Empty State

---

## 0. 현황 분석

### 구현 현황 (2026-06-21 기준)

| 기능 | 상태 | 비고 |
|------|------|------|
| 키워드 검색 (title, member.name, description, profileName) | ✅ | 300ms debounce, JPQL LIKE |
| 색채무드 필터 (단일 선택) | ✅ | WARM·COOL·NEUTRAL·VIVID·DARK·SOFT |
| 한국어 무드 별칭 변환 | ✅ | 따뜻→WARM, 쿨→COOL 등 12종 |
| 정렬 (최신·좋아요·저장·공유) | ✅ | 단일 기준만 |
| 검색 결과 카운트 표시 | ✅ | |
| URL 상태 동기화 | ✅ | useSearchParams |
| 검색어 하이라이트 | ✅ | |
| 빈 상태 Empty State | ✅ | |
| 초기화 버튼 | ✅ | |
| **복합 정렬 (다중 기준)** | ❌ | 우선순위 정렬 미지원 |
| **관련도 정렬 (검색어 매칭 점수)** | ❌ | |
| **1~5차 계층 카테고리 분류** | ❌ | 무드 단일 속성만 존재 |
| **확인 구분자 (10자리 코드)** | ❌ | DB 컬럼 미존재 |
| **카테고리 트리 필터 UI** | ❌ | |
| 날짜 범위 필터 | ❌ | |
| 다중 무드 선택 | ❌ | |
| 인기도 임계값 필터 | ❌ | |
| 최근 검색어 저장 | ❌ | |
| 그리드/리스트 뷰 전환 | ❌ | |
| 체크박스 선택 + 벌크 삭제 | ❌ | |
| CSV 내보내기 | ❌ | |
| 태그 검색 연동 | ❌ | |

### 핵심 문제 (v2.0 추가 정의)

1. **정렬 단순** — 단일 기준만 지원. "최신순 중 좋아요 많은 순" 같은 복합 정렬 불가
2. **분류 체계 부재** — 촬영 종류·환경·무드·스타일·속성을 통합한 계층적 카테고리 없음
3. **식별자 미표준화** — 사진 분류 코드가 없어 대량 일괄 처리·CS 대응 시 분류 기준 불명확
4. **관리자 탐색 비효율** — 카테고리 트리 없이 검색어에 전적으로 의존, 브라우징 불가

---

## 1. 목표 및 범위

### 목표

관리자가 **계층적 카테고리 트리 + 정밀 정렬 + 키워드 검색**을 조합해 30만 건 이상의 사진을
빠르게 탐색·분류·처리할 수 있는 고도화된 관리 UX 제공

### 핵심 지표

| 지표 | As-Is | To-Be |
|------|-------|-------|
| 검색 가능 필드 수 | 4개 | 4개 + 카테고리 코드 검색 |
| 분류 체계 | 색채무드 단일 속성 | 5차 계층 카테고리 |
| 정렬 기준 수 | 1개 (단일) | 최대 3개 복합 |
| 분류 식별자 | 없음 | 10자리 확인 구분자 |
| 관리자 탐색 방식 | 검색어 의존 | 트리 브라우징 + 검색 병행 |

---

## 2. 정렬(Sort) 기능 상세 기획

### 2-1. 현재 정렬 방식

```
sortBy: latest | likes | saves | shares  (단일 기준)
```

단순 드롭다운 1개 → 한 번에 1개 기준만 적용 가능.

### 2-2. 복합 정렬 (Multi-level Sort)

최대 3개 기준을 우선순위 순서로 조합.

```
정렬 기준  [1순위: 등록일    ▾] [내림차순 ↓]  [+추가]
           [2순위: 좋아요 수  ▾] [내림차순 ↓]  [×제거]
           [3순위: 저장 수   ▾] [오름차순 ↑]  [×제거]
```

**지원 정렬 키 (총 8종)**

| 정렬 키 | DB 컬럼 | 설명 |
|---------|---------|------|
| `createdAt` | `photos.created_at` | 등록일시 |
| `updatedAt` | `photos.updated_at` | 수정일시 |
| `likesCount` | `photos.likes_count` | 좋아요 수 |
| `savesCount` | `photos.saves_count` | 저장 수 |
| `sharesCount` | `photos.shares_count` | 공유 수 |
| `title` | `photos.title` | 제목 가나다순 |
| `authorName` | `members.name` | 작가명 가나다순 |
| `categoryCode` | `photos.category_code` | 분류 코드 순 |

**API 파라미터 설계**

```
GET /api/admin/photos?sort=createdAt,DESC&sort=likesCount,DESC&sort=title,ASC
```

Spring Data JPA `Sort` 복합 적용:

```java
// 파라미터: sort=createdAt,DESC&sort=likesCount,DESC
List<Sort.Order> orders = sortParams.stream()
    .map(s -> {
        String[] parts = s.split(",");
        return parts[1].equalsIgnoreCase("ASC")
            ? Sort.Order.asc(parts[0])
            : Sort.Order.desc(parts[0]);
    }).collect(toList());
Sort sort = Sort.by(orders);
```

**프론트엔드 UI 컴포넌트**

```jsx
// SortBuilder 컴포넌트
const SORT_KEYS = [
  { value: 'createdAt',  label: '등록일' },
  { value: 'likesCount', label: '좋아요' },
  { value: 'savesCount', label: '저장' },
  { value: 'sharesCount', label: '공유' },
  { value: 'title',      label: '제목' },
  { value: 'authorName', label: '작가명' },
];

const SortBuilder = ({ value, onChange }) => {
  // value: [{ key: 'createdAt', dir: 'DESC' }, ...]
  // 최대 3개, 드래그 순서 변경 지원
};
```

URL 직렬화: `?sort=createdAt,DESC&sort=likesCount,DESC`

### 2-3. 관련도 정렬 (Relevance Sort)

키워드 검색 시 매칭 위치에 따라 관련도 점수 부여 → `관련도 높은 순` 정렬 추가

**점수 산정 기준 (서비스 레이어)**

| 매칭 위치 | 가중치 |
|-----------|--------|
| title 완전 일치 | 100점 |
| title 부분 일치 | 60점 |
| 카테고리 코드 일치 | 50점 |
| authorName 일치 | 40점 |
| description 일치 | 20점 |
| profileName 일치 | 10점 |

**구현 (JPQL CASE WHEN)**

```sql
SELECT p,
  (CASE WHEN LOWER(p.title) = LOWER(:search) THEN 100
        WHEN LOWER(p.title) LIKE LOWER(CONCAT('%',:search,'%')) THEN 60
        WHEN LOWER(p.member.name) LIKE LOWER(CONCAT('%',:search,'%')) THEN 40
        WHEN LOWER(p.description) LIKE LOWER(CONCAT('%',:search,'%')) THEN 20
        ELSE 0 END) AS relevance
FROM Photo p
WHERE ...
ORDER BY relevance DESC, p.createdAt DESC
```

> JPQL CASE WHEN은 H2/PostgreSQL 모두 지원. Pageable과 조합 시 네이티브 쿼리 사용 권장.

**UI 선택지에 추가**

```
정렬: [관련도순 ★]  ← 검색어 입력 시 기본값으로 자동 전환
      [최신순]
      [좋아요순]
      [복합 정렬...]
```

### 2-4. 정렬 프리셋 (저장된 정렬)

자주 쓰는 복합 정렬 조건을 이름으로 저장 → 빠른 재적용

```
[정렬 저장 ▾]
  + 최신 인기순 (createdAt DESC, likesCount DESC)
  + 작가별 최신순 (authorName ASC, createdAt DESC)
  [현재 조건 저장...]
```

저장 위치: `localStorage` (`photo_sort_presets`)

---

## 3. 5차 계층 카테고리 분류 체계

### 3-1. 설계 철학

사진 1장은 **동시에 5개 관점**에서 분류된다:

```
1차: 무엇을 찍었는가?  (촬영 종류)
2차: 어디서 찍었는가?  (촬영 환경)
3차: 어떤 색감인가?    (색채 무드)
4차: 어떤 분위기인가?  (스타일/분위기)
5차: 세부 속성은?      (세부 특성)
```

### 3-2. 확인 구분자 (10자리 코드) 형식

```
  0 1 | 0 1 | 0 1 | 0 1 | 0 1
  └─┘   └─┘   └─┘   └─┘   └─┘
  1차   2차   3차   4차   5차
```

- **총 10자리**, 각 레벨당 **2자리 숫자** (00~99)
- `00` = 미분류 / 해당 없음
- 예시: `0201030402` → 1차=02(스냅) · 2차=01(야외) · 3차=03(NEUTRAL) · 4차=04(로맨틱) · 5차=02(배경중심)

**DB 컬럼**

```sql
ALTER TABLE photos ADD COLUMN category_code CHAR(10) DEFAULT '0000000000';
CREATE INDEX idx_photos_category_code ON photos(category_code);
CREATE INDEX idx_photos_cat_l1 ON photos(SUBSTRING(category_code, 1, 2));
CREATE INDEX idx_photos_cat_l2 ON photos(SUBSTRING(category_code, 1, 4));
```

**Java 엔티티**

```java
@Column(name = "category_code", length = 10, columnDefinition = "CHAR(10) DEFAULT '0000000000'")
private String categoryCode = "0000000000";
```

### 3-3. 1차 분류 — 촬영 종류 (자리 1~2)

| 코드 | 분류명 | 설명 | 예시 |
|------|--------|------|------|
| `00` | 미분류 | 분류 미지정 | — |
| `01` | 웨딩 | 결혼식·본식·웨딩촬영 | 본식, 웨딩스냅 |
| `02` | 스냅 | 일상·여행·기념 스냅 | 데이트, 우정, 가족여행 |
| `03` | 가족 | 가족 기념사진 | 돌잔치, 가족사진 |
| `04` | 졸업 | 졸업·학예 관련 | 고등학교, 대학교 졸업 |
| `05` | 바디프로필 | 신체 프로필 촬영 | 헬스, 다이어트 완성 |
| `06` | 제품 | 상업 제품·음식 사진 | 쇼핑몰, 카페 메뉴 |
| `07` | 자연·풍경 | 자연, 도시 풍경 | 산, 바다, 도심 야경 |
| `08` | 건축·공간 | 건물, 인테리어 | 카페, 사옥, 갤러리 |
| `09` | 반려동물 | 펫 전문 촬영 | 강아지, 고양이 |
| `10` | 만삭·신생아 | 임신·출산 기념 | 만삭사진, 베이비 |
| `99` | 기타 | 위 분류 외 | — |

### 3-4. 2차 분류 — 촬영 환경 (자리 3~4)

| 코드 | 분류명 | 설명 |
|------|--------|------|
| `00` | 미분류 | — |
| `01` | 야외 | 공원, 거리, 자연 등 외부 |
| `02` | 스튜디오 | 조명·세트 갖춘 실내 스튜디오 |
| `03` | 실내 장소 | 카페, 레스토랑, 집 등 일반 실내 |
| `04` | 해외 | 국외 촬영지 |
| `05` | 혼합 | 실내+야외 교차 |

### 3-5. 3차 분류 — 색채 무드 (자리 5~6)

> 기존 `colorMood` 컬럼을 코드로 표준화. 단, 기존 컬럼은 유지 (하위 호환)

| 코드 | 무드 | 영문 키 | 톤 특성 |
|------|------|---------|---------|
| `00` | 미분류 | — | — |
| `01` | 웜 | WARM | 주황·황금·갈색 계열 따뜻한 색감 |
| `02` | 쿨 | COOL | 청·보라·회색 계열 차가운 색감 |
| `03` | 뉴트럴 | NEUTRAL | 중간 채도, 자연스러운 피부톤 |
| `04` | 비비드 | VIVID | 채도 높은 선명한 색감 |
| `05` | 다크 | DARK | 저명도, 무거운 분위기 |
| `06` | 소프트 | SOFT | 저채도 파스텔, 부드러운 색감 |
| `07` | 흑백 | MONO | 채도 제거, 명암 대비 |
| `08` | 필름 | FILM | 필름 그레인, 빈티지 색번짐 |

### 3-6. 4차 분류 — 스타일/분위기 (자리 7~8)

| 코드 | 스타일 | 설명 | 키워드 |
|------|--------|------|--------|
| `00` | 미분류 | — | — |
| `01` | 자연스러운 | 꾸밈 최소화, 일상적 | 내추럴, 생동감 |
| `02` | 로맨틱 | 부드럽고 따뜻한 감성 | 설레임, 사랑스러운 |
| `03` | 빈티지 | 과거 감성, 세월감 | 레트로, 아날로그 |
| `04` | 모던/미니멀 | 정제된 구도, 여백 활용 | 클린, 심플 |
| `05` | 무드/다크 | 강한 명암 대비, 감성적 | 시네마틱, 극적 |
| `06` | 밝고 화사 | 고명도·고채도, 생기발랄 | 화이트톤, 생기 |
| `07` | 감성/아트 | 예술적 연출, 비일상 | 컨셉, 아트워크 |
| `08` | 유머/위트 | 유쾌하고 재미있는 연출 | 재미, 독특 |

### 3-7. 5차 분류 — 세부 속성 (자리 9~10)

| 코드 | 속성 | 설명 |
|------|------|------|
| `00` | 미분류 | — |
| `01` | 인물 중심 | 인물이 주된 피사체 |
| `02` | 배경 중심 | 공간·풍경이 주된 피사체 |
| `03` | 오브제 포함 | 꽃·소품·음식 등 오브제 활용 |
| `04` | 커플/2인 | 두 사람 이상의 관계 중심 |
| `05` | 그룹/단체 | 3인 이상 단체 구성 |
| `06` | 흑백 후처리 | 흑백 필터/편집 적용 |
| `07` | 드론/항공 | 공중 촬영 |
| `08` | 접사/디테일 | 클로즈업, 세부 묘사 |
| `09` | 야간/인공조명 | 야경, 조명 아래 촬영 |
| `10` | 움직임 포착 | 동세·블러·순간 포착 |

### 3-8. 확인 구분자 파싱 예시

| 구분자 | 1차 | 2차 | 3차 | 4차 | 5차 | 해석 |
|--------|-----|-----|-----|-----|-----|------|
| `0101010101` | 01 웨딩 | 01 야외 | 01 웜 | 01 자연스러운 | 01 인물중심 | 야외 웨딩, 웜톤, 내추럴 인물 |
| `0201030402` | 02 스냅 | 01 야외 | 03 뉴트럴 | 04 모던 | 02 배경중심 | 야외 스냅, 뉴트럴 모던 공간 |
| `0702050306` | 07 자연풍경 | 02 스튜디오 | 05 다크 | 03 빈티지 | 06 흑백후처리 | 다크톤 빈티지 풍경, 흑백 처리 |
| `0500000000` | 05 바디프로필 | 00 미분류 | 00 미분류 | 00 미분류 | 00 미분류 | 바디프로필 (상세 분류 미지정) |
| `0000000000` | 미분류 | — | — | — | — | 분류 작업 미수행 |

---

## 4. 카테고리 관리 시스템

### 4-1. 카테고리 마스터 테이블

```sql
CREATE TABLE photo_categories (
  level       TINYINT      NOT NULL,           -- 1~5
  code        CHAR(2)      NOT NULL,           -- '01'~'99'
  name_ko     VARCHAR(20)  NOT NULL,
  name_en     VARCHAR(20),
  description VARCHAR(100),
  sort_order  INT          DEFAULT 0,
  is_active   BOOLEAN      DEFAULT TRUE,
  PRIMARY KEY (level, code)
);
```

### 4-2. 카테고리 조회 API

```
GET  /api/admin/categories?level=1          → 1차 분류 목록
GET  /api/admin/categories?level=2          → 2차 분류 목록
GET  /api/admin/categories/tree             → 전체 트리 (level 1~5 중첩)
PATCH /api/admin/photos/{id}/category-code → 개별 코드 수정
PATCH /api/admin/photos/bulk-category      → 일괄 코드 지정 (선택된 사진 N장)
```

### 4-3. 카테고리 코드 유틸리티 (Java)

```java
public class CategoryCode {

    // "0201030402" → [02, 01, 03, 04, 02]
    public static String[] parse(String code) {
        if (code == null || code.length() != 10) return new String[]{"00","00","00","00","00"};
        return new String[]{
            code.substring(0, 2),
            code.substring(2, 4),
            code.substring(4, 6),
            code.substring(6, 8),
            code.substring(8, 10)
        };
    }

    // [02, 01, 03, 04, 02] → "0201030402"
    public static String build(String l1, String l2, String l3, String l4, String l5) {
        return String.format("%s%s%s%s%s", l1, l2, l3, l4, l5);
    }

    // 1차 코드만 바꾸기 → "0201030402"에서 l1만 05로 변경
    public static String setLevel(String code, int level, String newCode) {
        char[] c = (code == null ? "0000000000" : code).toCharArray();
        int pos = (level - 1) * 2;
        c[pos]     = newCode.charAt(0);
        c[pos + 1] = newCode.charAt(1);
        return new String(c);
    }

    // 1차 코드로 필터 — SUBSTRING(category_code, 1, 2) = :l1
    public static String getLevel(String code, int level) {
        if (code == null || code.length() < level * 2) return "00";
        int pos = (level - 1) * 2;
        return code.substring(pos, pos + 2);
    }
}
```

### 4-4. JPQL 카테고리 필터 조건

```java
// 1차 분류 필터: categoryCode LIKE '01________'
// 2차 분류 필터: categoryCode LIKE '0101______'
// 5차까지 특정: categoryCode = '0101010101'

@Query("SELECT p FROM Photo p WHERE " +
       "(:l1 IS NULL OR SUBSTRING(p.categoryCode, 1, 2) = :l1) AND " +
       "(:l2 IS NULL OR SUBSTRING(p.categoryCode, 3, 2) = :l2) AND " +
       "(:l3 IS NULL OR SUBSTRING(p.categoryCode, 5, 2) = :l3) AND " +
       "(:l4 IS NULL OR SUBSTRING(p.categoryCode, 7, 2) = :l4) AND " +
       "(:l5 IS NULL OR SUBSTRING(p.categoryCode, 9, 2) = :l5) AND " +
       "(:search IS NULL OR " +
       "  LOWER(p.title) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
       "  LOWER(p.member.name) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
       "  LOWER(p.description) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
       "  LOWER(p.member.profileName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
       "  p.categoryCode LIKE CONCAT(:search, '%'))")
Page<Photo> searchPhotos(...);
```

---

## 5. 검색 + 카테고리 통합 UX 설계

### 5-1. 필터 바 전체 레이아웃

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [🔍 제목·작가·설명·@아이디 검색...          ] [정렬 ▾] [뷰: ⊞ ≡]         │
│ ──────────────────────────────────────────────────────────────────────── │
│ 카테고리:  [1차 촬영종류 ▾] [2차 환경 ▾] [3차 무드 ▾] [4차 스타일 ▾] [5차 속성 ▾] │
│                                                      [초기화]  3,241장    │
└──────────────────────────────────────────────────────────────────────────┘
```

**행 설명:**
- **1행** — 키워드 검색 + 복합정렬 + 뷰 전환 (항상 표시)
- **2행** — 5차 카테고리 드롭다운 + 초기화 버튼 + 결과 카운트 (항상 표시)

**모바일 축약 (767px 이하):**

```
┌──────────────────────────────────┐
│ [🔍 검색...              ] [필터▾]│
│ 결과: 3,241장             [초기화] │
└──────────────────────────────────┘
```

`[필터▾]` 클릭 시 BottomSheet로 카테고리 5단계 + 정렬 노출

### 5-2. 카테고리 드롭다운 UX

각 레벨은 **순서 의존성** 없이 독립 선택 가능 (예: 3차만 선택해도 유효).
단, 상위 레벨 선택 시 하위 드롭다운에 관련 항목만 필터링 표시:

```
1차: [웨딩 ▾] 선택 시
2차: [전체 환경 | 야외 | 스튜디오 | 실내 장소 | 해외 | 혼합]  ← 웨딩에 해당하는 환경만
3차: [전체 무드 | 웜 | 쿨 | 뉴트럴 | 소프트 ...]              ← 제한 없음
```

드롭다운에 **코드 표시** 옵션 (관리자 모드):

```
[01 웨딩] [02 스냅] [03 가족] ...
```

### 5-3. 카테고리 트리 사이드패널 (선택적 표시)

필터 바 왼쪽에 접이식 트리 패널:

```
▼ 1차: 촬영 종류
  ▶ 01 웨딩          (1,234)
  ▼ 02 스냅          (4,567)
      ▶ 야외           (2,100)
      ▶ 스튜디오        (1,200)
      ▶ 실내 장소       (1,267)
  ▶ 03 가족           (890)
  ▶ ...
  ▶ 00 미분류         (3,045)   ← 미분류 별도 표시
```

클릭 시 해당 카테고리 코드가 URL에 반영 → 검색 결과 자동 갱신

### 5-4. 확인 구분자 직접 검색

검색창에 10자리 코드 입력 시 자동 인식 → 카테고리 코드 검색으로 처리:

```
[🔍 0101010101          ]  →  "0101010101"에 해당하는 사진 N장
                               카테고리: 웨딩 > 야외 > 웜 > 자연스러운 > 인물중심
```

**감지 로직:**
```jsx
const isCategoryCode = /^\d{10}$/.test(searchValue.trim());
// true이면 ?categoryCode=0101010101 파라미터로 전환
// false이면 일반 keyword 검색
```

### 5-5. 카테고리별 통계 뱃지

각 카드에 확인 구분자를 디코딩해 카테고리 레이블 표시:

```
┌──────────────┐
│  [이미지]     │
│  WARM       │  ← 3차 무드 뱃지 (기존)
│  웨딩 · 야외  │  ← 1차+2차 카테고리 뱃지 (신규)
│              │
│  봄의 기억   │
│  웹관리자    │
│  ❤️10 🔖5 🔄2│
│  2026-01-15  │
│  [삭제]      │
└──────────────┘
```

---

## 6. 카테고리 분류 작업 UX

### 6-1. 개별 사진 분류 지정

카드 호버 시 `[분류]` 버튼 표시 → SlideOver 패널에서 5차 드롭다운 선택 후 저장

```
┌─────────────────────────────┐
│  사진 분류 지정              │
│  ─────────────────────────  │
│  1차 촬영종류: [웨딩       ▾]│
│  2차 촬영환경: [야외       ▾]│
│  3차 색채무드: [웜 (WARM)  ▾]│
│  4차 스타일:  [자연스러운  ▾]│
│  5차 세부속성: [인물 중심  ▾]│
│  ─────────────────────────  │
│  확인 구분자: 0101010101     │
│              ─────────────── │
│         [취소]  [저장]       │
└─────────────────────────────┘
```

저장 시 `PATCH /api/admin/photos/{id}/category-code` 호출

### 6-2. 일괄 분류 (Bulk Classification)

검색 결과에서 체크박스로 N장 선택 → 하단 액션바에서 카테고리 일괄 지정

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  15장 선택됨    [분류 일괄 지정 🏷]  [삭제 🗑]  [CSV ↓]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

일괄 지정 클릭 → 모달에서 특정 레벨만 선택적으로 덮어쓰기 가능:

```
일괄 분류 지정 (15장)
─────────────────────────────────────
☑ 1차 촬영종류:  [스냅        ▾]   ← 체크된 레벨만 덮어씀
☐ 2차 촬영환경:  (변경 없음)
☑ 3차 색채무드:  [뉴트럴      ▾]
☐ 4차 스타일:   (변경 없음)
☐ 5차 세부속성:  (변경 없음)
─────────────────────────────────────
→ 기존 코드에서 1차·3차만 교체 (나머지 유지)
```

**API:**
```
PATCH /api/admin/photos/bulk-category
Body: { "ids": [1,2,3,...], "updates": { "l1": "02", "l3": "03" } }
```

**서비스 로직:**
```java
// 특정 레벨만 업데이트 (나머지 유지)
photos.forEach(p -> {
    String code = p.getCategoryCode();
    if (l1 != null) code = CategoryCode.setLevel(code, 1, l1);
    if (l3 != null) code = CategoryCode.setLevel(code, 3, l3);
    p.setCategoryCode(code);
});
```

### 6-3. 미분류 사진 우선 작업 뷰

```
[미분류 사진만 보기]  →  categoryCode LIKE '00________' OR categoryCode = '0000000000'

미분류 3,045장 — 분류 작업이 필요합니다.
[전체 선택] [일괄 분류 지정]
```

---

## 7. API 전체 설계

### 7-1. 사진 목록 조회 (확장)

```
GET /api/admin/photos
```

| 파라미터 | 타입 | 현황 | 변경 |
|----------|------|------|------|
| `search` | String | ✅ | 카테고리 코드 10자리 자동 감지 추가 |
| `colorMood` | String | ✅ | 유지 (3차 코드와 연동) |
| `sort` | String[] | ✅ (단일) | → 다중: `sort=createdAt,DESC&sort=likesCount,DESC` |
| `l1` | String | ❌ | 신규: 1차 분류 코드 (2자리) |
| `l2` | String | ❌ | 신규: 2차 분류 코드 |
| `l3` | String | ❌ | 신규: 3차 분류 코드 |
| `l4` | String | ❌ | 신규: 4차 분류 코드 |
| `l5` | String | ❌ | 신규: 5차 분류 코드 |
| `categoryCode` | String | ❌ | 신규: 10자리 완전 일치 검색 |
| `unclassified` | boolean | ❌ | 신규: 미분류만 (`0000000000`) |
| `dateFrom` | LocalDate | ❌ | 신규 |
| `dateTo` | LocalDate | ❌ | 신규 |
| `minLikes` | int | ❌ | 신규 |
| `page`, `size` | int | ✅ | 유지 |

### 7-2. 신규 엔드포인트

```
PATCH  /api/admin/photos/{id}/category-code        → 개별 카테고리 지정
PATCH  /api/admin/photos/bulk-category             → 일괄 카테고리 지정
GET    /api/admin/categories?level={1~5}           → 분류 코드 마스터 조회
GET    /api/admin/categories/tree                  → 전체 트리
GET    /api/admin/photos/stats/category            → 카테고리별 사진 수 집계
DELETE /api/admin/photos/bulk                      → 일괄 삭제
GET    /api/admin/photos/suggestions               → 자동완성 후보
GET    /api/admin/photos/{id}                      → 상세 (description·categoryCode 포함)
```

### 7-3. DTO 변경

**AdminPhotoDto 추가 필드:**

```java
private String categoryCode;      // "0201030402"
private String l1Name;            // "스냅"
private String l2Name;            // "야외"
private String l3Name;            // "NEUTRAL"
private String l4Name;            // "모던"
private String l5Name;            // "배경중심"
private String description;       // 설명 미리보기 (100자 truncate)
```

---

## 8. 구현 우선순위 & 로드맵

### 임팩트 × 난이도 매트릭스

| 기능 | 임팩트 | 난이도 | 우선순위 |
|------|--------|--------|----------|
| ✅ description·profileName 검색 | 높음 | 낮음 | **완료** |
| ✅ URL 상태 동기화 | 높음 | 낮음 | **완료** |
| ✅ 검색 결과 카운트 + 빈 상태 | 중간 | 낮음 | **완료** |
| ✅ 검색어 하이라이트 | 중간 | 낮음 | **완료** |
| DB 컬럼 `category_code` 추가 | 높음 | 낮음 | **P0** |
| 카테고리 마스터 테이블 + API | 높음 | 중간 | **P0** |
| 5차 카테고리 필터 (백엔드 JPQL) | 높음 | 중간 | **P0** |
| 카테고리 드롭다운 UI (5레벨) | 높음 | 중간 | **P0** |
| 복합 정렬 SortBuilder UI | 중간 | 중간 | **P1** |
| 관련도 정렬 (CASE WHEN) | 중간 | 높음 | **P1** |
| 개별 카테고리 지정 SlideOver | 높음 | 중간 | **P1** |
| 확인 구분자 직접 검색 | 중간 | 낮음 | **P1** |
| 일괄 분류 지정 (BulkCategory) | 높음 | 높음 | **P2** |
| 카테고리 트리 사이드패널 | 중간 | 높음 | **P2** |
| 미분류 우선 작업 뷰 | 중간 | 낮음 | **P2** |
| 날짜 범위 필터 | 중간 | 중간 | **P2** |
| 정렬 프리셋 저장 | 낮음 | 낮음 | **P3** |
| 체크박스 + 벌크 삭제 | 높음 | 높음 | **P3** |
| CSV 내보내기 | 중간 | 중간 | **P3** |
| AI 유사 사진 추천 | 높음 | 매우 높음 | **장기** |

### 단계별 로드맵

```
Phase 0 (완료) ──────────────────────────────────
  [x] description·profileName JPQL 추가
  [x] colorMood 한국어 별칭 변환
  [x] URL 상태 동기화
  [x] 검색 결과 카운트 + 빈 상태 + Highlight

Phase 1 (2~3일) ─────────────────────────────────  ← 현재 목표
  [ ] DB: photos.category_code CHAR(10) 컬럼 추가
  [ ] 카테고리 마스터 테이블 + DataInitializer 시드
  [ ] CategoryCode 유틸리티 클래스
  [ ] 백엔드 JPQL l1~l5 필터 파라미터 추가
  [ ] PATCH /photos/{id}/category-code API
  [ ] GET /categories?level= API
  [ ] 프론트엔드: 5레벨 카테고리 드롭다운 필터
  [ ] 프론트엔드: 확인 구분자 직접 검색 감지

Phase 2 (2~3일) ─────────────────────────────────
  [ ] 복합 정렬 SortBuilder 컴포넌트
  [ ] 관련도 정렬 (서비스 CASE WHEN)
  [ ] 개별 카테고리 지정 SlideOver 패널
  [ ] 카드에 카테고리 뱃지 표시 (1차·2차)
  [ ] 미분류 우선 작업 뷰

Phase 3 (3~4일) ─────────────────────────────────
  [ ] 일괄 카테고리 지정 (체크박스 + BulkModal)
  [ ] 카테고리 트리 사이드패널
  [ ] 날짜 범위 필터
  [ ] 정렬 프리셋 저장 (localStorage)

Phase 4 (3~5일) ─────────────────────────────────
  [ ] 벌크 삭제 API + 하단 액션 바
  [ ] CSV 내보내기 (카테고리 코드 포함)
  [ ] 그리드/리스트 뷰 전환
  [ ] 최근 검색어 localStorage

장기 ──────────────────────────────────────────────
  [ ] 태그 검색 연동 (PhotoTag 엔티티)
  [ ] AI 분류 제안 (미분류 사진 자동 분류)
  [ ] 색채 유사 사진 추천
```

---

## 9. 기술 결정 사항

### 카테고리 코드 저장 방식 비교

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| `CHAR(10)` 단일 컬럼 | 간단, 인덱스 효율적 | SUBSTRING 쿼리 필요 | **채택** |
| 레벨별 컬럼 5개 (`l1` ~ `l5`) | 쿼리 직관적 | 컬럼 수 증가, 마이그레이션 복잡 | 미채택 |
| JSON 컬럼 | 유연성 높음 | H2 지원 제한, 인덱스 불가 | 미채택 |

### 복합 정렬 URL 직렬화

```
?sort=createdAt,DESC&sort=likesCount,DESC
```

Spring `@RequestParam List<String> sort` 자동 바인딩 지원.
프론트엔드 `URLSearchParams`는 동일 키 중복 허용:

```js
const params = new URLSearchParams();
sortOrders.forEach(o => params.append('sort', `${o.key},${o.dir}`));
```

### 정렬 관련도 점수 — 네이티브 쿼리 사용 이유

JPQL은 `SELECT` 절에 임의 표현식을 `Pageable`과 함께 `ORDER BY`로 참조하는 데 제약이 있음.
관련도 정렬은 **네이티브 쿼리 + `@Query(nativeQuery=true)`** 또는
**Specification + CriteriaBuilder** 사용 권장.

---

## 10. 접근성 & 성능

### 접근성 (WCAG 2.1 AA)

- 카테고리 드롭다운: `aria-label="1차 촬영종류 선택"`, `role="combobox"`
- 카테고리 트리: `role="tree"`, `aria-expanded`, `aria-selected`
- 정렬 빌더: `aria-label="정렬 기준 {순번}"`
- 결과 카운트: `role="status"` `aria-live="polite"`
- 일괄 체크박스: `aria-label="[제목] 사진 선택"`, `aria-checked`

### 성능 최적화

- **카테고리 마스터 캐싱** — `GET /categories` 응답을 `localStorage`에 24시간 캐시 (변경 빈도 낮음)
- **Intersection Observer** — 그리드 1000건 이상 시 지연 렌더링
- **React.memo + useMemo** — PhotoCard, CategoryDropdown 메모이제이션
- **Debounce 조정** — 검색 300ms, 복합 정렬 변경 0ms (즉시 반영)
- **Optimistic Update** — 카테고리 지정 시 서버 응답 전 UI 선반영

---

## 11. 향후 확장 포인트

1. **AI 자동 분류** — 이미지 인식 모델로 업로드 시 1~3차 자동 코드 제안 (`confidence: 0.87`)
2. **분류 코드 검색 기록 분석** — 어떤 카테고리 조합이 자주 검색되는지 → 콘텐츠 트렌드 파악
3. **저장된 검색 프리셋** — 카테고리 + 정렬 + 날짜 조합을 이름으로 저장/공유
4. **카테고리별 신고 집계** — 향후 신고 시스템 연동 시 `신고 많은 카테고리` 우선 노출
5. **다국어 카테고리명** — `name_ko` / `name_en` 분리로 영문 관리 UI 확장 지원
