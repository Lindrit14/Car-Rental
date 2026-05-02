package at.ac.hcw.carrental.car.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarPriceResponse {

    private UUID carId;
    private BigDecimal price;
    private BigDecimal dailyRate;
    private long days;
    private String currency;
    private LocalDate startDate;
    private LocalDate endDate;

}
