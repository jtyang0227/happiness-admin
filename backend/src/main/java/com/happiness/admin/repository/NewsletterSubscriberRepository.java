package com.happiness.admin.repository;

import com.happiness.admin.entity.NewsletterSubscriber;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Long> {

    @Query("SELECT s FROM NewsletterSubscriber s WHERE " +
           "(:active IS NULL OR (:active = true AND s.unsubscribedAt IS NULL) OR (:active = false AND s.unsubscribedAt IS NOT NULL)) AND " +
           "(:search IS NULL OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<NewsletterSubscriber> search(@Param("active") Boolean active, @Param("search") String search, Pageable pageable);

    long countByUnsubscribedAtIsNull();

    long countByUnsubscribedAtIsNotNull();

    long countBySubscribedAtGreaterThanEqualAndUnsubscribedAtIsNull(LocalDateTime since);

    long countByUnsubscribedAtGreaterThanEqual(LocalDateTime since);

    List<NewsletterSubscriber> findByUnsubscribedAtIsNullOrderBySubscribedAtAsc();
}
