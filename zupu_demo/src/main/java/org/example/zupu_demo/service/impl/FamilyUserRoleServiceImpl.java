package org.example.zupu_demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.zupu_demo.common.exception.BusinessException;
import org.example.zupu_demo.common.exception.ErrorCode;
import org.example.zupu_demo.entity.FamilyMember;
import org.example.zupu_demo.entity.FamilyUserRole;
import org.example.zupu_demo.mapper.FamilyMemberMapper;
import org.example.zupu_demo.mapper.FamilyUserRoleMapper;
import org.example.zupu_demo.service.FamilyUserRoleService;
import org.springframework.stereotype.Service;

@Service
public class FamilyUserRoleServiceImpl extends ServiceImpl<FamilyUserRoleMapper, FamilyUserRole> implements FamilyUserRoleService {

    private final FamilyMemberMapper memberMapper;

    public FamilyUserRoleServiceImpl(FamilyMemberMapper memberMapper) {
        this.memberMapper = memberMapper;
    }

    @Override
    public boolean isGlobalAdmin(Long familyId, Long userId) {
        return count(new LambdaQueryWrapper<FamilyUserRole>()
                .eq(FamilyUserRole::getFamilyId, familyId)
                .eq(FamilyUserRole::getUserId, userId)
                .eq(FamilyUserRole::getRole, "global_admin")) > 0;
    }

    @Override
    public boolean canEditMember(Long familyId, Long userId, Long targetMemberId) {
        // 1. 全局管理员
        if (isGlobalAdmin(familyId, userId)) return true;

        // 2. 父节点可修改子节点：查该用户对应的 member，看是不是 target 的 father/mother
        FamilyUserRole role = getOne(new LambdaQueryWrapper<FamilyUserRole>()
                .eq(FamilyUserRole::getFamilyId, familyId)
                .eq(FamilyUserRole::getUserId, userId));
        if (role == null || role.getMemberId() == null) return false;

        FamilyMember target = memberMapper.selectById(targetMemberId);
        if (target == null) return false;

        return role.getMemberId().equals(target.getFatherId())
                || role.getMemberId().equals(target.getMotherId());
    }

    @Override
    public boolean belongsToFamily(Long familyId, Long userId) {
        return count(new LambdaQueryWrapper<FamilyUserRole>()
                .eq(FamilyUserRole::getFamilyId, familyId)
                .eq(FamilyUserRole::getUserId, userId)) > 0;
    }

    @Override
    public Long getFamilyIdByUserId(Long userId) {
        return list(new LambdaQueryWrapper<FamilyUserRole>()
                .eq(FamilyUserRole::getUserId, userId))
                .stream()
                .map(FamilyUserRole::getFamilyId)
                .distinct()
                .reduce((a, b) -> {
                    throw new BusinessException(ErrorCode.FORBIDDEN, "当前用户属于多个家族，请指定家族 ID");
                })
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不属于任何家族"));
    }
}
