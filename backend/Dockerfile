# ===============================================
# Dockerfile - 어드민 백엔드
# ===============================================
# 빌드 이미지
FROM eclipse-temurin:22-jdk-alpine AS builder

WORKDIR /build

# 소스 코드 복사
COPY . .

# 빌드
RUN chmod +x gradlew && \
    ./gradlew clean build -x test --no-daemon

# 실행 이미지
FROM eclipse-temurin:22-jre-alpine

WORKDIR /app

# 빌드 이미지에서 JAR 파일 복사
COPY --from=builder /build/build/libs/*.jar app.jar

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# 포트 노출
EXPOSE 8081

# 앱 실행
ENTRYPOINT ["sh", "-c", "java $JAVA_TOOL_OPTIONS -jar app.jar"]
