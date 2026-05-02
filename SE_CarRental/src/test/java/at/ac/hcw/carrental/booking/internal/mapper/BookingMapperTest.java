package at.ac.hcw.carrental.booking.internal.mapper;

import at.ac.hcw.carrental.booking.dto.BookingResponse;
import at.ac.hcw.carrental.booking.internal.model.BookingEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("BookingMapper.calculateTotalPrice (@AfterMapping)")
class BookingMapperTest {

    /**
     * The price-calculation logic lives in a {@code default} method on the
     * interface, so we exercise it via a no-op lambda implementation rather than
     * the MapStruct-generated impl. This keeps the test independent of the
     * annotation-processor pipeline.
     */
    private BookingMapper mapper;

    @BeforeEach
    void setup() {
        mapper = entity -> null;
    }

    @Test
    void calculateTotalPrice_setsTotalPrice_forMultiDayBooking() {
        BookingEntity entity = BookingEntity.builder()
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 6, 6))
                .dailyRate(new BigDecimal("40"))
                .build();
        BookingResponse response = BookingResponse.builder().build();

        mapper.calculateTotalPrice(entity, response);

        assertThat(response.getTotalPrice()).isEqualByComparingTo("200");
    }

    @Test
    void calculateTotalPrice_setsTotalPriceToOneDay_forSameDayBooking() {
        LocalDate sameDay = LocalDate.of(2026, 6, 1);
        BookingEntity entity = BookingEntity.builder()
                .startDate(sameDay)
                .endDate(sameDay)
                .dailyRate(new BigDecimal("40"))
                .build();
        BookingResponse response = BookingResponse.builder().build();

        mapper.calculateTotalPrice(entity, response);

        assertThat(response.getTotalPrice()).isEqualByComparingTo("40");
    }

    @Test
    void calculateTotalPrice_clampsToOneDay_whenEndBeforeStart() {
        BookingEntity entity = BookingEntity.builder()
                .startDate(LocalDate.of(2026, 6, 6))
                .endDate(LocalDate.of(2026, 6, 1))
                .dailyRate(new BigDecimal("40"))
                .build();
        BookingResponse response = BookingResponse.builder().build();

        mapper.calculateTotalPrice(entity, response);

        assertThat(response.getTotalPrice()).isEqualByComparingTo("40");
    }

    @Test
    void calculateTotalPrice_leavesTotalPriceNull_whenStartDateMissing() {
        BookingEntity entity = BookingEntity.builder()
                .endDate(LocalDate.of(2026, 6, 6))
                .dailyRate(new BigDecimal("40"))
                .build();
        BookingResponse response = BookingResponse.builder().build();

        mapper.calculateTotalPrice(entity, response);

        assertThat(response.getTotalPrice()).isNull();
    }

    @Test
    void calculateTotalPrice_leavesTotalPriceNull_whenDailyRateMissing() {
        BookingEntity entity = BookingEntity.builder()
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 6, 6))
                .build();
        BookingResponse response = BookingResponse.builder().build();

        mapper.calculateTotalPrice(entity, response);

        assertThat(response.getTotalPrice()).isNull();
    }
}
