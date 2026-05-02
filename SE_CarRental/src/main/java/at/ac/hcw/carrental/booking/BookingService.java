package at.ac.hcw.carrental.booking;

import at.ac.hcw.carrental.booking.dto.BookingResponse;
import at.ac.hcw.carrental.booking.dto.CreateBookingRequest;
import at.ac.hcw.carrental.booking.internal.exception.BookingNotFoundException;
import at.ac.hcw.carrental.booking.internal.exception.BookingNotPossibleException;
import at.ac.hcw.carrental.booking.internal.mapper.BookingMapper;
import at.ac.hcw.carrental.booking.internal.model.BookingEntity;
import at.ac.hcw.carrental.booking.internal.model.BookingStatus;
import at.ac.hcw.carrental.booking.internal.repository.BookingRepository;
import at.ac.hcw.carrental.car.CarService;
import at.ac.hcw.carrental.car.dto.CarResponse;
import at.ac.hcw.carrental.shared.exception.UnauthorizedAccessException;
import at.ac.hcw.carrental.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository repository;
    private final UserService userService;
    private final CarService carService;
    private final BookingMapper mapper;


    @Transactional
    public BookingResponse createBooking(String email, CreateBookingRequest request) {

        List<CarResponse> cars = carService.getCarsByTypeAndLocation(request.getType(), request.getLocation());
        if (cars.isEmpty()) {
            throw new BookingNotPossibleException("No cars of type " + request.getType() + " at " + request.getLocation());
        }

        boolean anyAvailable = cars
                .stream()
                .anyMatch(car ->
                !repository.existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        car.getId(), List.of(BookingStatus.RESERVED, BookingStatus.ACTIVE),
                        request.getEndDate(), request.getStartDate()));

        if (!anyAvailable) {
            throw new BookingNotPossibleException("There are no cars of type " + request.getType() + " available at " + request.getLocation() + " for the given time");
        }

        UUID userId = userService.getIdByMail(email);
        BigDecimal dailyRate = carService.getCheapestDailyRate(request.getType(), request.getLocation());

        BookingEntity booking = BookingEntity.builder()
                .userId(userId)
                .type(request.getType())
                .location(request.getLocation())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .dailyRate(dailyRate)
                .status(BookingStatus.RESERVED)
                .build();

        return mapper.toResponse(repository.save(booking));
    }

    @Transactional
    public BookingResponse assignCar(UUID bookingId, UUID carId){

        BookingEntity entity = repository.findByIdAndStatusIn(bookingId, List.of(BookingStatus.RESERVED, BookingStatus.ACTIVE))
                .orElseThrow(() -> new BookingNotFoundException("There is no active booking with id " + bookingId));

        CarResponse car = carService.getCar(carId);
        if (!car.getLocation().equals(entity.getLocation())) {
            throw new BookingNotPossibleException("Car location does not match booking");
        }

        if(repository.existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                carId,
                List.of(BookingStatus.RESERVED, BookingStatus.ACTIVE),
                entity.getEndDate(),
                entity.getStartDate())
        ) {
            throw new BookingNotPossibleException("There is already an active booking for the car with id " + carId);
        }

        entity.setCarId(carId);
        if(entity.getStatus() == BookingStatus.RESERVED) entity.setStatus(BookingStatus.ACTIVE);

        return mapper.toResponse(entity);
    }

    @Transactional
    public BookingResponse changeStatus(UUID bookingId, BookingStatus destinationStatus, String email) {

        BookingEntity entity = repository.findByIdAndStatusIn(bookingId, List.of(BookingStatus.RESERVED, BookingStatus.ACTIVE))
                .orElseThrow(() -> new BookingNotFoundException("There is no active booking with id " + bookingId));

        switch (destinationStatus) {
            case RETURNED:
                if (entity.getStatus() != BookingStatus.ACTIVE) {
                    throw new BookingNotPossibleException("Only active bookings can be returned");
                }
                entity.setStatus(BookingStatus.RETURNED);
                break;
            case CANCELLED:
                if (entity.getStatus() != BookingStatus.RESERVED) {
                    throw new BookingNotPossibleException("Only reserved bookings can be cancelled");
                }
                UUID userId = userService.getIdByMail(email);
                if (!userId.equals(entity.getUserId())) {
                    throw new UnauthorizedAccessException("You can only cancel your own bookings");
                }
                entity.setStatus(BookingStatus.CANCELLED);
                break;
            default:
                throw new BookingNotPossibleException("Destination status not supported");
        }

        return mapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUser(String email) {

        UUID userId = userService.getIdByMail(email);
        return repository.findAllByUserId(userId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(UUID bookingId) {
        BookingEntity entity = repository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking with id " + bookingId + " does not exist"));

        return mapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        List<BookingEntity> entities = repository.findAllByStatusIn(List.of(BookingStatus.ACTIVE, BookingStatus.RESERVED));
        return entities
                .stream()
                .map(mapper::toResponse)
                .toList();
    }
}
