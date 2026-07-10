package org.example.zupu_demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateMemberRequest {

    /** 由后端从当前用户所属家族自动推导，无需前端传入 */
    private Long familyId;

    @NotBlank(message = "姓名不能为空")
    private String name;

    private String generationName;
    private String alias;

    @Pattern(regexp = "[MF]", message = "性别只能是 M（男）或 F（女）")
    private String gender;

    private String birthDate;
    private String birthPlace;
    private String deathDate;
    private Integer isAlive;
    private String biography;
    private String avatarUrl;

    // ---------- 族谱位置 ----------
    private Long fatherId;
    private Long motherId;
    private Long adoptiveFatherId;
    private Long adoptiveMotherId;
    private Integer generationOrder;
    private Integer sortOrder;

    // ---------- 初始密码 ----------
    @NotBlank(message = "初始密码不能为空")
    private String initialPassword;

    /** 由后端自动从当前登录用户获取，无需前端传入 */
    private Long operatorId;
}
