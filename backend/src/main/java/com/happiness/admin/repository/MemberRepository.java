package com.happiness.admin.repository;

import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.MemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByEmail(String email);
    Optional<Member> findByProviderAndProviderId(String provider, String providerId);
    boolean existsByEmail(String email);

    @Query("SELECT m FROM Member m WHERE " +
           "(:search IS NULL OR m.name LIKE %:search% OR m.email LIKE %:search%) AND " +
           "(:authority IS NULL OR m.authority = :authority) AND " +
           "(:status IS NULL OR m.status = :status)")
    Page<Member> searchMembers(@Param("search") String search,
                               @Param("authority") Authority authority,
                               @Param("status") MemberStatus status,
                               Pageable pageable);

    @Query("SELECT COUNT(m) FROM Member m WHERE m.createdAt >= :since")
    long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT cast(m.createdAt as LocalDate) as day, COUNT(m) as cnt FROM Member m " +
           "WHERE m.createdAt >= :since GROUP BY cast(m.createdAt as LocalDate) ORDER BY day")
    java.util.List<Object[]> dailySignups(@Param("since") LocalDateTime since);
}
