package org.example.zupu_demo;

import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import javax.sql.DataSource;

@Slf4j
@SpringBootApplication
@MapperScan("org.example.zupu_demo.mapper")
public class ZupuDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZupuDemoApplication.class, args);
    }

    @Bean
    CommandLineRunner testConnection(DataSource dataSource) {
        return args -> {
            var conn = dataSource.getConnection();
            log.info("========================================");
            log.info("  数据库连接成功！");
            log.info("  URL: {}", conn.getMetaData().getURL());
            log.info("  DB: {}", conn.getCatalog());
            log.info("========================================");
            conn.close();
        };
    }
}
