package com.happiness.admin.service;

import com.happiness.admin.dto.AdminMemberDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.AdminMemberNote;
import com.happiness.admin.entity.MemberStatus;
import com.happiness.admin.entity.Photo;
import com.happiness.admin.entity.Series;
import com.happiness.admin.repository.*;
import com.happiness.admin.security.CurrentAdminProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {

    private final MemberRepository memberRepository;
    private final PhotoRepository photoRepository;
    private final SeriesRepository seriesRepository;
    private final InquiryRepository inquiryRepository;
    private final SeriesPhotoRepository seriesPhotoRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioItemRepository portfolioItemRepository;
    private final BookingRepository bookingRepository;
    private final FeaturedItemRepository featuredItemRepository;
    private final VerificationRequestRepository verificationRepository;
    private final ReportRepository reportRepository;
    private final CommentRepository commentRepository;
    private final TestimonialRepository testimonialRepository;
    private final PricingPackageRepository pricingPackageRepository;
    private final PressFeatureRepository pressFeatureRepository;
    private final AchievementRepository achievementRepository;
    private final ClientBrandRepository clientBrandRepository;
    private final NewsletterSubscriberRepository newsletterSubscriberRepository;
    private final AdminMemberNoteRepository noteRepository;
    private final AdminActivityLogRepository activityLogRepository;
    private final AdminActivityRecorder activityRecorder;
    private final CurrentAdminProvider currentAdmin;

    static final int EXPORT_LIMIT = 5000;

    public PageResponse<AdminMemberDto> getMembers(String search, String authorityStr, String statusStr, int page, int size) {
        Authority authority = (authorityStr != null && !authorityStr.isBlank())
                ? Authority.valueOf(authorityStr) : null;
        MemberStatus status = (statusStr != null && !statusStr.isBlank())
                ? MemberStatus.valueOf(statusStr) : null;
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var memberPage = memberRepository.searchMembers(
                (search != null && !search.isBlank()) ? search : null,
                authority, status, pageable
        );

        List<Long> memberIds = memberPage.getContent().stream().map(Member::getId).toList();
        Map<Long, Long> photoCounts = memberIds.isEmpty() ? Map.of() : toCountMap(photoRepository.countByMemberIdIn(memberIds));
        Map<Long, Long> seriesCounts = memberIds.isEmpty() ? Map.of() : toCountMap(seriesRepository.countByMemberIdIn(memberIds));
        Map<Long, Long> inquiryCounts = memberIds.isEmpty() ? Map.of() : toCountMap(inquiryRepository.countBySenderIdIn(memberIds));
        Map<Long, Long> portfolioCounts = memberIds.isEmpty() ? Map.of() : toCountMap(portfolioRepository.countByMemberIdIn(memberIds));

        return PageResponse.of(memberPage.map(m -> AdminMemberDto.from(m,
                photoCounts.getOrDefault(m.getId(), 0L),
                seriesCounts.getOrDefault(m.getId(), 0L),
                inquiryCounts.getOrDefault(m.getId(), 0L),
                portfolioCounts.getOrDefault(m.getId(), 0L))));
    }

    private static Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }

    public AdminMemberDto getMember(Long id) {
        Member m = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        return toDto(m);
    }

    @Transactional
    public void updateRole(Long id, String authorityStr) {
        Member m = findMember(id);
        Member admin = currentAdmin.require();
        if (admin.getId().equals(id)) {
            throw new IllegalArgumentException("본인 계정의 역할은 변경할 수 없습니다.");
        }
        Authority before = m.getAuthority();
        Authority after = Authority.valueOf(authorityStr);
        if (before == after) return;
        m.setAuthority(after);
        memberRepository.save(m);
        activityRecorder.record("MEMBER_ROLE_CHANGE", "MEMBER", id, m.getName() + ": " + before + " → " + after);
    }

    /**
     * 상태 전환 — SUSPENDED(정지), ACTIVE(해제·복구), INACTIVE, DELETED(탈퇴 처리, 데이터 보존).
     * 본인 계정은 바꿀 수 없고, 관리자 계정(WM/SA)의 정지·탈퇴는 WM만 할 수 있다.
     */
    @Transactional
    public void updateStatus(Long id, String statusStr, String reason, Integer suspendDays) {
        MemberStatus newStatus;
        try {
            newStatus = MemberStatus.valueOf(statusStr);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("잘못된 상태 값입니다: " + statusStr);
        }
        Member m = findMember(id);
        Member admin = currentAdmin.require();
        if (admin.getId().equals(id)) {
            throw new IllegalArgumentException("본인 계정의 상태는 변경할 수 없습니다.");
        }
        boolean targetIsAdmin = m.getAuthority() == Authority.WM || m.getAuthority() == Authority.SA;
        boolean restrictive = newStatus == MemberStatus.SUSPENDED || newStatus == MemberStatus.DELETED;
        if (targetIsAdmin && restrictive && admin.getAuthority() != Authority.WM) {
            throw new IllegalArgumentException("관리자 계정의 정지·탈퇴는 웹관리자만 할 수 있습니다.");
        }
        if (newStatus == MemberStatus.SUSPENDED && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("정지 사유를 입력해 주세요.");
        }

        MemberStatus before = m.getStatus();
        m.setStatus(newStatus);
        if (newStatus == MemberStatus.SUSPENDED) {
            m.setSuspendReason(reason);
            m.setSuspendedAt(LocalDateTime.now());
            m.setSuspendedById(admin.getId());
            m.setSuspendUntil(suspendDays != null && suspendDays > 0
                    ? LocalDateTime.now().plusDays(suspendDays) : null);
        } else {
            m.setSuspendReason(null);
            m.setSuspendUntil(null);
            m.setSuspendedAt(null);
            m.setSuspendedById(null);
        }
        memberRepository.save(m);
        activityRecorder.record(statusAction(before, newStatus), "MEMBER", id, statusDetail(m, before, newStatus, reason, suspendDays));
    }

    private static String statusAction(MemberStatus before, MemberStatus after) {
        return switch (after) {
            case SUSPENDED -> "MEMBER_SUSPEND";
            case DELETED -> "MEMBER_WITHDRAW";
            case ACTIVE -> before == MemberStatus.DELETED ? "MEMBER_RESTORE"
                    : before == MemberStatus.SUSPENDED ? "MEMBER_UNSUSPEND" : "MEMBER_STATUS_CHANGE";
            default -> "MEMBER_STATUS_CHANGE";
        };
    }

    private static String statusDetail(Member m, MemberStatus before, MemberStatus after,
                                       String reason, Integer suspendDays) {
        StringBuilder sb = new StringBuilder(m.getName()).append(": ").append(before).append(" → ").append(after);
        if (after == MemberStatus.SUSPENDED) {
            sb.append(" · ").append(suspendDays != null && suspendDays > 0 ? suspendDays + "일" : "영구");
            sb.append(" · 사유: ").append(reason);
        }
        return sb.toString();
    }

    /** 정지 기간이 지난 회원을 자동 해제한다 — App은 SUSPENDED면 로그인을 막으므로 해제하지 않으면 영구 정지가 된다. */
    @Transactional
    public int releaseExpiredSuspensions() {
        List<Member> expired = memberRepository.findExpiredSuspensions(LocalDateTime.now());
        for (Member m : expired) {
            String until = m.getSuspendUntil().toString().replace('T', ' ').substring(0, 16);
            m.setStatus(MemberStatus.ACTIVE);
            m.setSuspendReason(null);
            m.setSuspendUntil(null);
            m.setSuspendedAt(null);
            m.setSuspendedById(null);
            memberRepository.save(m);
            activityRecorder.recordSystem("MEMBER_SUSPEND_EXPIRED", "MEMBER", m.getId(),
                    m.getName() + ": 정지 기간 만료(" + until + ")로 자동 해제");
        }
        return expired.size();
    }

    /**
     * 영구 삭제 — WM 전용(컨트롤러), 이미 탈퇴 처리(DELETED)된 회원만. FK 순서대로 연관 데이터를 정리한다.
     * App 쪽 FK 없는 테이블(댓글·프로필 콘텐츠·뉴스레터)도 Admin이 매핑한 범위는 함께 지운다.
     */
    @Transactional
    public void deleteMember(Long id) {
        Member m = findMember(id);
        if (currentAdmin.require().getId().equals(id)) {
            throw new IllegalArgumentException("본인 계정은 삭제할 수 없습니다.");
        }
        if (m.getStatus() != MemberStatus.DELETED) {
            throw new IllegalArgumentException("먼저 탈퇴 처리한 회원만 영구 삭제할 수 있습니다.");
        }
        List<Long> photoIds = photoRepository.findByMemberId(id).stream().map(Photo::getId).toList();
        List<Long> seriesIds = seriesRepository.findByMemberId(id).stream().map(Series::getId).toList();

        inquiryRepository.deleteBySenderId(id);
        inquiryRepository.deleteByReceiverId(id);
        bookingRepository.deleteByMember(id);
        portfolioRepository.findByMemberId(id).forEach(portfolioRepository::delete);
        portfolioRepository.clearReviewer(id);
        if (!photoIds.isEmpty()) {
            portfolioItemRepository.deleteByPhotoIdIn(photoIds);
            featuredItemRepository.deleteByPhotoIdIn(photoIds);
            photoIds.forEach(seriesPhotoRepository::deleteByPhotoId);
        }
        if (!seriesIds.isEmpty()) {
            portfolioItemRepository.deleteBySeriesIdIn(seriesIds);
        }
        commentRepository.deleteByMemberOrPhotos(id, photoIds.isEmpty() ? List.of(-1L) : photoIds);
        photoRepository.deleteAllById(photoIds);
        seriesRepository.deleteAllById(seriesIds);
        verificationRepository.deleteByMember(id);
        reportRepository.clearReporter(id);
        testimonialRepository.deleteByMemberId(id);
        pricingPackageRepository.deleteByMemberId(id);
        pressFeatureRepository.deleteByMemberId(id);
        achievementRepository.deleteByMemberId(id);
        clientBrandRepository.deleteByMemberId(id);
        newsletterSubscriberRepository.deleteByMemberId(id);
        noteRepository.deleteByMemberId(id);
        memberRepository.delete(m);
        activityRecorder.record("MEMBER_DELETE", "MEMBER", id,
                m.getName() + " (" + m.getEmail() + ") 영구 삭제 · 사진 " + photoIds.size() + " · 시리즈 " + seriesIds.size());
    }

    public Map<String, Long> getSummary() {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("total", memberRepository.count());
        for (MemberStatus st : MemberStatus.values()) {
            summary.put(st.name(), memberRepository.countByStatus(st));
        }
        summary.put("new7d", memberRepository.countSince(now.minusDays(7)));
        summary.put("suspensionsEnding3d", memberRepository.countSuspensionsEndingBefore(now.plusDays(3)));
        return summary;
    }

    /** 현재 필터 결과를 내보낸다(최대 EXPORT_LIMIT명). 연락처는 제외 — 최소한의 개인정보만 반출. */
    @Transactional
    public List<Map<String, Object>> exportMembers(String search, String authorityStr, String statusStr) {
        Authority authority = (authorityStr != null && !authorityStr.isBlank()) ? Authority.valueOf(authorityStr) : null;
        MemberStatus status = (statusStr != null && !statusStr.isBlank()) ? MemberStatus.valueOf(statusStr) : null;
        var members = memberRepository.searchMembers((search != null && !search.isBlank()) ? search : null,
                authority, status, PageRequest.of(0, EXPORT_LIMIT, Sort.by("createdAt").descending())).getContent();
        activityRecorder.record("MEMBER_EXPORT", "MEMBER", null,
                "회원 " + members.size() + "명 CSV 내보내기 (상태=" + (status != null ? status : "전체")
                        + ", 역할=" + (authority != null ? authority : "전체") + (search != null && !search.isBlank() ? ", 검색=" + search : "") + ")");
        return members.stream().map(m -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", m.getId());
            row.put("name", m.getName());
            row.put("email", m.getEmail());
            row.put("profileName", m.getProfileName());
            row.put("authority", m.getAuthority());
            row.put("status", m.getStatus());
            row.put("verified", m.isVerified());
            row.put("createdAt", m.getCreatedAt());
            return row;
        }).toList();
    }

    public List<Map<String, Object>> getHistory(Long id) {
        findMember(id);
        return activityLogRepository.findByTarget("MEMBER", id).stream().map(l -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", l.getId());
            row.put("action", l.getAction());
            row.put("adminName", l.getAdminName());
            row.put("details", l.getDetails());
            row.put("createdAt", l.getCreatedAt());
            return row;
        }).toList();
    }

    public List<AdminMemberNote> getNotes(Long id) {
        findMember(id);
        return noteRepository.findByMemberIdOrderByCreatedAtDescIdDesc(id);
    }

    @Transactional
    public AdminMemberNote addNote(Long id, String content) {
        findMember(id);
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("메모 내용을 입력해 주세요.");
        }
        if (content.length() > 2000) {
            throw new IllegalArgumentException("메모는 2,000자까지 쓸 수 있습니다.");
        }
        Member admin = currentAdmin.require();
        return noteRepository.save(AdminMemberNote.builder()
                .memberId(id).adminId(admin.getId()).adminName(admin.getName()).content(content.trim()).build());
    }

    @Transactional
    public void deleteNote(Long memberId, Long noteId) {
        AdminMemberNote note = noteRepository.findById(noteId)
                .filter(n -> n.getMemberId().equals(memberId))
                .orElseThrow(() -> new IllegalArgumentException("메모를 찾을 수 없습니다."));
        Member admin = currentAdmin.require();
        if (!admin.getId().equals(note.getAdminId()) && admin.getAuthority() != Authority.WM) {
            throw new IllegalArgumentException("본인이 쓴 메모만 삭제할 수 있습니다.");
        }
        noteRepository.delete(note);
    }

    private Member findMember(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
    }

    private AdminMemberDto toDto(Member m) {
        return AdminMemberDto.from(m,
                photoRepository.countByMemberId(m.getId()),
                seriesRepository.countByMemberId(m.getId()),
                inquiryRepository.countBySenderId(m.getId()),
                portfolioRepository.countByMemberId(m.getId()));
    }
}
