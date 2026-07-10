package org.example.zupu_demo.controller;

import jakarta.validation.Valid;
import org.example.zupu_demo.common.result.ApiResponse;
import org.example.zupu_demo.entity.Family;
import org.example.zupu_demo.service.FamilyService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families")
public class FamilyController {

    private final FamilyService familyService;

    public FamilyController(FamilyService familyService) {
        this.familyService = familyService;
    }

    @GetMapping
    public ApiResponse<List<Family>> list() {
        return ApiResponse.ok(familyService.list());
    }

    @GetMapping("/{id}")
    public ApiResponse<Family> getById(@PathVariable Long id) {
        return ApiResponse.ok(familyService.getById(id));
    }

    @PostMapping
    public ApiResponse<Family> create(@RequestParam String name,
                                       @RequestParam String surname,
                                       @RequestParam(required = false) String description) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long currentUserId = (Long) auth.getPrincipal();
        Family family = familyService.createFamily(name, surname, currentUserId, description);
        return ApiResponse.ok("家族创建成功", family);
    }

    @PutMapping
    public ApiResponse<Void> update(@Valid @RequestBody Family family) {
        familyService.updateById(family);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        familyService.removeById(id);
        return ApiResponse.ok();
    }
}
