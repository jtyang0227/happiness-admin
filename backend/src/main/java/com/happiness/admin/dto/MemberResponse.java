package com.happiness.admin.dto;

import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.MemberStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberResponse {
    private Long id;
    private String email;
    private String name;
    private String tel;
    private MemberStatus status;
    private Authority authority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static MemberResponse fromEntity(Member member) {
        return MemberResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .tel(member.getTel())
                .status(member.getStatus())
                .authority(member.getAuthority())
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();
    }
}
