package at.ac.hcw.carrental.booking.internal.exception;

public class BookingNotFoundException extends RuntimeException {
    public BookingNotFoundException(String message) {
        super(message);
    }
}
