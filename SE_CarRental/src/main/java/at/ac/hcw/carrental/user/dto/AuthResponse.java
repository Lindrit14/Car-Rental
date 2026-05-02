package at.ac.hcw.carrental.user.dto;

import lombok.Builder;

@Builder
public record AuthResponse(
        String token,
        String email,
        String role
) {}
