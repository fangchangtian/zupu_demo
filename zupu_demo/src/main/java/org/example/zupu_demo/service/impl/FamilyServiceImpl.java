package org.example.zupu_demo.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.zupu_demo.entity.Family;
import org.example.zupu_demo.entity.FamilyUserRole;
import org.example.zupu_demo.mapper.FamilyMapper;
import org.example.zupu_demo.mapper.FamilyUserRoleMapper;
import org.example.zupu_demo.service.FamilyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FamilyServiceImpl extends ServiceImpl<FamilyMapper, Family> implements FamilyService {

    private final FamilyUserRoleMapper roleMapper;

    public FamilyServiceImpl(FamilyUserRoleMapper roleMapper) {
        this.roleMapper = roleMapper;
    }

    @Override
    @Transactional
    public Family createFamily(String name, String surname, Long createdBy, String description) {
        Family family = new Family();
        family.setName(name);
        family.setSurname(surname);
        family.setDescription(description);
        family.setCreatedBy(createdBy);
        save(family);

        // 创建者自动成为全局管理员
        FamilyUserRole role = new FamilyUserRole();
        role.setFamilyId(family.getId());
        role.setUserId(createdBy);
        role.setRole("global_admin");
        roleMapper.insert(role);

        return family;
    }
}
