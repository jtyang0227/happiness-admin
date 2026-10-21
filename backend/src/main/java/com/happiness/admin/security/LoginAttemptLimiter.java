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

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
