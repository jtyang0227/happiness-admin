package com.happiness.admin.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

class LoginAttemptLimiterTest {

    private static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-10-21T00:00:00Z");
        @Override public ZoneId getZone() { return ZoneId.of("UTC"); }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    @Test
    void locksAfterMaxFailures_andUnlocksAfterDuration() {
        MutableClock clock = new MutableClock();
        LoginAttemptLimiter limiter = new LoginAttemptLimiter(clock);
        for (int i = 0; i < LoginAttemptLimiter.MAX_FAILURES - 1; i++) limiter.recordFailure("Admin@Happiness.dev");
        assertThat(limiter.remainingLock("admin@happiness.dev")).isEqualTo(Duration.ZERO);

        limiter.recordFailure("admin@happiness.dev");
        assertThat(limiter.remainingLock("ADMIN@happiness.dev")).isPositive();

        clock.now = clock.now.plus(LoginAttemptLimiter.LOCK_DURATION).plusSeconds(1);
        assertThat(limiter.remainingLock("admin@happiness.dev")).isEqualTo(Duration.ZERO);
    }

    @Test
    void successResetsFailures() {
        LoginAttemptLimiter limiter = new LoginAttemptLimiter(new MutableClock());
        for (int i = 0; i < LoginAttemptLimiter.MAX_FAILURES - 1; i++) limiter.recordFailure("a@b.c");
        limiter.recordSuccess("a@b.c");
        limiter.recordFailure("a@b.c");
        assertThat(limiter.remainingLock("a@b.c")).isEqualTo(Duration.ZERO);
    }
}
