package com.happiness.admin;

import com.happiness.admin.entity.*;
import com.happiness.admin.repository.*;
import com.happiness.admin.entity.Popup;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@Profile("!prod")
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final MemberRepository memberRepository;
    private final PhotoRepository photoRepository;
    private final InquiryRepository inquiryRepository;
    private final SeriesRepository seriesRepository;
    private final NoticeRepository noticeRepository;
    private final BannerRepository bannerRepository;
    private final ReportRepository reportRepository;
    private final VerificationRequestRepository verificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final PhotoCategoryRepository categoryRepository;
    private final PortfolioRepository portfolioRepository;
    private final FeaturedItemRepository featuredItemRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final AdminActivityLogRepository activityLogRepository;
    private final PopupRepository popupRepository;
    private final BookingRepository bookingRepository;
    private final CommentRepository commentRepository;
    private final SecurityAuditLogRepository securityAuditLogRepository;
    private final TestimonialRepository testimonialRepository;
    private final PricingPackageRepository pricingPackageRepository;
    private final PressFeatureRepository pressFeatureRepository;
    private final AchievementRepository achievementRepository;
    private final ClientBrandRepository clientBrandRepository;
    private final NewsletterSubscriberRepository newsletterSubscriberRepository;
    private final MeetRepository meetRepository;
    private final DeliverySetRepository deliverySetRepository;
    private final AdminMemberNoteRepository adminMemberNoteRepository;
    private final GatheringRepository gatheringRepository;
    private final GatheringParticipantRepository gatheringParticipantRepository;
    private final GatheringPostRepository gatheringPostRepository;
    private final GatheringPhotoRepository gatheringPhotoRepository;
    private final GatheringPostLikeRepository gatheringPostLikeRepository;
    private final GatheringPostCommentRepository gatheringPostCommentRepository;

    private static final String[] MOODS = {"WARM", "COOL", "NEUTRAL", "VIVID", "DARK", "SOFT"};
    private static final String[] SHOOT_TYPES = {"웨딩", "가족", "프로필", "스냅", "바디프로필", "커플"};

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (memberRepository.count() > 0) return;

        String pw = passwordEncoder.encode("Admin123!");
        String userPw = passwordEncoder.encode("User123!");

        Member wm = save(Member.builder().email("admin@happiness.dev").name("웹관리자").tel("010-0000-0001")
                .profileName("@admin").password(pw).status(MemberStatus.ACTIVE).authority(Authority.WM)
                .provider("local").build());
        Member sa = save(Member.builder().email("sa@happiness.dev").name("운영자").tel("010-0000-0002")
                .profileName("@sa_admin").password(pw).status(MemberStatus.ACTIVE).authority(Authority.SA)
                .provider("local").build());

        List<Member> users = new ArrayList<>();
        String[] names = {"김민준","이서연","박지호","최하은","정우진","강나은","조현우","윤소율","임태양","한채원"};
        for (int i = 0; i < names.length; i++) {
            users.add(save(Member.builder()
                    .email("user" + (i + 1) + "@test.com").name(names[i]).tel("010-1234-" + String.format("%04d", i + 1))
                    .profileName("@user" + (i + 1)).password(userPw)
                    .status(i == 9 ? MemberStatus.INACTIVE : MemberStatus.ACTIVE)
                    .authority(Authority.US).provider("local").build()));
        }

        List<Photo> photos = new ArrayList<>();
        String[] titles = {"봄의 기억","여름의 끝","가을 빛","겨울 향기","도시의 밤","새벽 안개","황혼의 시","빛과 그림자",
                "고요한 순간","파도의 리듬","숲속의 하루","꽃비","하늘의 색","빈 거리","기다림","두 사람","낮잠","소풍",
                "첫눈","연말","새벽빛","골든아워","실루엣","흑백의 미학","컬러풀","여행의 설렘","일상","그대","기억","순간"};

        for (int i = 0; i < 30; i++) {
            Member author = i < 5 ? wm : users.get(i % users.size());
            LocalDateTime photoTime = LocalDateTime.now().minusDays(i % 14).minusHours(i % 12);
            Photo p = photoRepository.save(Photo.builder()
                    .title(titles[i]).description(titles[i] + " - 작품 설명입니다.")
                    .imageUrl("https://picsum.photos/seed/photo" + i + "/800/600")
                    .thumbnailUrl("https://picsum.photos/seed/photo" + i + "/400/300")
                    .colorMood(MOODS[i % MOODS.length])
                    .likesCount(i * 7 + 10).savesCount(i * 3 + 5).sharesCount(i * 2 + 1)
                    .createdAt(photoTime).updatedAt(photoTime)
                    .member(author).build());
            photos.add(p);
        }

        Member[] photographers = {wm, sa, users.get(0), users.get(1), users.get(2)};
        for (int i = 0; i < 15; i++) {
            Member sender = users.get(i % users.size());
            Member receiver = photographers[i % photographers.length];
            LocalDateTime inqTime = LocalDateTime.now().minusDays(i % 10).minusHours(i % 6);
            inquiryRepository.save(Inquiry.builder()
                    .sender(sender).receiver(receiver)
                    .senderName(sender.getName()).senderEmail(sender.getEmail())
                    .shootType(SHOOT_TYPES[i % SHOOT_TYPES.length])
                    .shootDate(LocalDate.now().plusDays(i * 5L + 10))
                    .budget((i * 10 + 30) + "만원")
                    .message("안녕하세요, " + SHOOT_TYPES[i % SHOOT_TYPES.length] + " 촬영을 문의드립니다. 잘 부탁드립니다.")
                    .isRead(i % 3 == 0)
                    .processStatus(InquiryProcessStatus.values()[i % InquiryProcessStatus.values().length])
                    .createdAt(inqTime)
                    .build());
        }

        String[] seriesTitles = {"봄날의 기록","도시 스케치","자연의 숨결","인물 연작","빛의 탐구","계절의 변화","일상의 틈새","추억 모음"};
        for (int i = 0; i < 8; i++) {
            Member author = i < 3 ? wm : users.get(i % users.size());
            Series series = Series.builder()
                    .title(seriesTitles[i]).description(seriesTitles[i] + " 시리즈입니다.")
                    .coverImageUrl("https://picsum.photos/seed/series" + i + "/600/400")
                    .displayOrder(i + 1)
                    .likesCount(i * 11 + 15).viewCount(i * 23 + 40)
                    .shootType(SHOOT_TYPES[i % SHOOT_TYPES.length])
                    .draft(i == 7)
                    .featuredAt(i == 1 || i == 4 ? LocalDateTime.now().minusDays(i) : null)
                    .member(author).build();
            series.getSeriesPhotos().add(SeriesPhoto.builder()
                    .series(series).photo(photos.get(i * 3 % photos.size())).displayOrder(0).build());
            series.getSeriesPhotos().add(SeriesPhoto.builder()
                    .series(series).photo(photos.get((i * 3 + 1) % photos.size())).displayOrder(1).build());
            seriesRepository.save(series);
        }

        // Seed category master (5 levels)
        seedCategories();

        // Assign category codes and displayOrder to photos
        String[] catCodes = {
            "0101010101","0101020201","0201010301","0201030102","0301020401",
            "0301010501","0102010101","0401020201","0501010301","0201020401",
            "0701010201","0601030101","0101020302","0301010402","0201010501",
            "0801020101","0901010201","1001020301","0101010402","0201030103",
            "0301020204","0101010305","0501020101","0601010202","0701030301",
            "0201010404","0801020202","0301010103","0401020303","0501010101"
        };
        for (int i = 0; i < Math.min(photos.size(), catCodes.length); i++) {
            Photo ph = photos.get(i);
            ph.setCategoryCode(catCodes[i]);
            ph.setDisplayOrder(i + 1);
            photoRepository.save(ph);
        }

        // Seed portfolios
        seedPortfolios(photos, users, wm, sa);

        // ── 공지사항 ──────────────────────────────────────────
        String[][] noticeData = {
            {"점검", "2026년 6월 서버 점검 안내", "6월 20일 새벽 2시~4시 서버 점검을 진행합니다. 이용에 불편을 드려 죄송합니다.", "PUBLISHED"},
            {"일반", "신규 작가 모집 공고", "Happiness 플랫폼의 새로운 작가를 모집합니다. 지금 신청하세요!", "PUBLISHED"},
            {"이벤트", "여름 사진전 이벤트", "7월 한 달간 여름을 주제로 한 사진을 올려주세요. 최우수작에게 상금을 드립니다.", "PUBLISHED"},
            {"정책", "이용약관 변경 안내", "개인정보 처리방침이 일부 변경됩니다. 2026년 7월 1일부터 적용됩니다.", "PUBLISHED"},
            {"일반", "작가 인증 시스템 도입", "이제 전문 작가 인증 뱃지를 신청하실 수 있습니다.", "DRAFT"},
        };
        for (int i = 0; i < noticeData.length; i++) {
            noticeRepository.save(Notice.builder()
                    .type(noticeData[i][0]).title(noticeData[i][1]).content(noticeData[i][2])
                    .status(noticeData[i][3]).isPinned(i == 0)
                    .publishedAt("PUBLISHED".equals(noticeData[i][3]) ? LocalDateTime.now().minusDays(i + 1) : null)
                    .expiresAt(i == 0 ? LocalDateTime.now().plusDays(7) : null)
                    .authorId(wm.getId()).build());
        }

        // ── 배너 ──────────────────────────────────────────────
        String[][] bannerData = {
            {"여름 이벤트 배너", "https://picsum.photos/seed/banner1/1200/400", "/events/summer"},
            {"작가 모집 배너", "https://picsum.photos/seed/banner2/1200/400", "/recruit"},
            {"신규 기능 안내", "https://picsum.photos/seed/banner3/1200/400", "/notices"},
        };
        for (int i = 0; i < bannerData.length; i++) {
            bannerRepository.save(Banner.builder()
                    .title(bannerData[i][0]).imageUrl(bannerData[i][1]).linkUrl(bannerData[i][2])
                    .isActive(i < 2).displayOrder(i + 1)
                    .startsAt(LocalDateTime.now().minusDays(3))
                    .endsAt(i == 0 ? LocalDateTime.now().plusDays(30) : null)
                    .build());
        }

        // ── 신고 ──────────────────────────────────────────────
        String[] reasons = {"부적절 콘텐츠", "스팸", "저작권 침해", "허위 정보", "혐오 발언"};
        String[] statuses = {"PENDING", "PENDING", "IN_REVIEW", "ACTION_TAKEN", "DISMISSED",
                             "PENDING", "PENDING", "IN_REVIEW"};
        for (int i = 0; i < 8; i++) {
            reportRepository.save(Report.builder()
                    .reporter(users.get(i % users.size()))
                    .targetType(i % 3 == 0 ? "PHOTO" : (i % 3 == 1 ? "MEMBER" : "SERIES"))
                    .targetId(photos.get(i % photos.size()).getId())
                    .reason(reasons[i % reasons.length])
                    .details("해당 콘텐츠가 플랫폼 규정에 위반된다고 생각합니다.")
                    .status(statuses[i])
                    .build());
        }

        // ── 작가 인증 신청 ────────────────────────────────────
        String[] verStatuses = {"PENDING", "PENDING", "PENDING", "APPROVED", "REJECTED"};
        for (int i = 0; i < 5; i++) {
            Member applicant = users.get(i);
            VerificationRequest vr = VerificationRequest.builder()
                    .member(applicant)
                    .portfolioUrl("https://portfolio.example.com/" + applicant.getProfileName())
                    .bio(applicant.getName() + "입니다. 3년간 사진 작가로 활동했습니다.")
                    .status(verStatuses[i])
                    .build();
            if ("APPROVED".equals(verStatuses[i])) {
                vr.setReviewedAt(LocalDateTime.now().minusDays(2));
                applicant.setVerified(true);
                applicant.setVerifiedAt(LocalDateTime.now().minusDays(2));
                memberRepository.save(applicant);
            } else if ("REJECTED".equals(verStatuses[i])) {
                vr.setRejectReason("포트폴리오 작품 수가 부족합니다. 최소 10장 이상의 작품이 필요합니다.");
                vr.setReviewedAt(LocalDateTime.now().minusDays(1));
            }
            verificationRepository.save(vr);
        }

        // ── 피처드 콘텐츠 ─────────────────────────────────────
        for (int i = 0; i < 5; i++) {
            featuredItemRepository.save(FeaturedItem.builder()
                    .photo(photos.get(i * 2))
                    .displayOrder(i)
                    .startsAt(LocalDate.now().minusDays(7))
                    .endsAt(LocalDate.now().plusDays(30))
                    .addedById(wm.getId())
                    .build());
        }

        // ── 시스템 설정 ────────────────────────────────────────
        Map<String, String> configs = Map.of(
            "sort.default", "composite",
            "sort.new_author_boost_days", "30",
            "sort.composite_likes_weight", "0.5",
            "sort.composite_inquiries_weight", "0.3",
            "sort.composite_views_weight", "0.2",
            "maintenance.enabled", "false",
            "maintenance.message", "시스템 점검 중입니다. 잠시 후 다시 이용해 주세요."
        );
        for (Map.Entry<String, String> e : configs.entrySet()) {
            systemConfigRepository.save(SystemConfig.builder()
                    .key(e.getKey()).value(e.getValue()).build());
        }

        // ── 팝업 ──────────────────────────────────────────────
        Object[][] popupData = {
            {"여름 이벤트 팝업", "여름 사진전이 시작되었습니다!\n7월 한 달간 여름 사진을 올리고 상금을 받아가세요.", "https://picsum.photos/seed/popup1/600/400", "/events/summer", "HOME", true, true},
            {"신규 기능 안내", "작가 인증 시스템이 새롭게 도입되었습니다.\n지금 바로 신청하세요!", null, "/verifications", "ALL", true, false},
            {"서버 점검 안내", "6월 20일 새벽 2시~4시 서버 점검이 예정되어 있습니다.", null, null, "ALL", false, false},
        };
        for (int i = 0; i < popupData.length; i++) {
            popupRepository.save(Popup.builder()
                    .title((String) popupData[i][0])
                    .content((String) popupData[i][1])
                    .imageUrl((String) popupData[i][2])
                    .linkUrl((String) popupData[i][3])
                    .targetScreen((String) popupData[i][4])
                    .isActive((Boolean) popupData[i][5])
                    .showOnce((Boolean) popupData[i][6])
                    .displayOrder(i + 1)
                    .startsAt(LocalDateTime.now().minusDays(1))
                    .endsAt(i == 2 ? LocalDateTime.now().plusDays(1) : LocalDateTime.now().plusDays(30))
                    .build());
        }

        // ── 촬영 예약 ──────────────────────────────────────────
        Member[] bookingPhotographers = {wm, sa, users.get(0), users.get(1), users.get(2)};
        Object[][] bookingData = {
            // { photographerIdx, clientIdx, shootType, daysFromToday, status, budget }
            {0, 3, "웨딩 스냅",    0,  "CONFIRMED",  "120만원"},
            {1, 4, "가족 촬영",    0,  "CONFIRMED",  "80만원"},
            {2, 5, "프로필",       1,  "CONFIRMED",  "30만원"},
            {3, 6, "커플 스냅",    2,  "REQUESTED",  "50만원"},
            {4, 7, "바디프로필",   3,  "CONFIRMED",  "150만원"},
            {0, 8, "웨딩 스냅",    5,  "REQUESTED",  "200만원"},
            {1, 9, "가족 촬영",    7,  "REQUESTED",  "90만원"},
            {2, 3, "스냅",        10,  "CONFIRMED",  "40만원"},
            {3, 4, "프로필",      14,  "REQUESTED",  "25만원"},
            {4, 5, "커플 스냅",   21,  "CONFIRMED",  "60만원"},
            {0, 6, "웨딩 스냅",  -10,  "CANCELLED",  "180만원"},
            {1, 7, "가족 촬영",   -5,  "REJECTED",   "70만원"},
        };
        String[] locations = {"서울 용산구", "경기 하남시", "서울 성수동", "제주도 서귀포", "서울 마포구",
                              "인천 송도", "부산 해운대", "서울 종로구", "경기 수원", "강원 강릉",
                              "서울 광진구", "경기 판교"};
        for (int i = 0; i < bookingData.length; i++) {
            Object[] d = bookingData[i];
            Member ph = bookingPhotographers[(int) d[0]];
            Member cl = users.get((int) d[1] % users.size());
            bookingRepository.save(Booking.builder()
                    .photographer(ph)
                    .client(cl)
                    .clientName(cl.getName())
                    .shootType((String) d[2])
                    .shootDate(LocalDate.now().plusDays((int) d[3]))
                    .shootLocation(locations[i])
                    .budget((String) d[5])
                    .message("안녕하세요! " + d[2] + " 촬영을 예약하고 싶습니다.")
                    .status(BookingStatus.valueOf((String) d[4]))
                    .build());
        }

        // ── 관리자 활동 로그 ───────────────────────────────────
        String[][] logData = {
            {"MEMBER_SUSPEND", "MEMBER", "회원 정지 처리"},
            {"PHOTO_DELETE", "PHOTO", "부적절 사진 삭제"},
            {"VERIFICATION_APPROVE", "VERIFICATION", "작가 인증 승인"},
            {"REPORT_PROCESS", "REPORT", "신고 처리 완료"},
            {"NOTICE_PUBLISH", "NOTICE", "공지사항 발행"},
        };
        for (int i = 0; i < logData.length; i++) {
            activityLogRepository.save(AdminActivityLog.builder()
                    .adminId(i % 2 == 0 ? wm.getId() : sa.getId())
                    .adminName(i % 2 == 0 ? wm.getName() : sa.getName())
                    .action(logData[i][0])
                    .targetType(logData[i][1])
                    .targetId((long) (i + 1))
                    .details(logData[i][2])
                    .build());
        }

        seedComments(photos, users);
        seedGatherings(users, wm);
        seedSecurityAudit(users, wm);
        seedProfileContent(users, wm);
        seedNewsletter(users);
        seedTransactions(users, wm);
        seedMemberModeration(users, wm, sa);
    }

    private void seedMemberModeration(List<Member> users, Member wm, Member sa) {
        Member expired = users.get(5);
        expired.setStatus(MemberStatus.SUSPENDED);
        expired.setSuspendReason("스팸 댓글 반복");
        expired.setSuspendedAt(LocalDateTime.now().minusDays(7));
        expired.setSuspendUntil(LocalDateTime.now().minusMinutes(5));
        expired.setSuspendedById(wm.getId());
        memberRepository.save(expired);

        Member ending = users.get(6);
        ending.setStatus(MemberStatus.SUSPENDED);
        ending.setSuspendReason("허위 후기 작성");
        ending.setSuspendedAt(LocalDateTime.now().minusDays(1));
        ending.setSuspendUntil(LocalDateTime.now().plusDays(2));
        ending.setSuspendedById(sa.getId());
        memberRepository.save(ending);

        Member withdrawn = users.get(8);
        withdrawn.setStatus(MemberStatus.DELETED);
        memberRepository.save(withdrawn);

        adminMemberNoteRepository.save(AdminMemberNote.builder().memberId(ending.getId())
                .adminId(sa.getId()).adminName(sa.getName())
                .content("후기 3건 중 2건이 같은 IP에서 작성됨. 해제 후 재발 시 영구 정지 검토.")
                .createdAt(LocalDateTime.now().minusDays(1)).build());
        activityLogRepository.save(AdminActivityLog.builder().adminId(sa.getId()).adminName(sa.getName())
                .action("MEMBER_SUSPEND").targetType("MEMBER").targetId(ending.getId())
                .details(ending.getName() + ": ACTIVE → SUSPENDED · 3일 · 사유: 허위 후기 작성")
                .createdAt(LocalDateTime.now().minusDays(1)).build());
    }

    private void seedTransactions(List<Member> users, Member wm) {
        String[] meetStatuses = {"PENDING", "NEGOTIATING", "CONFIRMED", "COMPLETED", "CANCELLED", "PENDING", "NEGOTIATING", "CONFIRMED"};
        int[] idleDays = {12, 9, 1, 3, 5, 2, 15, 0};
        for (int i = 0; i < meetStatuses.length; i++) {
            LocalDateTime updated = LocalDateTime.now().minusDays(idleDays[i]);
            meetRepository.save(Meet.builder()
                    .requesterId(users.get(i % users.size()).getId())
                    .receiverId(i % 2 == 0 ? wm.getId() : users.get((i + 1) % users.size()).getId())
                    .status(meetStatuses[i])
                    .confirmedDate("CONFIRMED".equals(meetStatuses[i]) ? LocalDate.now().plusDays(i + 2) : null)
                    .createdAt(updated.minusDays(3)).updatedAt(updated).build());
        }
        Object[][] deliveries = {
            {"웨딩 본식 원본", "김지현", "PENDING", 2}, {"프로필 보정본", "박도윤", "APPROVED", 20},
            {"가족 야외 셀렉", "이수아", "PENDING", -1}, {"브랜드 룩북", "브랜드 스튜디오 N", "REJECTED", 10},
            {"돌잔치 스냅", "최민지", "PENDING", 12},
        };
        for (int i = 0; i < deliveries.length; i++) {
            LocalDateTime created = LocalDateTime.now().minusDays(7 + i);
            deliverySetRepository.save(DeliverySet.builder()
                    .memberId(i % 2 == 0 ? wm.getId() : users.get(i).getId())
                    .title((String) deliveries[i][0]).clientName((String) deliveries[i][1])
                    .status((String) deliveries[i][2])
                    .expiresAt(LocalDateTime.now().plusDays((Integer) deliveries[i][3]))
                    .viewedAt(i % 2 == 0 ? created.plusDays(1) : null)
                    .approvedAt("APPROVED".equals(deliveries[i][2]) ? created.plusDays(2) : null)
                    .createdAt(created).build());
        }
    }

    private void seedNewsletter(List<Member> users) {
        for (int i = 0; i < users.size(); i++) {
            Member m = users.get(i);
            LocalDateTime subscribed = LocalDateTime.now().minusDays(i * 6L + 1);
            newsletterSubscriberRepository.save(NewsletterSubscriber.builder()
                    .memberId(m.getId()).email(m.getEmail())
                    .token(java.util.UUID.randomUUID().toString().replace("-", ""))
                    .subscribedAt(subscribed)
                    .unsubscribedAt(i % 4 == 3 ? subscribed.plusDays(2) : null)
                    .build());
        }
    }

    private void seedProfileContent(List<Member> users, Member wm) {
        Member[] authors = {wm, users.get(0), users.get(1), users.get(2)};
        String[][] reviews = {
            {"김지현", "신부", "2026.09", "결혼식 스냅 너무 만족스러워요. 자연스러운 표정을 잘 잡아주셨어요."},
            {"박도윤", "스타트업 대표", "2026.08", "프로필 촬영 친절하게 디렉팅해주셔서 편했습니다."},
            {"익명", "고객", "2026.10", "최고!!! 무조건 여기서 찍으세요 ★★★★★ 할인코드 HAPPY50 (외부 링크 bit.ly/xx)"},
            {"이수아", "가족", "2026.07", "아이들 사진이 정말 따뜻하게 나왔어요."},
        };
        for (int i = 0; i < reviews.length; i++) {
            testimonialRepository.save(Testimonial.builder().memberId(authors[i].getId())
                    .clientName(reviews[i][0]).clientRole(reviews[i][1]).shootDate(reviews[i][2]).content(reviews[i][3])
                    .featured(i == 0).seriesId(i == 1 ? 2L : null)
                    .createdAt(LocalDateTime.now().minusDays(i * 3L)).build());
        }
        Object[][] packages = {{"베이직 프로필", 150000, null}, {"웨딩 본식 스냅", null, "문의 필요"}, {"가족 야외 촬영", 300000, null}};
        for (int i = 0; i < packages.length; i++) {
            pricingPackageRepository.save(PricingPackage.builder().memberId(authors[i].getId())
                    .name((String) packages[i][0]).price((Integer) packages[i][1]).priceLabel((String) packages[i][2])
                    .description("보정본 20장 · 원본 전체 제공").features("[\"보정 20장\",\"원본 제공\"]")
                    .featured(i == 0).active(i != 2)
                    .createdAt(LocalDateTime.now().minusDays(i * 5L)).build());
        }
        pressFeatureRepository.save(PressFeature.builder().memberId(wm.getId()).publication("월간 사진")
                .title("빛을 기록하는 사람들").publishedDate("2026.05").url("https://example.com/press/1")
                .createdAt(LocalDateTime.now().minusDays(20)).build());
        pressFeatureRepository.save(PressFeature.builder().memberId(users.get(1).getId()).publication("디자인 매거진")
                .title("신진 작가 인터뷰").publishedDate("2026.08").createdAt(LocalDateTime.now().minusDays(4)).build());
        String[][] achievements = {{"AWARD", "서울 사진 공모전 금상", "서울시", "서울", "2025.11"},
                {"EXHIBITION", "개인전 「여름의 끝」", "갤러리 담", "종로", "2026.08"}};
        for (int i = 0; i < achievements.length; i++) {
            achievementRepository.save(Achievement.builder().memberId(authors[i].getId())
                    .type(achievements[i][0]).title(achievements[i][1]).organizer(achievements[i][2])
                    .location(achievements[i][3]).yearMonth(achievements[i][4])
                    .createdAt(LocalDateTime.now().minusDays(i * 7L + 2)).build());
        }
        String[] brands = {"카페 오후", "브랜드 스튜디오 N", "한빛 웨딩홀"};
        for (int i = 0; i < brands.length; i++) {
            clientBrandRepository.save(ClientBrand.builder().memberId(authors[i].getId()).name(brands[i])
                    .logoUrl("https://picsum.photos/seed/brand" + i + "/120/120").displayOrder(i)
                    .createdAt(LocalDateTime.now().minusDays(i)).build());
        }
    }

    private void seedSecurityAudit(List<Member> users, Member wm) {
        String[] uris = {"GET /api/admin/reports", "PUT /api/admin/series/3/featured", "GET /api/admin/members", "DELETE /api/admin/photos/12"};
        for (int i = 0; i < 36; i++) {
            LocalDateTime at = LocalDateTime.now().minusMinutes(i * 47L);
            SecurityAuditLog.SecurityAuditLogBuilder b = SecurityAuditLog.builder().createdAt(at);
            switch (i % 6) {
                case 0, 3 -> b.actionType("LOGIN_FAILURE").success(false)
                        .actionDetail("email=" + (i % 4 == 0 ? "ad***@happiness.dev" : "us***@test.com"))
                        .ipAddress(i % 4 == 0 ? "203.0.113.45" : "198.51.100." + (i % 3 + 7));
                case 1, 4 -> {
                    Member m = users.get(i % users.size());
                    b.actionType("LOGIN_SUCCESS").success(true).memberId(m.getId())
                            .ipAddress("10.0.0." + (i % 20 + 2)).actionDetail("ip=10.0.0." + (i % 20 + 2));
                }
                case 2 -> b.actionType("ADMIN_API").success(true).memberId(wm.getId()).role("WM")
                        .ipAddress("10.0.0.2").actionDetail(uris[i % uris.length]);
                default -> b.actionType("SERVICE").memberId(users.get(i % users.size()).getId())
                        .success(i % 5 != 0).actionDetail("deleteAccount")
                        .errorMessage(i % 5 != 0 ? null : "비밀번호가 일치하지 않습니다.");
            }
            securityAuditLogRepository.save(b.build());
        }
    }

    private void seedComments(List<Photo> photos, List<Member> users) {
        String[] bodies = {"색감이 정말 따뜻하네요!", "구도가 인상적이에요.", "어떤 렌즈로 찍으셨나요?", "이런 분위기 너무 좋아요",
                "빛 표현이 예술입니다", "광고 문의는 DM 주세요 www.spam-example.com", "다음 작업도 기대할게요", "보정 팁 공유해주실 수 있나요?"};
        for (int i = 0; i < 16; i++) {
            Member writer = users.get(i % users.size());
            Comment parent = commentRepository.save(Comment.builder()
                    .photoId(photos.get(i % 8).getId()).memberId(writer.getId()).memberName(writer.getName())
                    .content(bodies[i % bodies.length])
                    .createdAt(LocalDateTime.now().minusHours(i * 5L))
                    .build());
            if (i % 3 == 0) {
                Member replier = users.get((i + 3) % users.size());
                commentRepository.save(Comment.builder()
                        .photoId(parent.getPhotoId()).memberId(replier.getId()).memberName(replier.getName())
                        .content("저도 같은 생각이에요 :)").parentId(parent.getId())
                        .createdAt(parent.getCreatedAt().plusMinutes(30))
                        .build());
            }
        }
    }

    private void seedGatherings(List<Member> users, Member wm) {
        Object[][] data = {
            {"한강 노을 출사", "여의도 한강공원", "골든아워 실루엣", "RECRUITING", 10},
            {"성수동 스트리트 스냅", "성수역 3번 출구", "스트리트 · 흑백", "RECRUITMENT_CLOSED", 8},
            {"북촌 한옥 인물 촬영", "북촌한옥마을", "자연광 인물", "SCHEDULED", 6},
            {"서울숲 가을 출사", "서울숲 정문", "단풍 · 역광", "ONGOING", 12},
            {"을지로 야경 출사", "을지로3가역", "네온 · 장노출", "ENDED", 8},
            {"제주 오름 일출 출사", "용눈이오름", "일출 · 풍경", "ENDED", 15},
        };
        int[] dayOffsets = {10, 5, 3, 0, -7, -20};
        String[] postBodies = {"오늘 모임 덕분에 좋은 사진 많이 건졌어요!", "다음에도 꼭 참여할게요 📸",
                "보정 전후 비교 올려봅니다", "단톡방 링크 여기 있어요 bit.ly/xxxx (홍보 아님)"};
        for (int i = 0; i < data.length; i++) {
            LocalDateTime start = LocalDateTime.now().plusDays(dayOffsets[i]).withHour(17).withMinute(0).withSecond(0).withNano(0);
            Member host = i == 0 ? wm : users.get(i);
            Gathering g = gatheringRepository.save(Gathering.builder()
                    .title((String) data[i][0]).location((String) data[i][1]).shootTheme((String) data[i][2])
                    .status((String) data[i][3]).maxParticipants((Integer) data[i][4])
                    .description(data[i][0] + " — 함께 찍고 서로 피드백해요.")
                    .thumbnailUrl("https://picsum.photos/seed/gathering" + i + "/600/400")
                    .startDateTime(start).endDateTime(start.plusHours(3))
                    .recruitmentEndDateTime(start.minusDays(2))
                    .createdBy(host.getId())
                    .createdAt(start.minusDays(14))
                    .build());
            int joined = Math.min((Integer) data[i][4], 3 + i);
            for (int j = 0; j < joined; j++) {
                gatheringParticipantRepository.save(GatheringParticipant.builder()
                        .gatheringId(g.getId()).memberId(users.get((i + j) % users.size()).getId())
                        .status(j == joined - 1 && i % 2 == 0 ? "WAITING" : "PARTICIPATING").build());
            }
            if (!"ENDED".equals(data[i][3]) && !"ONGOING".equals(data[i][3])) continue;
            for (int k = 0; k < postBodies.length; k++) {
                Member writer = users.get((i + k) % users.size());
                GatheringPost post = gatheringPostRepository.save(GatheringPost.builder()
                        .gatheringId(g.getId()).memberId(writer.getId()).memberName(writer.getName())
                        .content(postBodies[k]).hashtags(k == 0 ? "#출사 #모임" : null)
                        .createdAt(start.plusHours(4 + k))
                        .build());
                for (int n = 0; n < (k % 3); n++) {
                    gatheringPhotoRepository.save(GatheringPhoto.builder()
                            .gatheringPostId(post.getId()).sortOrder(n)
                            .imageUrl("https://picsum.photos/seed/gpost" + post.getId() + "_" + n + "/400/400").build());
                }
                for (int n = 0; n < k + 1; n++) {
                    gatheringPostLikeRepository.save(GatheringPostLike.builder()
                            .gatheringPostId(post.getId()).memberId(users.get(n).getId()).build());
                }
                if (k % 2 == 0) {
                    gatheringPostCommentRepository.save(GatheringPostComment.builder()
                            .gatheringPostId(post.getId()).memberId(users.get(k).getId()).build());
                }
            }
        }
    }

    private Member save(Member m) {
        m.setCreatedAt(LocalDateTime.now().minusDays((long)(Math.random() * 90)));
        m.setUpdatedAt(LocalDateTime.now());
        return memberRepository.save(m);
    }

    private void seedCategories() {
        // Level 1: 촬영 종류
        Object[][] l1 = {{"00","미분류","UNCLASSIFIED"},{"01","웨딩","WEDDING"},{"02","스냅","SNAP"},
            {"03","가족","FAMILY"},{"04","졸업","GRADUATION"},{"05","바디프로필","BODY"},
            {"06","제품","PRODUCT"},{"07","자연·풍경","NATURE"},{"08","건축·공간","ARCH"},
            {"09","반려동물","PET"},{"10","만삭·신생아","MATERNITY"},{"99","기타","ETC"}};
        for (int i = 0; i < l1.length; i++) {
            categoryRepository.save(PhotoCategory.builder().level(1).code((String)l1[i][0])
                .nameKo((String)l1[i][1]).nameEn((String)l1[i][2]).sortOrder(i).build());
        }
        // Level 2: 촬영 환경
        Object[][] l2 = {{"00","미분류","UNCLASSIFIED"},{"01","야외","OUTDOOR"},{"02","스튜디오","STUDIO"},
            {"03","실내 장소","INDOOR"},{"04","해외","OVERSEAS"},{"05","혼합","MIXED"}};
        for (int i = 0; i < l2.length; i++) {
            categoryRepository.save(PhotoCategory.builder().level(2).code((String)l2[i][0])
                .nameKo((String)l2[i][1]).nameEn((String)l2[i][2]).sortOrder(i).build());
        }
        // Level 3: 색채 무드
        Object[][] l3 = {{"00","미분류","UNCLASSIFIED"},{"01","웜","WARM"},{"02","쿨","COOL"},
            {"03","뉴트럴","NEUTRAL"},{"04","비비드","VIVID"},{"05","다크","DARK"},
            {"06","소프트","SOFT"},{"07","흑백","MONO"},{"08","필름","FILM"}};
        for (int i = 0; i < l3.length; i++) {
            categoryRepository.save(PhotoCategory.builder().level(3).code((String)l3[i][0])
                .nameKo((String)l3[i][1]).nameEn((String)l3[i][2]).sortOrder(i).build());
        }
        // Level 4: 스타일/분위기
        Object[][] l4 = {{"00","미분류","UNCLASSIFIED"},{"01","자연스러운","NATURAL"},{"02","로맨틱","ROMANTIC"},
            {"03","빈티지","VINTAGE"},{"04","모던","MODERN"},{"05","무드/다크","MOODY"},
            {"06","밝고화사","BRIGHT"},{"07","감성/아트","ARTISTIC"},{"08","유머/위트","HUMOR"}};
        for (int i = 0; i < l4.length; i++) {
            categoryRepository.save(PhotoCategory.builder().level(4).code((String)l4[i][0])
                .nameKo((String)l4[i][1]).nameEn((String)l4[i][2]).sortOrder(i).build());
        }
        // Level 5: 세부 속성
        Object[][] l5 = {{"00","미분류","UNCLASSIFIED"},{"01","인물 중심","PORTRAIT"},{"02","배경 중심","BACKGROUND"},
            {"03","오브제 포함","OBJECT"},{"04","커플/2인","COUPLE"},{"05","그룹/단체","GROUP"},
            {"06","흑백 후처리","BW_POST"},{"07","드론/항공","DRONE"},{"08","접사/디테일","CLOSEUP"},
            {"09","야간/인공조명","NIGHT"},{"10","움직임 포착","MOTION"}};
        for (int i = 0; i < l5.length; i++) {
            categoryRepository.save(PhotoCategory.builder().level(5).code((String)l5[i][0])
                .nameKo((String)l5[i][1]).nameEn((String)l5[i][2]).sortOrder(i).build());
        }
    }

    private void seedPortfolios(List<Photo> photos, List<Member> users, Member wm, Member sa) {
        // Portfolio 1: APPROVED + PUBLIC
        Portfolio p1 = Portfolio.builder()
            .member(wm).title("웨딩 스타일 모음").subtitle("2026년 봄/여름 웨딩 작품집")
            .coverImageUrl("https://picsum.photos/seed/pf1/600/400")
            .categoryCode("0101010101").tags("#웨딩 #야외 #봄 #내추럴")
            .status(PortfolioStatus.APPROVED).visibility(PortfolioVisibility.PUBLIC)
            .viewCount(1240).likesCount(234).pinned(true)
            .build();
        p1.getItems().add(PortfolioItem.builder().portfolio(p1).itemType("PHOTO")
            .photo(photos.get(0)).displayOrder(0).featured(true).build());
        p1.getItems().add(PortfolioItem.builder().portfolio(p1).itemType("PHOTO")
            .photo(photos.get(2)).displayOrder(1).build());
        p1.getItems().add(PortfolioItem.builder().portfolio(p1).itemType("PHOTO")
            .photo(photos.get(4)).displayOrder(2).build());
        portfolioRepository.save(p1);

        // Portfolio 2: PENDING (검수 대기)
        Portfolio p2 = Portfolio.builder()
            .member(users.get(0)).title("2026 스프링 컬렉션").subtitle("봄날의 스냅 포트폴리오")
            .coverImageUrl("https://picsum.photos/seed/pf2/600/400")
            .categoryCode("0201010302").tags("#스냅 #야외 #뉴트럴")
            .status(PortfolioStatus.PENDING).visibility(PortfolioVisibility.PRIVATE)
            .viewCount(0).likesCount(0).build();
        p2.getItems().add(PortfolioItem.builder().portfolio(p2).itemType("PHOTO")
            .photo(photos.get(1)).displayOrder(0).featured(true).build());
        p2.getItems().add(PortfolioItem.builder().portfolio(p2).itemType("PHOTO")
            .photo(photos.get(3)).displayOrder(1).build());
        portfolioRepository.save(p2);

        // Portfolio 3: PENDING (검수 대기 2)
        Portfolio p3 = Portfolio.builder()
            .member(users.get(1)).title("가을 감성 모음").subtitle("깊어가는 계절의 기록")
            .coverImageUrl("https://picsum.photos/seed/pf3/600/400")
            .categoryCode("0201030501").tags("#스냅 #뉴트럴 #다크")
            .status(PortfolioStatus.PENDING).visibility(PortfolioVisibility.PRIVATE)
            .viewCount(0).likesCount(0).build();
        p3.getItems().add(PortfolioItem.builder().portfolio(p3).itemType("PHOTO")
            .photo(photos.get(5)).displayOrder(0).featured(true).build());
        portfolioRepository.save(p3);

        // Portfolio 4: APPROVED + PUBLIC
        Portfolio p4 = Portfolio.builder()
            .member(sa).title("도시 스케치").subtitle("도시 일상의 순간들")
            .coverImageUrl("https://picsum.photos/seed/pf4/600/400")
            .categoryCode("0201030401").tags("#스냅 #야외 #뉴트럴 #모던")
            .status(PortfolioStatus.APPROVED).visibility(PortfolioVisibility.PUBLIC)
            .viewCount(890).likesCount(156).build();
        p4.getItems().add(PortfolioItem.builder().portfolio(p4).itemType("PHOTO")
            .photo(photos.get(6)).displayOrder(0).featured(true).build());
        p4.getItems().add(PortfolioItem.builder().portfolio(p4).itemType("PHOTO")
            .photo(photos.get(8)).displayOrder(1).build());
        portfolioRepository.save(p4);

        // Portfolio 5: REJECTED
        Portfolio p5 = Portfolio.builder()
            .member(users.get(2)).title("빛의 탐구").subtitle("빛과 그림자의 실험")
            .coverImageUrl("https://picsum.photos/seed/pf5/600/400")
            .categoryCode("0701050501").tags("#자연풍경 #다크 #무드")
            .status(PortfolioStatus.REJECTED)
            .adminNote("사진 해상도가 기준에 미달합니다. 재업로드 후 재신청해 주세요.")
            .visibility(PortfolioVisibility.PRIVATE)
            .viewCount(0).likesCount(0).build();
        p5.getItems().add(PortfolioItem.builder().portfolio(p5).itemType("PHOTO")
            .photo(photos.get(9)).displayOrder(0).featured(true).build());
        portfolioRepository.save(p5);

        // Portfolio 6: DRAFT
        Portfolio p6 = Portfolio.builder()
            .member(users.get(3)).title("인물 연작 (초안)").subtitle("사람의 표정을 담다")
            .coverImageUrl("https://picsum.photos/seed/pf6/600/400")
            .categoryCode("0201010101").tags("#스냅 #인물")
            .status(PortfolioStatus.DRAFT).visibility(PortfolioVisibility.PRIVATE)
            .viewCount(0).likesCount(0).build();
        portfolioRepository.save(p6);
    }
}
