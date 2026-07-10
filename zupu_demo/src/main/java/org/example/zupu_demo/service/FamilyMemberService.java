package org.example.zupu_demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.zupu_demo.dto.CreateMemberRequest;
import org.example.zupu_demo.dto.CreateMemberResponse;
import org.example.zupu_demo.entity.FamilyMember;

import java.util.List;

public interface FamilyMemberService extends IService<FamilyMember> {

    /** 添加成员 → 自动创建用户 → 自动授权，返回含账号信息的响应 */
    CreateMemberResponse addMember(CreateMemberRequest request);

    /** 查询某成员的所有祖先（向上递归） */
    List<FamilyMember> getAncestors(Long memberId);

    /** 查询某成员的后代（向下递归，最多 5 代） */
    List<FamilyMember> getDescendants(Long memberId);

    /** 查询某成员的同辈兄弟姐妹 */
    List<FamilyMember> getSiblings(Long memberId);

    /** 计算两个成员之间的亲戚关系称呼 */
    String calculateRelationship(Long memberAId, Long memberBId);
}
