package io.github.sotonush.navi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class NaviApplication {

    public static void main(String[] args) {
        SpringApplication.run(NaviApplication.class, args);
    }
}
