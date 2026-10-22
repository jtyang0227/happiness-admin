package com.happiness.admin.privacy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * Admin 소유 자유서술 필드용 AES-256-GCM 암호화(인증 암호화 — 변조 시 복호화 실패).
 * 저장 형식: "enc:v1:" + Base64(IV 12바이트 ‖ 암호문 ‖ 태그 16바이트). 접두어가 없는 값은 이관 전 평문으로 보고 그대로 돌려준다.
 * 키는 PRIVACY_ENCRYPTION_KEY(Base64 32바이트) — prod 프로필에서 없으면 기동을 실패시킨다.
 */
@Slf4j
@Component
public class FieldEncryptor {

    static final String PREFIX = "enc:v1:";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final String DEV_KEY_SEED = "happiness-admin-dev-only-privacy-key";

    private static volatile FieldEncryptor instance;

    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public FieldEncryptor(@Value("${privacy.encryption-key:}") String base64Key, Environment env) {
        byte[] raw;
        if (base64Key == null || base64Key.isBlank()) {
            if (Arrays.asList(env.getActiveProfiles()).contains("prod")) {
                throw new IllegalStateException("PRIVACY_ENCRYPTION_KEY(Base64 32바이트)가 설정되지 않았습니다 — 운영에서는 필수입니다.");
            }
            log.warn("[PRIVACY] PRIVACY_ENCRYPTION_KEY 미설정 — 개발용 고정 키를 사용합니다. 운영에서는 반드시 설정하세요.");
            raw = sha256(DEV_KEY_SEED);
        } else {
            raw = Base64.getDecoder().decode(base64Key.trim());
            if (raw.length != 32) {
                throw new IllegalStateException("PRIVACY_ENCRYPTION_KEY는 Base64로 인코딩한 32바이트(AES-256)여야 합니다.");
            }
        }
        this.key = new SecretKeySpec(raw, "AES");
        instance = this;
    }

    static FieldEncryptor get() {
        if (instance == null) throw new IllegalStateException("FieldEncryptor가 초기화되지 않았습니다.");
        return instance;
    }

    public String encrypt(String plain) {
        if (plain == null || plain.startsWith(PREFIX)) return plain;
        try {
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] ct = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            return PREFIX + Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + ct.length).put(iv).put(ct).array());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("암호화에 실패했습니다.", e);
        }
    }

    public String decrypt(String stored) {
        if (stored == null || !stored.startsWith(PREFIX)) return stored;
        try {
            byte[] all = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, all, 0, IV_BYTES));
            return new String(cipher.doFinal(all, IV_BYTES, all.length - IV_BYTES), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("복호화에 실패했습니다 — 키가 다르거나 데이터가 변조되었습니다.", e);
        }
    }

    private static byte[] sha256(String s) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
