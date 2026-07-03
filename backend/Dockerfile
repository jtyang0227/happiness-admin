# ── Stage 1: Build ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /workspace

COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew

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

# 최소 비용 JVM 설정 — admin은 저트래픽이므로 256MB 상한으로 충분
ENV JAVA_OPTS="-Xms64m -Xmx256m \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=60.0 \
  -XX:+UseG1GC \
  -XX:G1HeapRegionSize=4m \
  -XX:+UseStringDeduplication \
  -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
