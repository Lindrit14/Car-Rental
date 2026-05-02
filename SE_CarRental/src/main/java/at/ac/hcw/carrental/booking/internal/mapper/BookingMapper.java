package at.ac.hcw.carrental.booking.internal.mapper;

import at.ac.hcw.carrental.booking.dto.BookingResponse;
import at.ac.hcw.carrental.booking.internal.model.BookingEntity;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;

@Mapper(componentModel = "spring")
public interface BookingMapper {
    BookingResponse toResponse(BookingEntity entity);

    @AfterMapping
    default void calculateTotalPrice(BookingEntity entity, @MappingTarget BookingResponse response) {
        if (entity.getStartDate() != null && entity.getEndDate() != null && entity.getDailyRate() != null) {
            long days = ChronoUnit.DAYS.between(entity.getStartDate(), entity.getEndDate());
            if (days <= 0) days = 1;
            response.setTotalPrice(entity.getDailyRate().multiply(BigDecimal.valueOf(days)));
        }
    }
}
