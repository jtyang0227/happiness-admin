package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

/** 게시글 삭제 시 연관 행 정리·집계용 최소 매핑 — 나머지 컬럼은 App이 관리한다. */
@Entity
@Table(name = "gathering_post_likes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GatheringPostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gathering_post_id", nullable = false)
    private Long gatheringPostId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;
}
