package com.happiness.admin.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class UrlSafetyTest {

    @Test
    void allowsHttpAndAppRelativeLinks() {
        assertThat(UrlSafety.requireSafeLink("https://happiness.app/events", "링크")).isEqualTo("https://happiness.app/events");
        assertThat(UrlSafety.requireSafeLink("/events/summer", "링크")).isEqualTo("/events/summer");
        assertThat(UrlSafety.requireSafeLink("", "링크")).isEmpty();
    }

    @Test
    void rejectsScriptAndProtocolRelativeLinks() {
        for (String bad : new String[]{"javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,<script>", "//evil.example/x", "vbscript:x", "https://"}) {
            assertThatThrownBy(() -> UrlSafety.requireSafeLink(bad, "링크")).as(bad).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    void imagesMustBeAbsoluteHttp() {
        assertThat(UrlSafety.requireSafeImage("https://cdn.example/a.png", "이미지")).isNotNull();
        assertThatThrownBy(() -> UrlSafety.requireSafeImage("/a.png", "이미지")).isInstanceOf(IllegalArgumentException.class);
    }
}
