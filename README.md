# 📊 해피니스 어드민 대시보드

React + Spring Boot로 만든 어드민 애플리케이션

## 프로젝트 구조

```
happiness-admin/
├── frontend/        (React 프론트엔드 - 포트 3001)
└── backend/         (Spring Boot 백엔드 - 포트 8081)
```

## 기술 스택

- **프론트엔드**: React 18.2.0
- **백엔드**:
  - Java 25 (OpenJDK)
  - Spring Boot 3.3.0
  - Gradle 8.12
  - Tomcat

## 설치 및 실행

### 백엔드 실행

```bash
cd backend

# 빌드
./gradlew clean build -x test --no-daemon

# 실행
java -jar build/libs/happiness-admin-backend-1.0.0.jar
```

### 프론트엔드 실행

```bash
cd frontend

# Python을 사용한 간단한 웹 서버
python3 -m http.server 3001 --directory .

# 또는 npm 설치 후
npm install
npm start
```

## API 엔드포인트

- **GET** `/api/admin/hello` - Hello World 메시지

## 테스트

```bash
# 백엔드 테스트
curl http://localhost:8081/api/admin/hello

# 프론트엔드
http://localhost:3001/index.html
```

## 포트 정보

- **백엔드**: 8081
- **프론트엔드**: 3001

---

생성일: 2026년 4월 18일
