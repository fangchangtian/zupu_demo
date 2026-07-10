package org.example.zupu_demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.zupu_demo.dto.CreateMemberRequest;
import org.example.zupu_demo.dto.CreateMemberResponse;
import org.example.zupu_demo.entity.FamilyMember;
import org.example.zupu_demo.entity.FamilyUserRole;
import org.example.zupu_demo.entity.User;
import org.example.zupu_demo.common.exception.BusinessException;
import org.example.zupu_demo.common.exception.ErrorCode;
import org.example.zupu_demo.mapper.FamilyMemberMapper;
import org.example.zupu_demo.mapper.FamilyUserRoleMapper;
import org.example.zupu_demo.mapper.UserMapper;
import org.example.zupu_demo.service.FamilyMemberService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class FamilyMemberServiceImpl extends ServiceImpl<FamilyMemberMapper, FamilyMember> implements FamilyMemberService {

    private final UserMapper userMapper;
    private final FamilyUserRoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;

    public FamilyMemberServiceImpl(UserMapper userMapper, FamilyUserRoleMapper roleMapper,
                                   PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.passwordEncoder = passwordEncoder;
    }

    // ---------- 族谱核心操作 ----------

    /**
     * 添加家族成员 → 自动创建用户账号 → 自动授予角色。
     *
     * 前端必须传入 initialPassword，管理员直接设定该成员的初始密码，
     * 不再需要生成随机密码 + 转交流程。
     */
    @Override
    @Transactional
    public CreateMemberResponse addMember(CreateMemberRequest req) {

        // ---- 1. 将请求 DTO 转为实体 ----
        FamilyMember member = new FamilyMember();
        member.setFamilyId(req.getFamilyId());
        member.setName(req.getName());
        member.setGenerationName(req.getGenerationName());
        member.setAlias(req.getAlias());
        member.setGender(req.getGender());
        member.setBirthDate(req.getBirthDate() != null ? LocalDate.parse(req.getBirthDate()) : null);
        member.setBirthPlace(req.getBirthPlace());
        member.setDeathDate(req.getDeathDate() != null ? LocalDate.parse(req.getDeathDate()) : null);
        member.setIsAlive(req.getIsAlive());
        member.setBiography(req.getBiography());
        member.setAvatarUrl(req.getAvatarUrl());
        member.setFatherId(req.getFatherId());
        member.setMotherId(req.getMotherId());
        member.setAdoptiveFatherId(req.getAdoptiveFatherId());
        member.setAdoptiveMotherId(req.getAdoptiveMotherId());
        member.setGenerationOrder(req.getGenerationOrder());
        member.setSortOrder(req.getSortOrder());
        member.setCreatedBy(req.getOperatorId());

        // ---- 2. 自动推算代数 ----
        if (member.getGenerationOrder() == null) {
            if (member.getFatherId() != null) {
                FamilyMember father = getById(member.getFatherId());
                if (father == null) throw new BusinessException(ErrorCode.PARENT_NOT_FOUND);
                if (!father.getFamilyId().equals(member.getFamilyId()))
                    throw new BusinessException(ErrorCode.FAMILY_MISMATCH, "父亲和子女必须在同一家族");
                member.setGenerationOrder(father.getGenerationOrder() + 1);
            } else {
                member.setGenerationOrder(1);
            }
        }

        // ---- 3. 校验母亲同族 ----
        if (member.getMotherId() != null) {
            FamilyMember mother = getById(member.getMotherId());
            if (mother != null && !mother.getFamilyId().equals(member.getFamilyId())) {
                throw new BusinessException(ErrorCode.FAMILY_MISMATCH, "母亲和子女必须在同一家族");
            }
        }

        // ---- 4. 保存成员 ----
        save(member);

        // ---- 5. 创建用户账号（使用前端传来的初始密码）----
        User user = new User();
        user.setUsername("m_" + member.getFamilyId() + "_" + member.getId());
        user.setRealName(member.getName());
        user.setPasswordHash(passwordEncoder.encode(req.getInitialPassword()));
        userMapper.insert(user);

        // ---- 6. 授予成员角色 ----
        FamilyUserRole role = new FamilyUserRole();
        role.setFamilyId(member.getFamilyId());
        role.setUserId(user.getId());
        role.setMemberId(member.getId());
        role.setRole("member");
        roleMapper.insert(role);

        // ---- 7. 返回响应 ----
        return CreateMemberResponse.ok(
                member.getId(),
                member.getName(),
                member.getGenerationOrder(),
                user.getUsername(),
                req.getInitialPassword(),
                user.getId(),
                "成员创建成功，账号已自动生成");
    }

    // ---------- 树形查询 ----------

    @Override
    public List<FamilyMember> getAncestors(Long memberId) {
        FamilyMember current = getById(memberId);
        if (current == null) return Collections.emptyList();

        List<FamilyMember> ancestors = new ArrayList<>();
        Long fatherId = current.getFatherId();
        while (fatherId != null) {
            FamilyMember father = getById(fatherId);
            if (father == null) break;
            ancestors.add(father);
            fatherId = father.getFatherId();
        }
        return ancestors;
    }

    private static final int MAX_DESCENDANT_DEPTH = 5;

    @Override
    public List<FamilyMember> getDescendants(Long memberId) {
        List<FamilyMember> result = new ArrayList<>();
        collectDescendants(memberId, result, 0);
        return result;
    }

    /** 递归收集后代，depth 从 0 开始，最多向下 {@value #MAX_DESCENDANT_DEPTH} 代 */
    private void collectDescendants(Long parentId, List<FamilyMember> collector, int depth) {
        if (depth >= MAX_DESCENDANT_DEPTH) return;

        List<FamilyMember> children = list(new LambdaQueryWrapper<FamilyMember>()
                .eq(FamilyMember::getFatherId, parentId)
                .or()
                .eq(FamilyMember::getMotherId, parentId));
        for (FamilyMember child : children) {
            collector.add(child);
            collectDescendants(child.getId(), collector, depth + 1);
        }
    }

    @Override
    public List<FamilyMember> getSiblings(Long memberId) {
        FamilyMember member = getById(memberId);
        if (member == null || member.getFatherId() == null) return Collections.emptyList();

        return list(new LambdaQueryWrapper<FamilyMember>()
                .eq(FamilyMember::getFatherId, member.getFatherId())
                .ne(FamilyMember::getId, memberId)
                .orderByAsc(FamilyMember::getSortOrder));
    }

    // ---------- 关系计算 ----------

    @Override
    public String calculateRelationship(Long memberAId, Long memberBId) {
        FamilyMember a = getById(memberAId);
        FamilyMember b = getById(memberBId);
        if (a == null || b == null) return "未知";
        if (!a.getFamilyId().equals(b.getFamilyId())) return "非同族";

        if (a.getId().equals(b.getId())) return "本人";

        List<Long> aAncestors = new ArrayList<>();
        Long cur = a.getFatherId();
        while (cur != null) {
            aAncestors.add(cur);
            FamilyMember p = getById(cur);
            cur = p != null ? p.getFatherId() : null;
        }

        Long commonAncestor = null;
        int bDist = 0;
        cur = b.getFatherId();
        if (aAncestors.contains(b.getId())) return buildDirectRelation(a, b);
        if (cur != null) {
            FamilyMember fatherB = getById(cur);
            if (fatherB != null && aAncestors.contains(fatherB.getId())) return buildDirectRelation(a, b);
        }

        cur = b.getId();
        while (cur != null) {
            if (aAncestors.contains(cur)) {
                commonAncestor = cur;
                break;
            }
            bDist++;
            FamilyMember p = getById(cur);
            cur = p != null ? p.getFatherId() : null;
        }

        if (commonAncestor == null) return "同族远亲";

        int aDist = aAncestors.indexOf(commonAncestor) + 1;
        return buildCousinRelation(aDist, bDist);
    }

    private String buildDirectRelation(FamilyMember senior, FamilyMember junior) {
        int delta = senior.getGenerationOrder() - junior.getGenerationOrder();
        if (delta == 0) return "同辈";
        if (delta < 0) {
            delta = -delta;
            FamilyMember tmp = senior;
            senior = junior;
            junior = tmp;
        }
        if (delta == 1) {
            return "M".equals(junior.getGender()) ? "父亲" : "母亲";
        }
        if (delta == 2) return "祖父母";
        if (delta == 3) return "曾祖父母";
        return "上" + delta + "代直系长辈";
    }

    private String buildCousinRelation(int aDist, int bDist) {
        if (aDist == 1 && bDist == 1) return "兄弟姐妹";
        int min = Math.min(aDist, bDist);
        int diff = Math.abs(aDist - bDist);
        if (min == 1) {
            if (diff == 0) return "兄弟姐妹";
            return diff == 1 ? "叔伯/侄" : "叔伯/侄孙（差" + diff + "代）";
        }
        if (min == 2) {
            if (diff == 0) return "堂/表兄弟姐妹";
            return diff == 1 ? "堂/表叔伯（差1代）" : "堂/表远亲（差" + diff + "代）";
        }
        return "同族远亲（共同祖先是第" + min + "代）";
    }

}
