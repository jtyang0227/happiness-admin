package com.happiness.admin.security;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 같은 이메일로 연속 실패가 MAX_FAILURES에 이르면 LOCK_DURATION 동안 로그인을 막는다(무차별 대입 방지).
 * 인메모리라 단일 인스턴스 기준 — 다중 인스턴스로 늘리면 공유 저장소로 옮겨야 한다.
 */
@Component
public class LoginAttemptLimiter {

    static final int MAX_FAILURES = 5;
    static final Duration LOCK_DURATION = Duration.ofMinutes(15);
    /** 임의 이메일로 실패를 쏟아 메모리를 고갈시키는 것을 막는 상한 */
    static final int MAX_TRACKED = 10_000;

    private record Attempt(int failures, Instant lockedUntil) {}

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptLimiter() {
        this(Clock.systemUTC());
    }

    LoginAttemptLimiter(Clock clock) {
        this.clock = clock;
    }

    /** 잠겨 있으면 남은 시간, 아니면 Duration.ZERO */
    public Duration remainingLock(String email) {
        Attempt a = attempts.get(key(email));
        if (a == null || a.lockedUntil() == null) return Duration.ZERO;
        Duration left = Duration.between(clock.instant(), a.lockedUntil());
        if (left.isNegative() || left.isZero()) {
            attempts.remove(key(email));
            return Duration.ZERO;
        }
        return left;
    }

    public void recordFailure(String email) {
        if (attempts.size() >= MAX_TRACKED) prune();
        attempts.compute(key(email), (k, a) -> {
            int failures = (a == null ? 0 : a.failures()) + 1;
            return failures >= MAX_FAILURES
                    ? new Attempt(failures, clock.instant().plus(LOCK_DURATION))
                    : new Attempt(failures, null);
        });
    }

    public void recordSuccess(String email) {
        attempts.remove(key(email));
    }

    /** 잠금이 끝났거나 잠기지 않은 항목을 비운다 — 잠금 중인 계정은 유지해 무차별 대입 방어를 깨지 않는다. */
    private void prune() {
        Instant now = clock.instant();
        attempts.entrySet().removeIf(e -> e.getValue().lockedUntil() == null || e.getValue().lockedUntil().isBefore(now));
    }

    int trackedCount() {
        return attempts.size();
    }

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
