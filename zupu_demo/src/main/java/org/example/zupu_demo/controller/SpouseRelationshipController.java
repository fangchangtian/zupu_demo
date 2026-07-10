package org.example.zupu_demo.controller;

import jakarta.validation.Valid;
import org.example.zupu_demo.common.result.ApiResponse;
import org.example.zupu_demo.entity.SpouseRelationship;
import org.example.zupu_demo.service.SpouseRelationshipService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spouses")
public class SpouseRelationshipController {

    private final SpouseRelationshipService spouseService;

    public SpouseRelationshipController(SpouseRelationshipService spouseService) {
        this.spouseService = spouseService;
    }

    @GetMapping
    public ApiResponse<List<SpouseRelationship>> listByFamily(@RequestParam Long familyId) {
        return ApiResponse.ok(spouseService.lambdaQuery()
                .eq(SpouseRelationship::getFamilyId, familyId).list());
    }

    @GetMapping("/of")
    public ApiResponse<List<SpouseRelationship>> listByPerson(@RequestParam Long memberId) {
        return ApiResponse.ok(spouseService.lambdaQuery()
                .and(w -> w.eq(SpouseRelationship::getHusbandId, memberId)
                           .or()
                           .eq(SpouseRelationship::getWifeId, memberId))
                .list());
    }

    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody SpouseRelationship spouse) {
        spouseService.save(spouse);
        return ApiResponse.ok();
    }

    @PutMapping
    public ApiResponse<Void> update(@Valid @RequestBody SpouseRelationship spouse) {
        spouseService.updateById(spouse);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        spouseService.removeById(id);
        return ApiResponse.ok();
    }
}
