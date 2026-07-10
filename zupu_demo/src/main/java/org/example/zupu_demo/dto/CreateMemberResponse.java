package org.example.zupu_demo.dto;

import lombok.Data;

/**
 * 创建成员——后端响应体
 *
 * 除返回成员基本信息外，同时返回自动生成的账号信息，
 * 供管理员确认或转交。
 */
@Data
public class CreateMemberResponse {

    private Long memberId;
    private String memberName;
    private Integer generationOrder;

    // 自动生成的账号信息
    private String username;
    private String password;        // 即为前端传入的初始密码
    private Long userId;

    // 提示信息
    private String message;

    public static CreateMemberResponse ok(Long memberId, String memberName,
                                           Integer generationOrder,
                                           String username, String password,
                                           Long userId, String message) {
        CreateMemberResponse r = new CreateMemberResponse();
        r.setMemberId(memberId);
        r.setMemberName(memberName);
        r.setGenerationOrder(generationOrder);
        r.setUsername(username);
        r.setPassword(password);
        r.setUserId(userId);
        r.setMessage(message);
        return r;
    }
}
