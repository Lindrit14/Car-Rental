package at.ac.hcw.carrental.car.dto;

import at.ac.hcw.carrental.car.internal.model.CarEntity;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateCarRequest {

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Model is required")
    private String model;

    @NotBlank(message = "License plate is required")
    private String licensePlate;

    @Min(value = 1950, message = "Year must be 1950 or later")
    @Max(value = 2026, message = "Year cannot be in the future")
    private int year;

    @NotNull(message = "Daily rate is required")
    @Positive(message = "Daily rate must be positive")
    private BigDecimal dailyRate;

    @NotNull(message = "Car type is required")
    private CarType carType;

    @NotBlank(message = "Location is required")
    private String location;

    @Min(value = 1)
    @Max(value = 8)
    private Integer seats;

    @NotBlank
    private CarEntity.TransmissionType transmissionType;

    @Positive
    @Max(value = 5)
    private Integer largeLuggage;

    @Positive
    @Max(value = 10)
    private Integer smallLuggage;
}