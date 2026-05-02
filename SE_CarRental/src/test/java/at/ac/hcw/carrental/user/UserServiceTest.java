package at.ac.hcw.carrental.user;

import at.ac.hcw.carrental.shared.security.JwtTokenProvider;
import at.ac.hcw.carrental.user.dto.AuthResponse;
import at.ac.hcw.carrental.user.dto.LoginRequest;
import at.ac.hcw.carrental.user.dto.RegisterRequest;
import at.ac.hcw.carrental.user.internal.model.Role;
import at.ac.hcw.carrental.user.internal.model.UserEntity;
import at.ac.hcw.carrental.user.internal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock
    private UserRepository repository;
    @Mock
    private JwtTokenProvider tokenProvider;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService service;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setup() {
        registerRequest = new RegisterRequest();
        registerRequest.setEmail("alice@example.com");
        registerRequest.setPassword("hunter2");
        registerRequest.setFirstName("Alice");
        registerRequest.setLastName("Smith");
    }

    // ---------- register ----------

    @Test
    void register_persistsUser_authenticates_andReturnsToken() {
        when(repository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("hunter2")).thenReturn("ENCODED");
        Authentication auth = new UsernamePasswordAuthenticationToken("alice@example.com", "hunter2");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(tokenProvider.generateToken(auth)).thenReturn("jwt-token");

        AuthResponse response = service.register(registerRequest);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo("alice@example.com");
        assertThat(response.role()).isEqualTo("USER");

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repository).save(captor.capture());
        UserEntity saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("alice@example.com");
        assertThat(saved.getPassword()).isEqualTo("ENCODED");
        assertThat(saved.getFirstName()).isEqualTo("Alice");
        assertThat(saved.getLastName()).isEqualTo("Smith");
        assertThat(saved.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void register_throwsIllegalArgument_whenEmailExists() {
        when(repository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(registerRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email");

        verify(repository, never()).save(any());
        verify(authenticationManager, never()).authenticate(any());
        verify(tokenProvider, never()).generateToken(any());
    }

    @Test
    void register_storesEncodedPassword() {
        when(repository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("hunter2")).thenReturn("BCRYPT-HASH");
        Authentication auth = new UsernamePasswordAuthenticationToken("alice@example.com", "hunter2");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(tokenProvider.generateToken(auth)).thenReturn("token");

        service.register(registerRequest);

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getPassword())
                .isEqualTo("BCRYPT-HASH")
                .isNotEqualTo("hunter2");
    }

    // ---------- login ----------

    @Test
    void login_returnsToken_whenCredentialsValid() {
        UserEntity stored = UserEntity.builder()
                .id(UUID.randomUUID())
                .email("alice@example.com")
                .password("ENCODED")
                .role(Role.ADMIN)
                .build();
        when(repository.findByEmail("alice@example.com")).thenReturn(Optional.of(stored));
        Authentication auth = new UsernamePasswordAuthenticationToken("alice@example.com", "hunter2");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(tokenProvider.generateToken(auth)).thenReturn("jwt-token");

        LoginRequest req = new LoginRequest();
        req.setEmail("alice@example.com");
        req.setPassword("hunter2");

        AuthResponse response = service.login(req);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo("alice@example.com");
        assertThat(response.role()).isEqualTo("ADMIN");
    }

    @Test
    void login_throwsIllegalArgument_whenUserNotFound() {
        when(repository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest();
        req.setEmail("ghost@example.com");
        req.setPassword("whatever");

        assertThatThrownBy(() -> service.login(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");

        verify(authenticationManager, never()).authenticate(any());
        verify(tokenProvider, never()).generateToken(any());
    }

    @Test
    void login_propagatesAuthenticationException_whenBadCredentials() {
        UserEntity stored = UserEntity.builder()
                .email("alice@example.com")
                .password("ENCODED")
                .role(Role.USER)
                .build();
        when(repository.findByEmail("alice@example.com")).thenReturn(Optional.of(stored));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("bad creds"));

        LoginRequest req = new LoginRequest();
        req.setEmail("alice@example.com");
        req.setPassword("wrong");

        assertThatThrownBy(() -> service.login(req))
                .isInstanceOf(BadCredentialsException.class);

        verify(tokenProvider, never()).generateToken(any());
    }

    // ---------- existsByEmail ----------

    @Test
    void existsByEmail_delegatesToRepository() {
        when(repository.existsByEmail("yes@example.com")).thenReturn(true);
        when(repository.existsByEmail("no@example.com")).thenReturn(false);

        assertThat(service.existsByEmail("yes@example.com")).isTrue();
        assertThat(service.existsByEmail("no@example.com")).isFalse();
    }

    // ---------- getIdByMail ----------

    @Test
    void getIdByMail_returnsUserId_whenFound() {
        UUID id = UUID.randomUUID();
        UserEntity stored = UserEntity.builder().id(id).email("alice@example.com").build();
        when(repository.findByEmail("alice@example.com")).thenReturn(Optional.of(stored));

        assertThat(service.getIdByMail("alice@example.com")).isEqualTo(id);
    }

    @Test
    void getIdByMail_throwsIllegalArgument_whenMissing() {
        when(repository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getIdByMail("ghost@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }
}
