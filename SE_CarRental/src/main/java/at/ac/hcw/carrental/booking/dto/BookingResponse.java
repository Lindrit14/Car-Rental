package at.ac.hcw.carrental.booking.dto;

import at.ac.hcw.carrental.booking.internal.model.BookingStatus;
import at.ac.hcw.carrental.car.dto.CarType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private UUID id;
    private UUID userId;
    private UUID carId;

    private CarType type;
    private String location;

    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal dailyRate;
    private BigDecimal totalPrice;
    private BookingStatus status;
}
