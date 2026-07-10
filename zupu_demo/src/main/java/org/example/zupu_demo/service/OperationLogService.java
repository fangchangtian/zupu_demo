package org.example.zupu_demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.zupu_demo.entity.OperationLog;

public interface OperationLogService extends IService<OperationLog> {
    /** 记录操作 */
    void log(Long familyId, Long userId, Long targetMemberId, String action, String detail);
}
