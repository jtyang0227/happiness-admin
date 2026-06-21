package com.happiness.admin;

import com.happiness.admin.entity.*;
import com.happiness.admin.repository.*;
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
                    .isRead(i % 3 == 0).createdAt(inqTime)
                    .build());
        }

        String[] seriesTitles = {"봄날의 기록","도시 스케치","자연의 숨결","인물 연작","빛의 탐구","계절의 변화","일상의 틈새","추억 모음"};
        for (int i = 0; i < 8; i++) {
            Member author = i < 3 ? wm : users.get(i % users.size());
            Series series = Series.builder()
                    .title(seriesTitles[i]).description(seriesTitles[i] + " 시리즈입니다.")
                    .coverImageUrl("https://picsum.photos/seed/series" + i + "/600/400")
                    .member(author).build();
            series.getSeriesPhotos().add(SeriesPhoto.builder()
                    .series(series).photo(photos.get(i * 3 % photos.size())).displayOrder(0).build());
            series.getSeriesPhotos().add(SeriesPhoto.builder()
                    .series(series).photo(photos.get((i * 3 + 1) % photos.size())).displayOrder(1).build());
            seriesRepository.save(series);
        }

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
    }

    private Member save(Member m) {
        m.setCreatedAt(LocalDateTime.now().minusDays((long)(Math.random() * 90)));
        m.setUpdatedAt(LocalDateTime.now());
        return memberRepository.save(m);
    }
}
