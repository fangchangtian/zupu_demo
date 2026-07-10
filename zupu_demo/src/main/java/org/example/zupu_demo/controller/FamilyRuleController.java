package org.example.zupu_demo.controller;

import jakarta.validation.Valid;
import org.example.zupu_demo.common.result.ApiResponse;
import org.example.zupu_demo.entity.FamilyRule;
import org.example.zupu_demo.service.FamilyRuleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rules")
public class FamilyRuleController {

    private final FamilyRuleService ruleService;

    public FamilyRuleController(FamilyRuleService ruleService) {
        this.ruleService = ruleService;
    }

    @GetMapping
    public ApiResponse<List<FamilyRule>> listByFamily(@RequestParam Long familyId) {
        return ApiResponse.ok(ruleService.lambdaQuery()
                .eq(FamilyRule::getFamilyId, familyId)
                .orderByDesc(FamilyRule::getIsPinned)
                .orderByAsc(FamilyRule::getSortOrder)
                .list());
    }

    @GetMapping("/{id}")
    public ApiResponse<FamilyRule> getById(@PathVariable Long id) {
        return ApiResponse.ok(ruleService.getById(id));
    }

    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody FamilyRule rule) {
        ruleService.save(rule);
        return ApiResponse.ok();
    }

    @PutMapping
    public ApiResponse<Void> update(@Valid @RequestBody FamilyRule rule) {
        ruleService.updateById(rule);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        ruleService.removeById(id);
        return ApiResponse.ok();
    }
}
