package com.happiness.admin.privacy;

import com.happiness.admin.entity.AdminMemberNote;
import com.happiness.admin.repository.AdminMemberNoteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PrivacyAtRestIntegrationTest {

    @Autowired AdminMemberNoteRepository noteRepository;
    @Autowired PrivacyAccessRecorder recorder;
    @Autowired JdbcTemplate jdbc;

    @Test
    void memberNote_isStoredEncrypted_andReadBackAsPlaintext() {
        AdminMemberNote saved = noteRepository.save(AdminMemberNote.builder()
                .memberId(1L).adminName("테스터").content("고객 연락처 010-9999-0000 로 회신 요청").build());

        String raw = jdbc.queryForObject("SELECT content FROM admin_member_notes WHERE id = ?", String.class, saved.getId());
        assertThat(raw).startsWith("enc:v1:").doesNotContain("010-9999-0000");
        assertThat(noteRepository.findById(saved.getId()).orElseThrow().getContent()).contains("010-9999-0000");
    }

    @Test
    void legacyPlaintextRow_isStillReadable() {
        jdbc.update("INSERT INTO admin_member_notes (member_id, admin_name, content, created_at) VALUES (1, '이관', '이관 전 평문 메모', CURRENT_TIMESTAMP)");
        Long id = jdbc.queryForObject("SELECT MAX(id) FROM admin_member_notes", Long.class);
        assertThat(noteRepository.findById(id).orElseThrow().getContent()).isEqualTo("이관 전 평문 메모");
    }

    @Test
    void accessLogHashChain_detectsTampering() {
        recorder.record("VIEW", 4L, 1, null, "테스트 열람");
        recorder.record("REVEAL", 4L, 1, "본인 확인 문의 대응", "원문 열람");
        assertThat(recorder.verify()).containsEntry("valid", true);

        Long target = jdbc.queryForObject("SELECT MAX(id) FROM admin_privacy_access_logs WHERE action = 'REVEAL'", Long.class);
        jdbc.update("UPDATE admin_privacy_access_logs SET reason = '사유 조작' WHERE id = ?", target);

        Map<String, Object> result = recorder.verify();
        assertThat(result).containsEntry("valid", false);
        assertThat(result.get("brokenAtId")).isEqualTo(target);
    }
}
