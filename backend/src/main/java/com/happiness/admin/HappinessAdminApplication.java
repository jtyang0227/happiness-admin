package com.happiness.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HappinessAdminApplication {

    public static void main(String[] args) {
        SpringApplication.run(HappinessAdminApplication.class, args);
    }

}
