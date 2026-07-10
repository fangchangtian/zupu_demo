package org.example.zupu_demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.zupu_demo.entity.FamilyUserRole;

public interface FamilyUserRoleService extends IService<FamilyUserRole> {

    /** 检查用户是否是某家族的全局管理员 */
    boolean isGlobalAdmin(Long familyId, Long userId);

    /** 检查用户是否有权限编辑某成员（父节点可改子节点） */
    boolean canEditMember(Long familyId, Long userId, Long targetMemberId);

    /** 检查用户是否属于该家族（任意角色均可） */
    boolean belongsToFamily(Long familyId, Long userId);

    /** 获取用户所属的家族 ID（用户只能属于一个家族，多家族时抛出异常） */
    Long getFamilyIdByUserId(Long userId);
}
