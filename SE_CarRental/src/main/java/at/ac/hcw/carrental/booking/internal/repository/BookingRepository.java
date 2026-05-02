package at.ac.hcw.carrental.booking.internal.repository;

import at.ac.hcw.carrental.booking.internal.model.BookingEntity;
import at.ac.hcw.carrental.booking.internal.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<BookingEntity, UUID> {
    boolean existsByCarId(UUID carId);
    List<BookingEntity> findAllByUserId(UUID userId);
    List<BookingEntity> findAllByStatusIn(List<BookingStatus> statuses);
    Optional<BookingEntity> findByCarId(UUID carId);
    Optional<BookingEntity> findByUserId(UUID userId);
    Optional<BookingEntity> findByIdAndStatusIn(UUID id, List<BookingStatus> statuses);
    boolean existsByCarIdAndStatusIn(UUID carId, List<BookingStatus> statuses);
    boolean existsByCarIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(UUID carId, List<BookingStatus> statuses, LocalDate startDate, LocalDate endDate);
}
