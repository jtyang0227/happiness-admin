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

@Component
@Profile("!prod")
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final MemberRepository memberRepository;
    private final PhotoRepository photoRepository;
    private final InquiryRepository inquiryRepository;
    private final SeriesRepository seriesRepository;
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
    }

    private Member save(Member m) {
        m.setCreatedAt(LocalDateTime.now().minusDays((long)(Math.random() * 90)));
        m.setUpdatedAt(LocalDateTime.now());
        return memberRepository.save(m);
    }
}
