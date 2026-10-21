package com.happiness.admin.repository;

import com.happiness.admin.entity.AdminMemberNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminMemberNoteRepository extends JpaRepository<AdminMemberNote, Long> {

    List<AdminMemberNote> findByMemberIdOrderByCreatedAtDescIdDesc(Long memberId);

    @Modifying
    @Query("DELETE FROM AdminMemberNote n WHERE n.memberId = :memberId")
    int deleteByMemberId(@Param("memberId") Long memberId);
}
