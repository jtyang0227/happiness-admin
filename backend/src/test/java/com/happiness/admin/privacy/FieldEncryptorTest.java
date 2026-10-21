package com.happiness.admin.privacy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.util.Base64;

import static org.assertj.core.api.Assertions.*;

class FieldEncryptorTest {

    private static final String KEY = Base64.getEncoder().encodeToString(new byte[32]);

    private FieldEncryptor encryptor() {
        return new FieldEncryptor(KEY, new MockEnvironment());
    }

    @Test
    void roundTrip_restoresPlaintext() {
        FieldEncryptor enc = encryptor();
        String stored = enc.encrypt("후기 3건 중 2건이 같은 IP");
        assertThat(stored).startsWith(FieldEncryptor.PREFIX).doesNotContain("후기");
        assertThat(enc.decrypt(stored)).isEqualTo("후기 3건 중 2건이 같은 IP");
    }

    @Test
    void sameInput_producesDifferentCiphertext_randomIv() {
        FieldEncryptor enc = encryptor();
        assertThat(enc.encrypt("같은 문장")).isNotEqualTo(enc.encrypt("같은 문장"));
    }

    @Test
    void tamperedCiphertext_failsAuthentication() {
        FieldEncryptor enc = encryptor();
        byte[] raw = Base64.getDecoder().decode(enc.encrypt("원문").substring(FieldEncryptor.PREFIX.length()));
        raw[raw.length - 1] ^= 0x01;
        String tampered = FieldEncryptor.PREFIX + Base64.getEncoder().encodeToString(raw);
        assertThatThrownBy(() -> enc.decrypt(tampered)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void legacyPlaintext_isReturnedAsIs() {
        assertThat(encryptor().decrypt("이관 전 평문")).isEqualTo("이관 전 평문");
        assertThat(encryptor().encrypt(null)).isNull();
    }

    @Test
    void prodProfileWithoutKey_failsFast() {
        MockEnvironment prod = new MockEnvironment();
        prod.setActiveProfiles("prod");
        assertThatThrownBy(() -> new FieldEncryptor("", prod)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void wrongKeyLength_isRejected() {
        String shortKey = Base64.getEncoder().encodeToString(new byte[16]);
        assertThatThrownBy(() -> new FieldEncryptor(shortKey, new MockEnvironment())).isInstanceOf(IllegalStateException.class);
    }
}
