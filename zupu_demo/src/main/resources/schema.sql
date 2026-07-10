-- ============================================
-- 电子族谱平台 — MySQL 数据库初始化脚本
-- 要求 MySQL 8.0+
-- ============================================

CREATE DATABASE IF NOT EXISTS family_tree
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE family_tree;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE users (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name     VARCHAR(100) COMMENT '真实姓名',
    phone         VARCHAR(20),
    avatar_url    VARCHAR(500),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台用户';


-- ============================================
-- 2. 家族表
-- ============================================
CREATE TABLE families (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(200) NOT NULL COMMENT '族谱名称，如"张氏宗谱"',
    surname          VARCHAR(50)  NOT NULL COMMENT '姓氏',
    description      TEXT         COMMENT '家族简介',
    cover_image_url  VARCHAR(500) COMMENT '封面图',
    generation_count INT UNSIGNED DEFAULT 0 COMMENT '已录入总代数（冗余字段）',
    member_count     INT UNSIGNED DEFAULT 0 COMMENT '成员总数（冗余字段）',
    created_by       BIGINT UNSIGNED NOT NULL COMMENT '创建者',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_surname (surname),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家族/族谱';


-- ============================================
-- 3. 家族成员表 ⭐ 核心
-- ============================================
CREATE TABLE family_members (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    family_id         BIGINT UNSIGNED NOT NULL,

    -- 基本信息
    name              VARCHAR(100) NOT NULL COMMENT '姓名',
    generation_name   VARCHAR(50)  COMMENT '字辈名/派语（如"泽"字辈）',
    alias             VARCHAR(100) COMMENT '曾用名/别名',
    gender            CHAR(1)      COMMENT '性别 M=男 F=女',
    birth_date        DATE         COMMENT '出生日期',
    birth_place       VARCHAR(200) COMMENT '出生地',
    death_date        DATE         COMMENT '逝世日期',
    is_alive          TINYINT(1)   DEFAULT 1 COMMENT '是否在世 1=是 0=否',
    biography         TEXT         COMMENT '生平简介',
    avatar_url        VARCHAR(500) COMMENT '照片',

    -- 代数
    generation_order  INT          COMMENT '第几代（始祖=1）',

    -- 血缘（邻接表模型）
    father_id         BIGINT UNSIGNED COMMENT '生父',
    mother_id         BIGINT UNSIGNED COMMENT '生母',

    -- 过继/收养关系（可选扩展）
    adoptive_father_id BIGINT UNSIGNED COMMENT '养父',
    adoptive_mother_id BIGINT UNSIGNED COMMENT '养母',

    -- 排序
    sort_order        INT          DEFAULT 0 COMMENT '同辈排序',

    -- 元数据
    created_by        BIGINT UNSIGNED COMMENT '录入者',
    updated_by        BIGINT UNSIGNED COMMENT '最后修改者',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 外键
    CONSTRAINT fk_member_family  FOREIGN KEY (family_id)  REFERENCES families(id)       ON DELETE CASCADE,
    CONSTRAINT fk_member_father  FOREIGN KEY (father_id)  REFERENCES family_members(id) ON DELETE SET NULL,
    CONSTRAINT fk_member_mother  FOREIGN KEY (mother_id)  REFERENCES family_members(id) ON DELETE SET NULL,
    CONSTRAINT fk_member_ad_father FOREIGN KEY (adoptive_father_id) REFERENCES family_members(id) ON DELETE SET NULL,
    CONSTRAINT fk_member_ad_mother FOREIGN KEY (adoptive_mother_id) REFERENCES family_members(id) ON DELETE SET NULL,

    -- 索引
    INDEX idx_member_family     (family_id),
    INDEX idx_member_father     (father_id),
    INDEX idx_member_mother     (mother_id),
    INDEX idx_member_generation (family_id, generation_order),
    INDEX idx_member_name       (family_id, name),
    INDEX idx_member_gender     (gender)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家族成员';


-- ============================================
-- 4. 配偶关系表
-- ============================================
CREATE TABLE spouse_relationships (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    family_id      BIGINT UNSIGNED NOT NULL,
    husband_id     BIGINT UNSIGNED NOT NULL COMMENT '丈夫',
    wife_id        BIGINT UNSIGNED NOT NULL COMMENT '妻子',
    marriage_date  DATE            COMMENT '结婚日期',
    divorce_date   DATE            COMMENT '离婚日期（NULL=未离异）',
    is_current     TINYINT(1)      DEFAULT 1 COMMENT '是否当前配偶',
    sort_order     INT             DEFAULT 0 COMMENT '多段婚姻排序',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_spouse_family  FOREIGN KEY (family_id)  REFERENCES families(id)        ON DELETE CASCADE,
    CONSTRAINT fk_spouse_husband FOREIGN KEY (husband_id) REFERENCES family_members(id)  ON DELETE CASCADE,
    CONSTRAINT fk_spouse_wife    FOREIGN KEY (wife_id)    REFERENCES family_members(id)  ON DELETE CASCADE,

    UNIQUE KEY uk_spouse (family_id, husband_id, wife_id),
    INDEX idx_spouse_husband (husband_id),
    INDEX idx_spouse_wife    (wife_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关系';


-- ============================================
-- 5. 族规表
-- ============================================
CREATE TABLE family_rules (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    family_id   BIGINT UNSIGNED NOT NULL,
    title       VARCHAR(200) NOT NULL COMMENT '族规标题',
    content     TEXT         NOT NULL COMMENT '族规正文（支持Markdown）',
    category    VARCHAR(50)  DEFAULT 'general' COMMENT '分类：家训/族规/乡约',
    sort_order  INT          DEFAULT 0,
    is_pinned   TINYINT(1)   DEFAULT 0 COMMENT '是否置顶',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rule_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,

    INDEX idx_rule_family (family_id, sort_order)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='族规/家训';


-- ============================================
-- 6. 家族-用户-角色关联表（权限）
-- ============================================
CREATE TABLE family_user_roles (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    family_id   BIGINT UNSIGNED NOT NULL,
    user_id     BIGINT UNSIGNED NOT NULL,
    member_id   BIGINT UNSIGNED COMMENT '用户对应的家族成员（可为NULL）',
    role        VARCHAR(20) NOT NULL COMMENT 'global_admin=全局管理员 member=普通成员',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fur_family FOREIGN KEY (family_id) REFERENCES families(id)        ON DELETE CASCADE,
    CONSTRAINT fk_fur_user   FOREIGN KEY (user_id)   REFERENCES users(id)           ON DELETE CASCADE,
    CONSTRAINT fk_fur_member FOREIGN KEY (member_id) REFERENCES family_members(id)  ON DELETE SET NULL,

    UNIQUE KEY uk_family_user (family_id, user_id),
    INDEX idx_fur_user   (user_id),
    INDEX idx_fur_member (member_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家族用户角色';


-- ============================================
-- 7. 操作日志表（审计追溯）
-- ============================================
CREATE TABLE operation_logs (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    family_id        BIGINT UNSIGNED NOT NULL,
    user_id          BIGINT UNSIGNED COMMENT '操作人',
    target_member_id BIGINT UNSIGNED COMMENT '操作对象',
    action           VARCHAR(50)  NOT NULL COMMENT 'create_member/update_member/delete_member/add_spouse/...',
    detail_json      JSON         COMMENT '变更详情',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_log_family FOREIGN KEY (family_id)        REFERENCES families(id)        ON DELETE CASCADE,
    CONSTRAINT fk_log_user   FOREIGN KEY (user_id)          REFERENCES users(id)           ON DELETE SET NULL,
    CONSTRAINT fk_log_member FOREIGN KEY (target_member_id) REFERENCES family_members(id)  ON DELETE SET NULL,

    INDEX idx_log_family (family_id),
    INDEX idx_log_member (target_member_id),
    INDEX idx_log_time   (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志';
