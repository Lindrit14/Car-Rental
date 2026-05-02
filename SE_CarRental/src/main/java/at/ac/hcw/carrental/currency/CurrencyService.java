package at.ac.hcw.carrental.currency;

import at.ac.hcw.carrental.currency.dto.ConversionResponse;
import at.ac.hcw.carrental.currency.dto.RateMetadataResponse;
import at.ac.hcw.carrental.currency.internal.SoapCurrencyClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CurrencyService {

    private final SoapCurrencyClient soapClient;

    /**
     * Convert an amount between currencies via the SOAP service.
     */
    public ConversionResponse convert(BigDecimal amount, String from, String to) {
        SoapCurrencyClient.ConvertCurrencyResult result = soapClient.convertCurrency(from, to, amount);

        return ConversionResponse.builder()
                .originalAmount(result.getOriginalAmount())
                .convertedAmount(result.getConvertedAmount())
                .exchangeRate(result.getExchangeRate())
                .fromCurrency(result.getFromCurrency())
                .toCurrency(result.getToCurrency())
                .rateDate(result.getRateDate())
                .stale(result.isStale())
                .build();
    }

    /**
     * Convert a car's daily rate (stored in USD) to the requested currency.
     */
    public BigDecimal convertDailyRate(BigDecimal dailyRateUsd, String targetCurrency) {
        if ("USD".equalsIgnoreCase(targetCurrency)) {
            return dailyRateUsd;
        }

        SoapCurrencyClient.ConvertCurrencyResult result =
                soapClient.convertCurrency("USD", targetCurrency, dailyRateUsd);

        return result.getConvertedAmount();
    }

    /**
     * Get all supported currency codes.
     */
    public List<String> getSupportedCurrencies() {
        return soapClient.getSupportedCurrencies();
    }

    /**
     * Get metadata about the current exchange rates.
     */
    public RateMetadataResponse getRateMetadata() {
        SoapCurrencyClient.RateMetadataResult result = soapClient.getRateMetadata();

        return RateMetadataResponse.builder()
                .source(result.getSource())
                .lastRefresh(result.getLastRefresh())
                .rateDate(result.getRateDate())
                .stale(result.isStale())
                .build();
    }
}