package org.example.zupu_demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.zupu_demo.entity.User;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
