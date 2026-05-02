package at.ac.hcw.carrental.shared.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;
import java.util.List;

@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    OffsetDateTime timestamp;
    int status;
    String error;
    String message;
    String path;
    List<FieldErrorDetail> fieldErrors;

    @Value
    @Builder
    public static class FieldErrorDetail {
        String field;
        String message;
        Object rejectedValue;
    }
}
