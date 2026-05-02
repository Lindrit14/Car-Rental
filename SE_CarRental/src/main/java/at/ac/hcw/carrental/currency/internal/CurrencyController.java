package at.ac.hcw.carrental.currency.internal;

import at.ac.hcw.carrental.currency.CurrencyService;
import at.ac.hcw.carrental.currency.dto.ConversionResponse;
import at.ac.hcw.carrental.currency.dto.RateMetadataResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
@Tag(name = "Currency", description = "Currency conversion via ECB rates")
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping("/convert")
    @Operation(summary = "Convert an amount between currencies")
    public ResponseEntity<ConversionResponse> convert(
            @RequestParam BigDecimal amount,
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(currencyService.convert(amount, from, to));
    }

    @GetMapping("/currencies")
    @Operation(summary = "Get all supported currency codes")
    public ResponseEntity<List<String>> getSupportedCurrencies() {
        return ResponseEntity.ok(currencyService.getSupportedCurrencies());
    }

    @GetMapping("/metadata")
    @Operation(summary = "Get rate metadata (source, last refresh, staleness)")
    public ResponseEntity<RateMetadataResponse> getMetadata() {
        return ResponseEntity.ok(currencyService.getRateMetadata());
    }
}