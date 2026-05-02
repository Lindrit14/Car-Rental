package at.ac.hcw.carrental.car.internal.model;

import at.ac.hcw.carrental.car.dto.CarType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "cars")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class CarEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "brand_name", nullable = false)
    private String brand;

    private String model;

    @Column(name = "manufacture_year")
    private int year;

    @Column(name = "license_plate", unique = true, nullable = false)
    private String licensePlate;

    @Enumerated(EnumType.STRING)
    @Column(name = "car_type")
    private CarType carType;

    @Column(name = "daily_rate", nullable = false)
    private BigDecimal dailyRate;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private Integer seats;

    private TransmissionType transmissionType;

    private Integer largeLuggage;
    private Integer smallLuggage;

    public enum TransmissionType{
        AUTOMATIC,
        MANUAL
    }
}
