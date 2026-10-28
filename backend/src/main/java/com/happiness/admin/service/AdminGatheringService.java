package com.happiness.admin.service;

import com.happiness.admin.dto.AdminGatheringDto;
import com.happiness.admin.dto.AdminGatheringPostDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Gathering;
import com.happiness.admin.entity.GatheringPhoto;
import com.happiness.admin.entity.GatheringPost;
import com.happiness.admin.entity.Member;
import com.happiness.admin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminGatheringService {

    private static final List<String> STATUSES =
            List.of("RECRUITING", "RECRUITMENT_CLOSED", "SCHEDULED", "ONGOING", "ENDED");

    private final GatheringRepository gatheringRepository;
    private final GatheringParticipantRepository participantRepository;
    private final GatheringPostRepository postRepository;
    private final GatheringPhotoRepository photoRepository;
    private final GatheringPostLikeRepository likeRepository;
    private final GatheringPostCommentRepository postCommentRepository;
    private final MemberRepository memberRepository;
    private final AdminActivityRecorder activityRecorder;

    public PageResponse<AdminGatheringDto> getGatherings(String status, String search, int page, int size) {
        String statusTerm = (status != null && !status.isBlank()) ? status : null;
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        var pageable = PageRequest.of(page, size, Sort.by("startDateTime").descending().and(Sort.by("id").descending()));
        var gatherings = gatheringRepository.search(statusTerm, searchTerm, pageable);

        List<Long> ids = gatherings.getContent().stream().map(Gathering::getId).toList();
        Map<Long, Long> participants = ids.isEmpty() ? Map.of() : toCountMap(participantRepository.countParticipatingByGatheringIdIn(ids));
        Map<Long, Long> posts = ids.isEmpty() ? Map.of() : toCountMap(postRepository.countByGatheringIdIn(ids));
        List<Long> hostIds = gatherings.getContent().stream().map(Gathering::getCreatedBy).distinct().toList();
        Map<Long, String> hostNames = hostIds.isEmpty() ? Map.of()
                : memberRepository.findAllById(hostIds).stream().collect(Collectors.toMap(Member::getId, Member::getName));

        return PageResponse.of(gatherings.map(g -> AdminGatheringDto.from(g,
                hostNames.get(g.getCreatedBy()),
                participants.getOrDefault(g.getId(), 0L),
                posts.getOrDefault(g.getId(), 0L))));
    }

    public Map<String, Long> getCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        STATUSES.forEach(s -> counts.put(s, 0L));
        for (Object[] row : gatheringRepository.countByStatus()) {
            counts.put((String) row[0], (Long) row[1]);
        }
        return counts;
    }

    public List<AdminGatheringPostDto> getPosts(Long gatheringId) {
        if (!gatheringRepository.existsById(gatheringId)) {
            throw new IllegalArgumentException("모임을 찾을 수 없습니다.");
        }
        List<GatheringPost> posts = postRepository.findByGatheringIdOrderByCreatedAtDesc(gatheringId);
        List<Long> postIds = posts.stream().map(GatheringPost::getId).toList();
        if (postIds.isEmpty()) return List.of();

        Map<Long, List<String>> photos = photoRepository.findByGatheringPostIdInOrderBySortOrderAsc(postIds).stream()
                .collect(Collectors.groupingBy(GatheringPhoto::getGatheringPostId,
                        Collectors.mapping(GatheringPhoto::getImageUrl, Collectors.toList())));
        Map<Long, Long> likes = toCountMap(likeRepository.countByGatheringPostIdIn(postIds));
        Map<Long, Long> comments = toCountMap(postCommentRepository.countByGatheringPostIdIn(postIds));

        return posts.stream().map(p -> AdminGatheringPostDto.builder()
                .id(p.getId())
                .gatheringId(p.getGatheringId())
                .memberId(p.getMemberId())
                .memberName(p.getMemberName())
                .content(p.getContent())
                .hashtags(p.getHashtags())
                .photoUrls(photos.getOrDefault(p.getId(), List.of()))
                .likeCount(likes.getOrDefault(p.getId(), 0L).intValue())
                .commentCount(comments.getOrDefault(p.getId(), 0L).intValue())
                .createdAt(p.getCreatedAt())
                .build()).toList();
    }

    /** App GatheringPostService.deletePost와 같은 순서로 연관 행(좋아요·댓글·사진)을 먼저 지운다 — FK가 없어 수동 정리. */
    @Transactional
    public void deletePost(Long postId) {
        GatheringPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        likeRepository.deleteByGatheringPostId(postId);
        postCommentRepository.deleteByGatheringPostId(postId);
        photoRepository.deleteByGatheringPostId(postId);
        postRepository.delete(post);
        String content = post.getContent() == null ? "" : post.getContent();
        activityRecorder.record("GATHERING_POST_DELETE", "GATHERING_POST", postId,
                "모임 #" + post.getGatheringId() + " · " + post.getMemberName() + ": "
                        + (content.length() > 60 ? content.substring(0, 60) + "…" : content));
    }

    private static Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }
}
