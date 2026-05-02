package at.ac.hcw.carrental.booking.internal.model;

import at.ac.hcw.carrental.car.dto.CarType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "bookings")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class BookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID userId;

    private UUID carId;

    private LocalDate startDate;
    private LocalDate endDate;

    //Always in USD
    private BigDecimal dailyRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(nullable = false)
    private CarType type;

    private String location;
}
