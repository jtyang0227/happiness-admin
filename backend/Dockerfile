# ── Stage 1: Build ────────────────────────────────────────────────────
# compile target = 21 이므로 JDK 21로 충분히 빌드 가능
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /workspace

COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew

# 의존성 레이어 캐시 (소스 변경 시에도 재다운로드 방지)
COPY build.gradle settings.gradle gradle.properties ./
RUN ./gradlew dependencies --no-daemon -q 2>/dev/null || true

COPY src src
RUN ./gradlew bootJar -x test --no-daemon -q

# ── Stage 2: Runtime ───────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

COPY --from=builder /workspace/build/libs/app.jar app.jar

ENV JAVA_OPTS="-Xms128m -Xmx400m \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
