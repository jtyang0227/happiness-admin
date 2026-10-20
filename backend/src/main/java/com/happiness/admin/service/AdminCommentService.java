package com.happiness.admin.service;

import com.happiness.admin.dto.AdminCommentDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Comment;
import com.happiness.admin.entity.Photo;
import com.happiness.admin.repository.CommentRepository;
import com.happiness.admin.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCommentService {

    private final CommentRepository commentRepository;
    private final PhotoRepository photoRepository;
    private final AdminActivityRecorder activityRecorder;

    public PageResponse<AdminCommentDto> getComments(Long photoId, String search, int page, int size) {
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending().and(Sort.by("id").descending()));
        var comments = commentRepository.search(photoId, searchTerm, pageable);

        List<Long> photoIds = comments.getContent().stream().map(Comment::getPhotoId).distinct().toList();
        Map<Long, Photo> photos = photoIds.isEmpty() ? Map.of()
                : photoRepository.findAllById(photoIds).stream().collect(Collectors.toMap(Photo::getId, Function.identity()));

        List<Long> topLevelIds = comments.getContent().stream()
                .filter(c -> c.getParentId() == null).map(Comment::getId).toList();
        Map<Long, Long> replyCounts = new HashMap<>();
        if (!topLevelIds.isEmpty()) {
            for (Object[] row : commentRepository.countRepliesByParentIdIn(topLevelIds)) {
                replyCounts.put((Long) row[0], (Long) row[1]);
            }
        }

        return PageResponse.of(comments.map(c -> {
            Photo p = photos.get(c.getPhotoId());
            return AdminCommentDto.from(c,
                    p != null ? p.getTitle() : null,
                    p != null ? p.getThumbnailUrl() : null,
                    replyCounts.getOrDefault(c.getId(), 0L));
        }));
    }

    public Map<String, Long> getCounts() {
        return Map.of(
                "total", commentRepository.count(),
                "today", commentRepository.countByCreatedAtGreaterThanEqual(LocalDate.now().atStartOfDay())
        );
    }

    /** 최상위 댓글을 지우면 대댓글도 함께 지운다 — App CommentService.deleteComment와 같은 규칙. */
    @Transactional
    public int deleteComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        List<Comment> replies = comment.getParentId() == null ? commentRepository.findByParentId(id) : List.of();
        commentRepository.deleteAll(replies);
        commentRepository.delete(comment);
        String preview = comment.getContent().length() > 60 ? comment.getContent().substring(0, 60) + "…" : comment.getContent();
        activityRecorder.record("COMMENT_DELETE", "COMMENT", id,
                comment.getMemberName() + ": " + preview + (replies.isEmpty() ? "" : " (답글 " + replies.size() + "개 포함)"));
        return replies.size() + 1;
    }
}
