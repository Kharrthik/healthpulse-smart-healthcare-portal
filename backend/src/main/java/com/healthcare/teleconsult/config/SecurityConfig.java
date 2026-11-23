package com.healthcare.teleconsult.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.teleconsult.dto.ApiResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ObjectMapper objectMapper;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(ObjectMapper objectMapper, CorsConfigurationSource corsConfigurationSource) {
        this.objectMapper = objectMapper;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   SecurityContextRepository securityContextRepository) throws Exception {
        CookieCsrfTokenRepository tokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        tokenRepository.setCookiePath("/");

        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf
                .csrfTokenRepository(tokenRepository)
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers(
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/ai/preview-triage",
                    "/api/assistant",
                    "/api/appointments",
                    "/api/appointments/**",
                    "/h2-console/**"
                )
            )
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .securityContext(context -> context
                .securityContextRepository(securityContextRepository)
                .requireExplicitSave(false)
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .authorizeHttpRequests(auth -> auth
                // Public Information Endpoints
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/csrf").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/dashboard", "/api/dashboard/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/doctors", "/api/doctors/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/appointments").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/assistant").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/ai/preview-triage").permitAll()
                .requestMatchers("/h2-console/**").permitAll()

                // Doctor-Specific Mutating Endpoints
                .requestMatchers(HttpMethod.POST, "/api/prescriptions", "/api/prescriptions/**").hasAnyRole("DOCTOR", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/consultations/*/status").hasAnyRole("DOCTOR", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/prescriptions/doctor", "/api/prescriptions/doctor/**").hasAnyRole("DOCTOR", "ADMIN")

                // Patient and Provider Booking Endpoints
                .requestMatchers(HttpMethod.POST, "/api/consultations").hasAnyRole("PATIENT", "ADMIN")

                // Appointment Management Endpoints
                .requestMatchers(HttpMethod.GET, "/api/appointments", "/api/appointments/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/appointments/*/status").authenticated()

                // Authenticated General Endpoints
                .requestMatchers(HttpMethod.GET, "/api/consultations", "/api/consultations/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/prescriptions", "/api/prescriptions/**").authenticated()
                .requestMatchers("/api/auth/me", "/api/auth/me/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterAfter(new CsrfCookieFilter(), org.springframework.security.web.csrf.CsrfFilter.class)
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    ApiResponse<Void> body = ApiResponse.error("Authentication required. Please sign in.");
                    objectMapper.writeValue(response.getOutputStream(), body);
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    ApiResponse<Void> body = ApiResponse.error("Access denied: insufficient role permissions or invalid CSRF token.");
                    objectMapper.writeValue(response.getOutputStream(), body);
                })
            );

        return http.build();
    }

    /**
     * Ensures the CSRF cookie (XSRF-TOKEN) is rendered into the HTTP response
     * by resolving the deferred token on every request.
     */
    private static final class CsrfCookieFilter extends org.springframework.web.filter.OncePerRequestFilter {
        @Override
        protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                        jakarta.servlet.http.HttpServletResponse response,
                                        jakarta.servlet.FilterChain filterChain)
                throws jakarta.servlet.ServletException, java.io.IOException {
            org.springframework.security.web.csrf.CsrfToken csrfToken =
                    (org.springframework.security.web.csrf.CsrfToken) request.getAttribute(org.springframework.security.web.csrf.CsrfToken.class.getName());
            if (csrfToken != null) {
                csrfToken.getToken();
            }
            filterChain.doFilter(request, response);
        }
    }
}
