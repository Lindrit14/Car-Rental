package at.ac.hcw.carrental.user;

import at.ac.hcw.carrental.shared.exception.DuplicateResourceException;
import at.ac.hcw.carrental.shared.exception.ResourceNotFoundException;
import at.ac.hcw.carrental.shared.security.JwtTokenProvider;
import at.ac.hcw.carrental.user.dto.AuthResponse;
import at.ac.hcw.carrental.user.dto.LoginRequest;
import at.ac.hcw.carrental.user.dto.RegisterRequest;
import at.ac.hcw.carrental.user.internal.model.*;
import at.ac.hcw.carrental.user.internal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if(repository.existsByEmail(request.getEmail())){
            throw new DuplicateResourceException("Email already exists");
        }

        UserEntity user = UserEntity.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.USER)
                .build();

        repository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().toString())
                .build();

    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        UserEntity user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().toString())
                .build();
    }

    public boolean existsByEmail(String email) {
        return repository.existsByEmail(email);
    }
    public UUID getIdByMail(String email) {
        UserEntity user = repository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return user.getId();
    }
}
