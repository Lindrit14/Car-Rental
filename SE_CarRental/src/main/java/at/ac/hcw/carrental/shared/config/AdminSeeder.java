package at.ac.hcw.carrental.shared.config;

import at.ac.hcw.carrental.user.internal.model.Role;
import at.ac.hcw.carrental.user.internal.model.UserEntity;
import at.ac.hcw.carrental.user.internal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeeder {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    @Bean
    public CommandLineRunner seedAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String email,
            @Value("${app.admin.password:}") String password,
            @Value("${app.admin.first-name:Admin}") String firstName,
            @Value("${app.admin.last-name:User}") String lastName) {
        return args -> {
            if (email.isBlank() || password.isBlank()) {
                log.warn("admin seeding skipped: ADMIN_EMAIL / ADMIN_PASSWORD not set");
                return;
            }
            if (userRepository.existsByEmail(email)) {
                log.info("admin user already present, skipping seed");
                return;
            }
            UserEntity admin = UserEntity.builder()
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .firstName(firstName)
                    .lastName(lastName)
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("admin user seeded: {}", email);
        };
    }
}
