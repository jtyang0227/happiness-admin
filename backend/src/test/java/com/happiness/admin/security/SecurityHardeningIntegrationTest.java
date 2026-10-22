package com.happiness.admin.security;

import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.MemberStatus;
import com.happiness.admin.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityHardeningIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired JwtTokenProvider jwt;
    @Autowired MemberRepository members;

    @Test
    void demotedOrSuspendedAdmin_tokenStopsWorkingImmediately() throws Exception {
        var sa = members.findByEmail("sa@happiness.dev").orElseThrow();
        String token = jwt.createToken(sa.getEmail(), Authority.SA);
        mvc.perform(get("/api/admin/members/summary").header("Authorization", "Bearer " + token)).andExpect(status().isOk());

        sa.setAuthority(Authority.US);
        members.save(sa);
        mvc.perform(get("/api/admin/members/summary").header("Authorization", "Bearer " + token)).andExpect(status().isForbidden());

        sa.setAuthority(Authority.SA);
        sa.setStatus(MemberStatus.SUSPENDED);
        members.save(sa);
        mvc.perform(get("/api/admin/members/summary").header("Authorization", "Bearer " + token)).andExpect(status().isForbidden());

        sa.setStatus(MemberStatus.ACTIVE);
        members.save(sa);
    }

    @Test
    void tokenClaimCannotEscalateRole() throws Exception {
        var sa = members.findByEmail("sa@happiness.dev").orElseThrow();
        String forgedWmClaim = jwt.createToken(sa.getEmail(), Authority.WM);
        mvc.perform(get("/api/admin/privacy-logs").header("Authorization", "Bearer " + forgedWmClaim)).andExpect(status().isForbidden());
    }

    @Test
    void activityLogCannotBeWrittenOrOverwrittenViaApi() throws Exception {
        var wm = members.findByEmail("admin@happiness.dev").orElseThrow();
        String token = jwt.createToken(wm.getEmail(), Authority.WM);
        mvc.perform(post("/api/admin/system/activity-logs").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content("{\"id\":1,\"adminName\":\"위조\",\"action\":\"X\"}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void corsRejectsUnknownOriginAndNeverAllowsCredentials() throws Exception {
        mvc.perform(options("/api/admin/members").header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        mvc.perform(options("/api/admin/members").header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    void malformedParameter_isBadRequestNotServerError() throws Exception {
        var wm = members.findByEmail("admin@happiness.dev").orElseThrow();
        mvc.perform(get("/api/admin/members").param("page", "abc")
                        .header("Authorization", "Bearer " + jwt.createToken(wm.getEmail(), Authority.WM)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unsafeBannerLink_isRejected() throws Exception {
        var wm = members.findByEmail("admin@happiness.dev").orElseThrow();
        mvc.perform(post("/api/admin/banners").header("Authorization", "Bearer " + jwt.createToken(wm.getEmail(), Authority.WM))
                        .contentType("application/json")
                        .content("{\"title\":\"x\",\"imageUrl\":\"https://cdn.example/a.png\",\"linkUrl\":\"javascript:alert(document.cookie)\"}"))
                .andExpect(status().isBadRequest());
    }
}
