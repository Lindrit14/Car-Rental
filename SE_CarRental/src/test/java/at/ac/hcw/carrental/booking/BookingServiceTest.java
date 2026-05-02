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
import at.ac.hcw.carrental.car.dto.CarType;
import at.ac.hcw.carrental.shared.exception.UnauthorizedAccessException;
import at.ac.hcw.carrental.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingService")
class BookingServiceTest {

    @Mock
    private BookingRepository repository;
    @Mock
    private UserService userService;
    @Mock
    private CarService carService;
    @Mock
    private BookingMapper mapper;

    @InjectMocks
    private BookingService service;

    private CreateBookingRequest createRequest;
    private CarResponse carA;
    private CarResponse carB;
    private UUID userId;
    private UUID bookingId;
    private LocalDate startDate;
    private LocalDate endDate;

    @BeforeEach
    void setup() {
        userId = UUID.randomUUID();
        bookingId = UUID.randomUUID();
        startDate = LocalDate.of(2026, 6, 1);
        endDate = LocalDate.of(2026, 6, 8);

        createRequest = new CreateBookingRequest();
        createRequest.setType(CarType.SUV);
        createRequest.setLocation("Vienna");
        createRequest.setStartDate(startDate);
        createRequest.setEndDate(endDate);

        carA = CarResponse.builder()
                .id(UUID.randomUUID())
                .carType(CarType.SUV)
                .location("Vienna")
                .dailyRate(new BigDecimal("80"))
                .build();
        carB = CarResponse.builder()
                .id(UUID.randomUUID())
                .carType(CarType.SUV)
                .location("Vienna")
                .dailyRate(new BigDecimal("60"))
                .build();
    }

    // ---------- createBooking ----------

    @Test
    void createBooking_savesReservedBooking_whenCarsAvailable() {
        when(carService.getCarsByTypeAndLocation(CarType.SUV, "Vienna")).thenReturn(List.of(carA));
        when(repository.existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                eq(carA.getId()), anyList(), eq(endDate), eq(startDate))).thenReturn(false);
        when(userService.getIdByMail("alice@example.com")).thenReturn(userId);
        when(carService.getCheapestDailyRate(CarType.SUV, "Vienna")).thenReturn(new BigDecimal("60"));
        when(repository.save(any(BookingEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        BookingResponse mapped = BookingResponse.builder().id(bookingId).build();
        when(mapper.toResponse(any(BookingEntity.class))).thenReturn(mapped);

        BookingResponse result = service.createBooking("alice@example.com", createRequest);

        assertThat(result).isSameAs(mapped);

        ArgumentCaptor<BookingEntity> captor = ArgumentCaptor.forClass(BookingEntity.class);
        verify(repository).save(captor.capture());
        BookingEntity saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(BookingStatus.RESERVED);
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getType()).isEqualTo(CarType.SUV);
        assertThat(saved.getLocation()).isEqualTo("Vienna");
        assertThat(saved.getStartDate()).isEqualTo(startDate);
        assertThat(saved.getEndDate()).isEqualTo(endDate);
        assertThat(saved.getDailyRate()).isEqualByComparingTo("60");
        assertThat(saved.getCarId()).isNull();
    }

    @Test
    void createBooking_throwsBookingNotPossible_whenNoCarsOfTypeAtLocation() {
        when(carService.getCarsByTypeAndLocation(CarType.SUV, "Vienna")).thenReturn(List.of());

        assertThatThrownBy(() -> service.createBooking("alice@example.com", createRequest))
                .isInstanceOf(BookingNotPossibleException.class)
                .hasMessageContaining("SUV")
                .hasMessageContaining("Vienna");

        verify(repository, never()).save(any());
    }

    @Test
    void createBooking_throwsBookingNotPossible_whenAllCarsBookedForRange() {
        when(carService.getCarsByTypeAndLocation(CarType.SUV, "Vienna")).thenReturn(List.of(carA, carB));
        when(repository.existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                any(UUID.class), anyList(), eq(endDate), eq(startDate))).thenReturn(true);

        assertThatThrownBy(() -> service.createBooking("alice@example.com", createRequest))
                .isInstanceOf(BookingNotPossibleException.class)
                .hasMessageContaining("available");

        verify(repository, never()).save(any());
    }

