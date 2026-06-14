package com.competition.controller;

import com.competition.common.Result;
import com.competition.entity.CompetitionCategory;
import com.competition.mapper.CompetitionCategoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 竞赛分类接口
 */
@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
public class CategoryController {

    private final CompetitionCategoryMapper categoryMapper;

    /**
     * 获取所有分类
     */
    @GetMapping("/list")
    public Result<List<CompetitionCategory>> list() {
        return Result.ok(categoryMapper.selectAllActive());
    }

    /**
     * 创建分类（管理员）
     */
    @PostMapping
    public Result<CompetitionCategory> create(@RequestBody CompetitionCategory category) {
        categoryMapper.insert(category);
        return Result.ok(category, "创建成功");
    }

    /**
     * 更新分类（管理员）
     */
    @PutMapping("/{id}")
    public Result<CompetitionCategory> update(@PathVariable Integer id, @RequestBody CompetitionCategory category) {
        category.setId(id);
        categoryMapper.updateById(category);
        return Result.ok(category, "更新成功");
    }

    /**
     * 删除分类（管理员）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Integer id) {
        categoryMapper.deleteById(id);
        return Result.ok(null, "删除成功");
    }
}
