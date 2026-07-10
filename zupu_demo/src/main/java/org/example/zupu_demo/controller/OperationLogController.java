package org.example.zupu_demo.controller;

import org.example.zupu_demo.common.result.ApiResponse;
import org.example.zupu_demo.entity.OperationLog;
import org.example.zupu_demo.service.OperationLogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class OperationLogController {

    private final OperationLogService logService;

    public OperationLogController(OperationLogService logService) {
        this.logService = logService;
    }

    @GetMapping
    public ApiResponse<List<OperationLog>> listByFamily(@RequestParam Long familyId,
                                                         @RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.ok(logService.lambdaQuery()
                .eq(OperationLog::getFamilyId, familyId)
                .orderByDesc(OperationLog::getCreatedAt)
                .last("LIMIT " + limit)
                .list());
    }

    @GetMapping("/of-member")
    public ApiResponse<List<OperationLog>> listByMember(@RequestParam Long memberId) {
        return ApiResponse.ok(logService.lambdaQuery()
                .eq(OperationLog::getTargetMemberId, memberId)
                .orderByDesc(OperationLog::getCreatedAt)
                .list());
    }
}
