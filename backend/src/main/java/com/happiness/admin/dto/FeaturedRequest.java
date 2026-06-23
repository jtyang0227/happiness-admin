package com.happiness.admin.dto;

import java.time.LocalDate;
import java.util.List;

public record FeaturedRequest(Long photoId, LocalDate startsAt, LocalDate endsAt, List<Long> orderedIds) {}
