package com.happiness.admin.repository;

import com.happiness.admin.entity.GatheringParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GatheringParticipantRepository extends JpaRepository<GatheringParticipant, Long> {

    @Query("SELECT p.gatheringId, COUNT(p) FROM GatheringParticipant p " +
           "WHERE p.gatheringId IN :ids AND p.status = 'PARTICIPATING' GROUP BY p.gatheringId")
    List<Object[]> countParticipatingByGatheringIdIn(@Param("ids") List<Long> ids);
}
