package com.happiness.admin.controller;

import com.happiness.admin.dto.RoleUpdateRequest;
import com.happiness.admin.dto.StatusUpdateRequest;
import com.happiness.admin.service.AdminMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final AdminMemberService memberService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String authority,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(memberService.getMembers(search, authority, status, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.getMember(id));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody RoleUpdateRequest req) {
        memberService.updateRole(id, req.getAuthority());
        return ResponseEntity.ok(Map.of("message", "역할이 변경되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest req) {
        memberService.updateStatus(id, req.getStatus(), req.getReason(), req.getSuspendDays());
        return ResponseEntity.ok(Map.of("message", "상태가 변경되었습니다."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        memberService.deleteMember(id);
        return ResponseEntity.ok(Map.of("message", "회원이 삭제되었습니다."));
    }
}
