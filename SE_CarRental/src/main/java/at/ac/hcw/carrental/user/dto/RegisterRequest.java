package at.ac.hcw.carrental.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Invalid email format")
    String email;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 6, message = "Password must be at least 6 characters")
    String password;

    @NotBlank(message = "First name cannot be empty")
    String firstName;

    @NotBlank(message = "Last name cannot be empty")
    String lastName;

}
