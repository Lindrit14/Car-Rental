package at.ac.hcw.carrental.booking.internal.controller;

import at.ac.hcw.carrental.booking.BookingService;
import at.ac.hcw.carrental.booking.dto.BookingResponse;
import at.ac.hcw.carrental.booking.dto.CreateBookingRequest;
import at.ac.hcw.carrental.booking.internal.model.BookingStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/booking")
@RequiredArgsConstructor
@Tag(name = "Booking", description = "Book, return and manage car rentals")
public class BookingController {

    private final BookingService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new booking")
    public BookingResponse create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateBookingRequest request) {
        return service.createBooking(userDetails.getUsername(), request);
    }

    @GetMapping("/my")
    @Operation(summary = "Get my bookings")
    public List<BookingResponse> getMyBookings(@AuthenticationPrincipal UserDetails userDetails) {
        return service.getBookingsByUser(userDetails.getUsername());
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Get booking by ID (Admin)")
    public BookingResponse getBooking(@PathVariable UUID bookingId) {
        return service.getBookingById(bookingId);
    }

    @PutMapping("/{bookingId}/assign")
    @Operation(summary = "Assign a car to a booking (Admin)")
    public BookingResponse assignCar(
            @PathVariable UUID bookingId,
            @RequestParam UUID carId) {
        return service.assignCar(bookingId, carId);
    }

    @PutMapping("/{bookingId}/return")
    @Operation(summary = "Return a car (Admin)")
    public BookingResponse returnCar(@PathVariable UUID bookingId) {
        return service.changeStatus(bookingId, BookingStatus.RETURNED, null);
    }

    @PutMapping("/{bookingId}/cancel")
    @Operation(summary = "Cancel a booking")
    public BookingResponse cancelBooking(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return service.changeStatus(bookingId, BookingStatus.CANCELLED, userDetails.getUsername());
    }

    @GetMapping
    @Operation(summary = "Get all bookings")
    public List<BookingResponse> getAllBookings() {
        return service.getAllBookings();
    }
}