package at.ac.hcw.carrental.car.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class CarResponse {

    private UUID id;
    private String brand;
    private String model;
    private int year;
    private BigDecimal dailyRate;
    private String licensePlate;
    private CarType carType;
    private String location;
}
