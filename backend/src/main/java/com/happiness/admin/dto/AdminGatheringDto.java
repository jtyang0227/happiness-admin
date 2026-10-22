package com.happiness.admin.dto;

import com.happiness.admin.entity.Gathering;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminGatheringDto {
    private Long id;
    private String title;
    private String description;
    private String location;
    private String shootTheme;
    private String thumbnailUrl;
    private String status;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private LocalDateTime recruitmentEndDateTime;
    private int maxParticipants;
    private int participantCount;
    private int postCount;
    private Long createdBy;
    private String hostName;
    private LocalDateTime createdAt;

    public static AdminGatheringDto from(Gathering g, String hostName, long participantCount, long postCount) {
        return AdminGatheringDto.builder()
                .id(g.getId())
                .title(g.getTitle())
                .description(g.getDescription())
                .location(g.getLocation())
                .shootTheme(g.getShootTheme())
                .thumbnailUrl(g.getThumbnailUrl())
                .status(g.getStatus())
                .startDateTime(g.getStartDateTime())
                .endDateTime(g.getEndDateTime())
                .recruitmentEndDateTime(g.getRecruitmentEndDateTime())
                .maxParticipants(g.getMaxParticipants() != null ? g.getMaxParticipants() : 0)
                .participantCount((int) participantCount)
                .postCount((int) postCount)
                .createdBy(g.getCreatedBy())
                .hostName(hostName)
                .createdAt(g.getCreatedAt())
                .build();
    }
}
