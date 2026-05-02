package at.ac.hcw.carrental.user.internal.controller;

import at.ac.hcw.carrental.user.UserService;
import at.ac.hcw.carrental.user.dto.AuthResponse;
import at.ac.hcw.carrental.user.dto.LoginRequest;
import at.ac.hcw.carrental.user.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "Handles login, registration and user management")
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register new user")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request){
        return userService.register(request);
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "User login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request){
        return userService.login(request);
    }

}
