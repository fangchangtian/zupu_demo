package org.example.zupu_demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.zupu_demo.entity.Family;

public interface FamilyService extends IService<Family> {
    /** 创建家族（同时将自己设为全局管理员） */
    Family createFamily(String name, String surname, Long createdBy, String description);
}
