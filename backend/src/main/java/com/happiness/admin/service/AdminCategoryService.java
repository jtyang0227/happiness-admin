package com.happiness.admin.service;

import com.happiness.admin.dto.CategoryDto;
import com.happiness.admin.repository.PhotoCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCategoryService {
    private final PhotoCategoryRepository categoryRepository;

    public List<CategoryDto> getByLevel(int level) {
        return categoryRepository.findByLevelAndActiveOrderBySortOrder(level, true)
                .stream().map(CategoryDto::from).collect(Collectors.toList());
    }

    public Map<Integer, List<CategoryDto>> getAll() {
        return categoryRepository.findByActiveOrderByLevelAscSortOrderAsc(true)
                .stream().map(CategoryDto::from)
                .collect(Collectors.groupingBy(CategoryDto::getLevel));
    }
}
