package com.happiness.admin.privacy;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PrivacyMaskerTest {

    @Test
    void email_keepsTwoCharsAndDomain() {
        assertThat(PrivacyMasker.email("user2@test.com")).isEqualTo("us***@test.com");
        assertThat(PrivacyMasker.email("a@x.com")).isEqualTo("a***@x.com");
        assertThat(PrivacyMasker.email("broken")).isEqualTo("***");
        assertThat(PrivacyMasker.email(null)).isNull();
    }

    @Test
    void tel_hidesMiddleDigits() {
        assertThat(PrivacyMasker.tel("010-1234-0002")).isEqualTo("010-****-0002");
        assertThat(PrivacyMasker.tel("01012340002")).isEqualTo("010****0002");
        assertThat(PrivacyMasker.tel("123")).isEqualTo("****");
    }
}
