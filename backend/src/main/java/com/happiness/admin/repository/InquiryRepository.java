package com.happiness.admin.repository;

import com.happiness.admin.entity.Inquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    @Query("SELECT i FROM Inquiry i WHERE " +
           "(:receiverId IS NULL OR i.receiver.id = :receiverId) AND " +
           "(:senderId IS NULL OR i.sender.id = :senderId) AND " +
           "(:isRead IS NULL OR i.isRead = :isRead) AND " +
           "(:shootType IS NULL OR i.shootType = :shootType)")
    Page<Inquiry> searchInquiries(@Param("receiverId") Long receiverId,
                                  @Param("senderId") Long senderId,
                                  @Param("isRead") Boolean isRead,
                                  @Param("shootType") String shootType,
                                  Pageable pageable);

    long countByIsReadFalse();
    List<Inquiry> findAllByIsReadFalse();

    @Query("SELECT COUNT(i) FROM Inquiry i WHERE i.createdAt >= :today AND i.createdAt < :tomorrow")
    long countToday(@Param("today") LocalDateTime today,
                    @Param("tomorrow") LocalDateTime tomorrow);

    @Query("SELECT COUNT(i) FROM Inquiry i WHERE i.createdAt >= :since")
    long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT cast(i.createdAt as LocalDate) as day, COUNT(i) as cnt FROM Inquiry i " +
           "WHERE i.createdAt >= :since GROUP BY cast(i.createdAt as LocalDate) ORDER BY day")
    List<Object[]> dailyInquiries(@Param("since") LocalDateTime since);

    @Query("SELECT i.shootType, COUNT(i) FROM Inquiry i WHERE i.shootType IS NOT NULL GROUP BY i.shootType ORDER BY COUNT(i) DESC")
    List<Object[]> shootTypeDistribution();

    long countBySenderId(Long senderId);

    void deleteBySenderId(Long senderId);
    void deleteByReceiverId(Long receiverId);
}
