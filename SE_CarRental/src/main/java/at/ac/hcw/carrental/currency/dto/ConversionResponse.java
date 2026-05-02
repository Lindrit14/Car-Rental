package at.ac.hcw.carrental.currency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversionResponse {

    private BigDecimal originalAmount;
    private BigDecimal convertedAmount;
    private BigDecimal exchangeRate;
    private String fromCurrency;
    private String toCurrency;
    private String rateDate;
    private boolean stale;
}