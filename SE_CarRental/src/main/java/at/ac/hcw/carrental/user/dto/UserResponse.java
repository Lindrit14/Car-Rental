package at.ac.hcw.carrental.user.dto;

import at.ac.hcw.carrental.user.internal.model.Role;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String role
) {}
