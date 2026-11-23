package com.healthcare.teleconsult.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * CORS configuration for the Vite dev proxy and any direct browser origins.
 *
 * With Vite's dev server proxy (changeOrigin: true), the browser never sends
 * cross-origin requests directly to localhost:8080 during development, so CORS
 * is effectively a no-op in dev. However, this config is required for production
 * deployments and keeps Spring Security's cors() filter properly configured.
 *
 * NOTE: We intentionally do NOT register an extra CorsFilter @Bean here.
 * Spring Security's http.cors() already installs a CorsFilter at the correct
 * position in the filter chain. A duplicate @Bean CorsFilter at a different order
 * can result in double-processing of CORS preflight requests.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition", "X-CSRF-TOKEN", "X-XSRF-TOKEN"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