    @Test
    void createBooking_succeeds_whenAtLeastOneCarFree() {
        when(carService.getCarsByTypeAndLocation(CarType.SUV, "Vienna")).thenReturn(List.of(carA, carB));
        when(repository.existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                eq(carA.getId()), anyList(), eq(endDate), eq(startDate))).thenReturn(true);
        when(repository.existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                eq(carB.getId()), anyList(), eq(endDate), eq(startDate))).thenReturn(false);
        when(userService.getIdByMail("alice@example.com")).thenReturn(userId);
        when(carService.getCheapestDailyRate(CarType.SUV, "Vienna")).thenReturn(new BigDecimal("60"));
        when(repository.save(any(BookingEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponse(any(BookingEntity.class))).thenReturn(BookingResponse.builder().build());

        service.createBooking("alice@example.com", createRequest);

        verify(repository, times(1)).save(any(BookingEntity.class));
    }

    // ---------- assignCar ----------

    @Test
    void assignCar_transitionsReservedToActive_andSetsCarId() {
        UUID carId = UUID.randomUUID();
        BookingEntity reserved = BookingEntity.builder()
                .id(bookingId)
                .userId(userId)
                .type(CarType.SUV)
                .location("Vienna")
                .status(BookingStatus.RESERVED)
                .startDate(startDate)
                .endDate(endDate)
                .build();
        CarResponse car = CarResponse.builder().id(carId).location("Vienna").build();

        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(reserved));
        when(carService.getCar(carId)).thenReturn(car);
        when(repository.existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                eq(carId), anyList(), eq(endDate), eq(startDate))).thenReturn(false);
        when(mapper.toResponse(reserved)).thenReturn(BookingResponse.builder().id(bookingId).build());

        service.assignCar(bookingId, carId);

        assertThat(reserved.getCarId()).isEqualTo(carId);
        assertThat(reserved.getStatus()).isEqualTo(BookingStatus.ACTIVE);
    }

    @Test
    void assignCar_keepsActiveStatus_whenAlreadyActive() {
        UUID newCarId = UUID.randomUUID();
        BookingEntity active = BookingEntity.builder()
                .id(bookingId)
                .userId(userId)
                .type(CarType.SUV)
                .location("Vienna")
                .status(BookingStatus.ACTIVE)
                .startDate(startDate)
                .endDate(endDate)
                .build();
        CarResponse car = CarResponse.builder().id(newCarId).location("Vienna").build();

        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(active));
        when(carService.getCar(newCarId)).thenReturn(car);
        when(repository.existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                eq(newCarId), anyList(), eq(endDate), eq(startDate))).thenReturn(false);
        when(mapper.toResponse(active)).thenReturn(BookingResponse.builder().build());

        service.assignCar(bookingId, newCarId);

        assertThat(active.getCarId()).isEqualTo(newCarId);
        assertThat(active.getStatus()).isEqualTo(BookingStatus.ACTIVE);
    }

    @Test
    void assignCar_throwsBookingNotFound_whenBookingMissingOrTerminalStatus() {
        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignCar(bookingId, UUID.randomUUID()))
                .isInstanceOf(BookingNotFoundException.class)
                .hasMessageContaining(bookingId.toString());

        verify(carService, never()).getCar(any());
    }

    @Test
    void assignCar_throwsBookingNotPossible_whenCarLocationMismatch() {
        UUID carId = UUID.randomUUID();
        BookingEntity reserved = BookingEntity.builder()
                .id(bookingId)
                .location("Vienna")
                .status(BookingStatus.RESERVED)
                .startDate(startDate)
                .endDate(endDate)
                .build();
        CarResponse car = CarResponse.builder().id(carId).location("Salzburg").build();

        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(reserved));
        when(carService.getCar(carId)).thenReturn(car);

        assertThatThrownBy(() -> service.assignCar(bookingId, carId))
                .isInstanceOf(BookingNotPossibleException.class)
                .hasMessageContaining("location");

        assertThat(reserved.getCarId()).isNull();
        assertThat(reserved.getStatus()).isEqualTo(BookingStatus.RESERVED);
    }

    @Test
    void assignCar_throwsBookingNotPossible_whenCarAlreadyBookedForRange() {
        UUID carId = UUID.randomUUID();
        BookingEntity reserved = BookingEntity.builder()
                .id(bookingId)
                .location("Vienna")
                .status(BookingStatus.RESERVED)
                .startDate(startDate)
                .endDate(endDate)
                .build();
        CarResponse car = CarResponse.builder().id(carId).location("Vienna").build();

        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(reserved));
        when(carService.getCar(carId)).thenReturn(car);
        when(repository.existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                eq(carId), anyList(), eq(endDate), eq(startDate))).thenReturn(true);

        assertThatThrownBy(() -> service.assignCar(bookingId, carId))
                .isInstanceOf(BookingNotPossibleException.class)
                .hasMessageContaining(carId.toString());

        assertThat(reserved.getCarId()).isNull();
        assertThat(reserved.getStatus()).isEqualTo(BookingStatus.RESERVED);
    }

    // ---------- changeStatus ----------

    @Test
    void changeStatus_returnsActiveBooking() {
        BookingEntity active = BookingEntity.builder()
                .id(bookingId)
                .userId(userId)
                .status(BookingStatus.ACTIVE)
                .build();
        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(active));
        when(mapper.toResponse(active)).thenReturn(BookingResponse.builder().build());

        service.changeStatus(bookingId, BookingStatus.RETURNED, null);

        assertThat(active.getStatus()).isEqualTo(BookingStatus.RETURNED);
    }

    @Test
    void changeStatus_throwsBookingNotPossible_whenReturningNonActive() {
        BookingEntity reserved = BookingEntity.builder()
                .id(bookingId)
                .userId(userId)
                .status(BookingStatus.RESERVED)
                .build();
        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(reserved));

        assertThatThrownBy(() -> service.changeStatus(bookingId, BookingStatus.RETURNED, null))
                .isInstanceOf(BookingNotPossibleException.class)
                .hasMessageContaining("active");

        assertThat(reserved.getStatus()).isEqualTo(BookingStatus.RESERVED);
    }

    @Test
    void changeStatus_cancelsReservedBooking_whenOwnerMatches() {
        BookingEntity reserved = BookingEntity.builder()
                .id(bookingId)
                .userId(userId)
                .status(BookingStatus.RESERVED)
                .build();
        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(reserved));
        when(userService.getIdByMail("alice@example.com")).thenReturn(userId);
        when(mapper.toResponse(reserved)).thenReturn(BookingResponse.builder().build());

        service.changeStatus(bookingId, BookingStatus.CANCELLED, "alice@example.com");

        assertThat(reserved.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    void changeStatus_throwsUnauthorized_whenCancellingOthersBooking() {
        BookingEntity reserved = BookingEntity.builder()
                .id(bookingId)
                .userId(userId)
                .status(BookingStatus.RESERVED)
                .build();
        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(reserved));
        when(userService.getIdByMail("intruder@example.com")).thenReturn(UUID.randomUUID());

        assertThatThrownBy(() -> service.changeStatus(bookingId, BookingStatus.CANCELLED, "intruder@example.com"))
                .isInstanceOf(UnauthorizedAccessException.class);

        assertThat(reserved.getStatus()).isEqualTo(BookingStatus.RESERVED);
    }

    @Test
    void changeStatus_throwsBookingNotPossible_whenCancellingActiveBooking() {
        BookingEntity active = BookingEntity.builder()
                .id(bookingId)
                .userId(userId)
                .status(BookingStatus.ACTIVE)
                .build();
        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(active));

        assertThatThrownBy(() -> service.changeStatus(bookingId, BookingStatus.CANCELLED, "alice@example.com"))
                .isInstanceOf(BookingNotPossibleException.class)
                .hasMessageContaining("reserved");

        assertThat(active.getStatus()).isEqualTo(BookingStatus.ACTIVE);
        verify(userService, never()).getIdByMail(any());
    }

    @Test
    void changeStatus_throwsBookingNotPossible_forUnsupportedTarget() {
        BookingEntity reserved = BookingEntity.builder()
                .id(bookingId)
                .userId(userId)
                .status(BookingStatus.RESERVED)
                .build();
        when(repository.findByIdAndStatusIn(eq(bookingId), anyList())).thenReturn(Optional.of(reserved));

        assertThatThrownBy(() -> service.changeStatus(bookingId, BookingStatus.RESERVED, null))
                .isInstanceOf(BookingNotPossibleException.class)
                .hasMessageContaining("not supported");
    }

    // ---------- queries ----------

    @Test
    void getBookingsByUser_returnsMappedList() {
        BookingEntity e1 = BookingEntity.builder().userId(userId).build();
        BookingEntity e2 = BookingEntity.builder().userId(userId).build();
        BookingResponse r1 = BookingResponse.builder().build();
        BookingResponse r2 = BookingResponse.builder().build();

        when(userService.getIdByMail("alice@example.com")).thenReturn(userId);
        when(repository.findAllByUserId(userId)).thenReturn(List.of(e1, e2));
        when(mapper.toResponse(e1)).thenReturn(r1);
        when(mapper.toResponse(e2)).thenReturn(r2);

        List<BookingResponse> result = service.getBookingsByUser("alice@example.com");

        assertThat(result).containsExactly(r1, r2);
    }

    @Test
    void getBookingById_returnsMapped_whenFound() {
        BookingEntity entity = BookingEntity.builder().id(bookingId).build();
        BookingResponse mapped = BookingResponse.builder().id(bookingId).build();
        when(repository.findById(bookingId)).thenReturn(Optional.of(entity));
        when(mapper.toResponse(entity)).thenReturn(mapped);

        assertThat(service.getBookingById(bookingId)).isSameAs(mapped);
    }

    @Test
    void getBookingById_throwsBookingNotFound_whenMissing() {
        when(repository.findById(bookingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getBookingById(bookingId))
                .isInstanceOf(BookingNotFoundException.class)
                .hasMessageContaining(bookingId.toString());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAllBookings_returnsOnlyActiveAndReservedMapped() {
        BookingEntity e1 = BookingEntity.builder().status(BookingStatus.ACTIVE).build();
        BookingEntity e2 = BookingEntity.builder().status(BookingStatus.RESERVED).build();
        when(repository.findAllByStatusIn(anyList())).thenReturn(List.of(e1, e2));
        when(mapper.toResponse(any(BookingEntity.class))).thenReturn(BookingResponse.builder().build());

        service.getAllBookings();

        ArgumentCaptor<List<BookingStatus>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).findAllByStatusIn(captor.capture());
        assertThat(captor.getValue())
                .containsExactlyInAnyOrder(BookingStatus.ACTIVE, BookingStatus.RESERVED);
    }
}
