package org.example.zupu_demo.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.zupu_demo.entity.OperationLog;
import org.example.zupu_demo.mapper.OperationLogMapper;
import org.example.zupu_demo.service.OperationLogService;
import org.springframework.stereotype.Service;

@Service
public class OperationLogServiceImpl extends ServiceImpl<OperationLogMapper, OperationLog> implements OperationLogService {

    @Override
    public void log(Long familyId, Long userId, Long targetMemberId, String action, String detail) {
        OperationLog log = new OperationLog();
        log.setFamilyId(familyId);
        log.setUserId(userId);
        log.setTargetMemberId(targetMemberId);
        log.setAction(action);
        log.setDetailJson(detail);
        save(log);
    }
}
