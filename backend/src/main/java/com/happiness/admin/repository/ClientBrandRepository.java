package com.happiness.admin.repository;

import com.happiness.admin.entity.ClientBrand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientBrandRepository extends JpaRepository<ClientBrand, Long> {

    @Query("SELECT x FROM ClientBrand x WHERE (:memberId IS NULL OR x.memberId = :memberId)")
    Page<ClientBrand> findByMember(@Param("memberId") Long memberId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM ClientBrand x WHERE x.memberId = :memberId")
    int deleteByMemberId(@Param("memberId") Long memberId);
}
