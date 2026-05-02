package at.ac.hcw.carrental.car.dto;

import at.ac.hcw.carrental.car.internal.model.CarEntity;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateCarRequest {

    @NotBlank(message = "Brand cannot be blank")
    private String brand;

    @NotBlank(message = "Model cannot be blank")
    private String model;

    @Min(value = 1950, message = "Year must be 1950 or later")
    @Max(value = 2026, message = "Year cannot be in the future")
    private Integer year;

    @NotBlank(message = "License plate is required")
    private String licensePlate;

    @NotNull(message = "Car type is required")
    private String carType;

    @NotNull(message = "Daily rate is required")
    @Positive(message = "Daily rate must be positive")
    private BigDecimal dailyRate;

    @NotBlank(message = "Location is required")
    private String location;

    private Boolean available;

    @Min(value = 1)
    @Max(value = 8)
    private Integer seats;

    @NotBlank(message = "Transmission type cannot be blank")
    private CarEntity.TransmissionType transmissionType;

    @Positive
    @Max(value = 5)
    private Integer largeLuggage;

    @Positive
    @Max(value = 10)
    private Integer smallLuggage;

}
