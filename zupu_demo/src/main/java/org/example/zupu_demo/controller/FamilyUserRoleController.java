package org.example.zupu_demo.controller;

import jakarta.validation.Valid;
import org.example.zupu_demo.common.result.ApiResponse;
import org.example.zupu_demo.entity.FamilyUserRole;
import org.example.zupu_demo.service.FamilyUserRoleService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
public class FamilyUserRoleController {

    private final FamilyUserRoleService roleService;

    public FamilyUserRoleController(FamilyUserRoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public ApiResponse<List<FamilyUserRole>> listByFamily(@RequestParam Long familyId) {
        return ApiResponse.ok(roleService.lambdaQuery()
                .eq(FamilyUserRole::getFamilyId, familyId).list());
    }

    @GetMapping("/check")
    public ApiResponse<Map<String, String>> checkPermission(@RequestParam Long familyId,
                                                            @RequestParam Long userId,
                                                            @RequestParam(required = false) Long targetMemberId) {
        Map<String, String> info = new HashMap<>();
        if (roleService.isGlobalAdmin(familyId, userId)) {
            info.put("role", "global_admin");
            info.put("description", "全局管理员 — 可编辑整棵族谱树");
            return ApiResponse.ok(info);
        }
        if (targetMemberId != null && roleService.canEditMember(familyId, userId, targetMemberId)) {
            info.put("role", "parent");
            info.put("description", "父节点 — 可编辑其直系子女");
            return ApiResponse.ok(info);
        }
        info.put("role", "member");
        info.put("description", "普通成员 — 只读");
        return ApiResponse.ok(info);
    }

    @PostMapping
    public ApiResponse<Void> grant(@Valid @RequestBody FamilyUserRole role) {
        roleService.save(role);
        return ApiResponse.ok();
    }

    @PutMapping
    public ApiResponse<Void> update(@Valid @RequestBody FamilyUserRole role) {
        roleService.updateById(role);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> revoke(@PathVariable Long id) {
        roleService.removeById(id);
        return ApiResponse.ok();
    }
}
