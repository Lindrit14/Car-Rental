package at.ac.hcw.carrental.currency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RateMetadataResponse {

    private String source;
    private String lastRefresh;
    private String rateDate;
    private boolean stale;
}