package com.happiness.admin.repository;

import com.happiness.admin.entity.Content;
import com.happiness.admin.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {
    List<Content> findByMember(Member member);
    List<Content> findByTitleContainingIgnoreCase(String title);
}
