package org.example.zupu_demo.controller;

import jakarta.validation.Valid;
import org.example.zupu_demo.common.result.ApiResponse;
import org.example.zupu_demo.common.exception.BusinessException;
import org.example.zupu_demo.common.exception.ErrorCode;
import org.example.zupu_demo.dto.CreateMemberRequest;
import org.example.zupu_demo.dto.CreateMemberResponse;
import org.example.zupu_demo.entity.FamilyMember;
import org.example.zupu_demo.service.FamilyMemberService;
import org.example.zupu_demo.service.FamilyUserRoleService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
public class FamilyMemberController {

    private final FamilyMemberService memberService;
    private final FamilyUserRoleService roleService;

    public FamilyMemberController(FamilyMemberService memberService,
                                   FamilyUserRoleService roleService) {
        this.memberService = memberService;
        this.roleService = roleService;
    }

    @GetMapping("/{id}")
    public ApiResponse<FamilyMember> getById(@PathVariable Long id) {
        return ApiResponse.ok(memberService.getById(id));
    }

    @GetMapping
    public ApiResponse<List<FamilyMember>> listByFamily(@RequestParam Long familyId) {
        return ApiResponse.ok(memberService.lambdaQuery()
                .eq(FamilyMember::getFamilyId, familyId)
                .orderByAsc(FamilyMember::getGenerationOrder)
                .orderByAsc(FamilyMember::getSortOrder)
                .list());
    }

    @GetMapping("/generation")
    public ApiResponse<List<FamilyMember>> listByGeneration(@RequestParam Long familyId,
                                                            @RequestParam Integer generationOrder) {
        return ApiResponse.ok(memberService.lambdaQuery()
                .eq(FamilyMember::getFamilyId, familyId)
                .eq(FamilyMember::getGenerationOrder, generationOrder)
                .orderByAsc(FamilyMember::getSortOrder)
                .list());
    }

    @GetMapping("/children")
    public ApiResponse<List<FamilyMember>> getChildren(@RequestParam Long parentId,
                                                        @RequestParam(defaultValue = "father") String parentType) {
        if ("mother".equalsIgnoreCase(parentType)) {
            return ApiResponse.ok(memberService.lambdaQuery()
                    .eq(FamilyMember::getMotherId, parentId).list());
        }
        return ApiResponse.ok(memberService.lambdaQuery()
                .eq(FamilyMember::getFatherId, parentId).list());
    }

    @GetMapping("/ancestors")
    public ApiResponse<List<FamilyMember>> getAncestors(@RequestParam Long memberId) {
        return ApiResponse.ok(memberService.getAncestors(memberId));
    }

    @GetMapping("/descendants")
    public ApiResponse<List<FamilyMember>> getDescendants(@RequestParam Long memberId) {
        return ApiResponse.ok(memberService.getDescendants(memberId));
    }

    @GetMapping("/siblings")
    public ApiResponse<List<FamilyMember>> getSiblings(@RequestParam Long memberId) {
        return ApiResponse.ok(memberService.getSiblings(memberId));
    }

    @GetMapping("/relationship")
    public ApiResponse<String> getRelationship(@RequestParam Long aId,
                                                @RequestParam Long bId) {
        return ApiResponse.ok(memberService.calculateRelationship(aId, bId));
    }

    @PostMapping
    public ApiResponse<CreateMemberResponse> create(@Valid @RequestBody CreateMemberRequest request) {
        Long currentUserId = getCurrentUserId();

        // familyId 由后端从当前用户所属家族自动推导，无需前端传入
        Long familyId = roleService.getFamilyIdByUserId(currentUserId);
        request.setFamilyId(familyId);
        request.setOperatorId(currentUserId);

        return ApiResponse.ok("成员创建成功", memberService.addMember(request));
    }

    @PutMapping
    public ApiResponse<Void> update(@Valid @RequestBody FamilyMember member) {
        Long currentUserId = getCurrentUserId();

        // 查数据库中的真实记录，防止前端篡改 familyId
        FamilyMember existing = memberService.getById(member.getId());
        if (existing == null) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        if (!roleService.belongsToFamily(existing.getFamilyId(), currentUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        memberService.updateById(member);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        Long currentUserId = getCurrentUserId();

        FamilyMember existing = memberService.getById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        if (!roleService.belongsToFamily(existing.getFamilyId(), currentUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        memberService.removeById(id);
        return ApiResponse.ok();
    }

    /** 从 SecurityContextHolder 获取当前登录用户 ID */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return (Long) auth.getPrincipal();
    }
}
