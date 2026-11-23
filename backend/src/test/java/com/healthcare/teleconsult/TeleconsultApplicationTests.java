package com.healthcare.teleconsult;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class TeleconsultApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring context, JPA repositories, and configuration initialize cleanly
    }
}

