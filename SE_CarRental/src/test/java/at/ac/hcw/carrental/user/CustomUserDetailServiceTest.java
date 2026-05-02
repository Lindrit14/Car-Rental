package at.ac.hcw.carrental.user;

import at.ac.hcw.carrental.user.internal.model.Role;
import at.ac.hcw.carrental.user.internal.model.UserEntity;
import at.ac.hcw.carrental.user.internal.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailService")
class CustomUserDetailServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailService service;

    @Test
    void loadUserByUsername_returnsUserDetails_withRolePrefix() {
        UserEntity entity = UserEntity.builder()
                .id(UUID.randomUUID())
                .email("admin@example.com")
                .password("ENCODED")
                .role(Role.ADMIN)
                .build();
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(entity));

        UserDetails details = service.loadUserByUsername("admin@example.com");

        assertThat(details.getUsername()).isEqualTo("admin@example.com");
        assertThat(details.getPassword()).isEqualTo("ENCODED");
        assertThat(details.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    void loadUserByUsername_returnsUserRolePrefix_forUser() {
        UserEntity entity = UserEntity.builder()
                .email("alice@example.com")
                .password("ENCODED")
                .role(Role.USER)
                .build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(entity));

        UserDetails details = service.loadUserByUsername("alice@example.com");

        assertThat(details.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_USER");
    }

    @Test
    void loadUserByUsername_throwsUsernameNotFoundException_whenMissing() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("ghost@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("ghost@example.com");
    }
}
