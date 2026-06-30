package com.happiness.admin.repository;

import com.happiness.admin.entity.Booking;
import com.happiness.admin.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.shootDate = :today AND b.status = 'CONFIRMED'")
    long countTodayConfirmed(@Param("today") LocalDate today);

    long countByStatus(BookingStatus status);

    @Query("""
        SELECT b FROM Booking b
        LEFT JOIN FETCH b.photographer
        LEFT JOIN FETCH b.client
        WHERE b.shootDate BETWEEN :from AND :to
        ORDER BY b.shootDate ASC, b.createdAt ASC
        """)
    List<Booking> findByShootDateBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT b.shootDate, COUNT(b)
        FROM Booking b
        WHERE YEAR(b.shootDate) = :year AND MONTH(b.shootDate) = :month
        GROUP BY b.shootDate
        ORDER BY b.shootDate ASC
        """)
    List<Object[]> countByDay(@Param("year") int year, @Param("month") int month);

    @Query("""
        SELECT b FROM Booking b
        LEFT JOIN FETCH b.photographer
        LEFT JOIN FETCH b.client
        WHERE b.shootDate = :date
        ORDER BY b.status ASC, b.createdAt ASC
        """)
    List<Booking> findByShootDate(@Param("date") LocalDate date);

    @Query("""
        SELECT b FROM Booking b
        LEFT JOIN FETCH b.photographer
        LEFT JOIN FETCH b.client
        WHERE (:status IS NULL OR b.status = :status)
          AND (:date IS NULL OR b.shootDate = :date)
        ORDER BY b.shootDate DESC, b.createdAt DESC
        """)
    Page<Booking> findWithFilters(
        @Param("date") LocalDate date,
        @Param("status") BookingStatus status,
        Pageable pageable
    );
}
