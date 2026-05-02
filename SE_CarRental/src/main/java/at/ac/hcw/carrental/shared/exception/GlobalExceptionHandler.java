package at.ac.hcw.carrental.shared.exception;

import at.ac.hcw.carrental.booking.internal.exception.BookingNotFoundException;
import at.ac.hcw.carrental.booking.internal.exception.BookingNotPossibleException;
import com.fasterxml.jackson.databind.JsonMappingException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ==================== Domain: 404 ====================

    @ExceptionHandler({ResourceNotFoundException.class, BookingNotFoundException.class})
    public ResponseEntity<ErrorResponse> handleNotFound(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // ==================== Domain: 409 ====================

    @ExceptionHandler({DuplicateResourceException.class, BookingNotPossibleException.class})
    public ResponseEntity<ErrorResponse> handleConflict(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // ==================== Domain: 403 ====================

    @ExceptionHandler({UnauthorizedAccessException.class, AccessDeniedException.class})
    public ResponseEntity<ErrorResponse> handleForbidden(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    // ==================== Domain: 401 ====================

    @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<ErrorResponse> handleUnauthenticated(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Invalid email or password", request);
    }

    // ==================== Domain: 400 ====================

    @ExceptionHandler({InvalidRequestException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // ==================== Validation: @Valid body ====================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex,
                                                          HttpServletRequest request) {
        List<ErrorResponse.FieldErrorDetail> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> ErrorResponse.FieldErrorDetail.builder()
                        .field(fe.getField())
                        .message(fe.getDefaultMessage())
                        .rejectedValue(fe.getRejectedValue())
                        .build())
                .toList();

        ErrorResponse body = ErrorResponse.builder()
                .timestamp(OffsetDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Validation failed")
                .path(request.getRequestURI())
                .fieldErrors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // ==================== Bad input: malformed JSON, wrong types, missing params ====================

    @ExceptionHandler({HttpMessageNotReadableException.class, JsonMappingException.class})
    public ResponseEntity<ErrorResponse> handleUnreadable(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Malformed request body", request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                            HttpServletRequest request) {
        String required = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "expected type";
        String message = "Parameter '" + ex.getName() + "' must be a valid " + required;
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex,
                                                            HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST,
                "Missing required parameter: " + ex.getParameterName(), request);
    }

    // ==================== Routing ====================

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "Resource not found", request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                                  HttpServletRequest request) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage(), request);
    }

    // ==================== External services ====================

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ErrorResponse> handleExternal(ExternalServiceException ex, HttpServletRequest request) {
        log.error("External service failure on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return build(HttpStatus.BAD_GATEWAY, ex.getMessage(), request);
    }

    // ==================== Catch-all ====================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnknown(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.", request);
    }

    // ==================== Helper ====================

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, HttpServletRequest request) {
        ErrorResponse body = ErrorResponse.builder()
                .timestamp(OffsetDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .build();
        return ResponseEntity.status(status).body(body);
    }
}
