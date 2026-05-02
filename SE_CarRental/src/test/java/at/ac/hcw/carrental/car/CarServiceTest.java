package at.ac.hcw.carrental.car;

import at.ac.hcw.carrental.car.dto.CarPriceResponse;
import at.ac.hcw.carrental.car.dto.CarResponse;
import at.ac.hcw.carrental.car.dto.CarType;
import at.ac.hcw.carrental.car.dto.CreateCarRequest;
import at.ac.hcw.carrental.car.dto.UpdateCarRequest;
import at.ac.hcw.carrental.car.internal.mapper.CarMapper;
import at.ac.hcw.carrental.car.internal.model.CarEntity;
import at.ac.hcw.carrental.car.internal.repository.CarRepository;
import at.ac.hcw.carrental.currency.CurrencyService;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CarService")
class CarServiceTest {

    @Mock
    private CarRepository repository;
    @Mock
    private CarMapper mapper;
    @Mock
    private ObjectMapper patchMapper;
    @Mock
    private CurrencyService currencyService;

    @InjectMocks
    private CarService service;

    private CreateCarRequest createRequest;

    @BeforeEach
    void setup() {
        createRequest = new CreateCarRequest();
        createRequest.setBrand("Toyota");
        createRequest.setModel("Corolla");
        createRequest.setLicensePlate("W-12345");
        createRequest.setYear(2024);
        createRequest.setDailyRate(new BigDecimal("50"));
        createRequest.setCarType(CarType.ECONOMY);
        createRequest.setLocation("Vienna");
        createRequest.setSeats(5);
        createRequest.setTransmissionType(CarEntity.TransmissionType.AUTOMATIC);
        createRequest.setLargeLuggage(2);
        createRequest.setSmallLuggage(3);
    }

    // ---------- create ----------

    @Test
    void create_savesAndReturnsMapped_whenLicensePlateIsUnique() {
        when(repository.existsByLicensePlate("W-12345")).thenReturn(false);
        when(repository.save(any(CarEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        CarResponse mapped = CarResponse.builder().build();
        when(mapper.toResponse(any(CarEntity.class))).thenReturn(mapped);

        CarResponse result = service.create(createRequest);

        assertThat(result).isSameAs(mapped);

        ArgumentCaptor<CarEntity> captor = ArgumentCaptor.forClass(CarEntity.class);
        verify(repository).save(captor.capture());
        CarEntity saved = captor.getValue();
        assertThat(saved.getBrand()).isEqualTo("Toyota");
        assertThat(saved.getModel()).isEqualTo("Corolla");
        assertThat(saved.getLicensePlate()).isEqualTo("W-12345");
        assertThat(saved.getYear()).isEqualTo(2024);
        assertThat(saved.getDailyRate()).isEqualByComparingTo("50");
        assertThat(saved.getCarType()).isEqualTo(CarType.ECONOMY);
        assertThat(saved.getLocation()).isEqualTo("Vienna");
        assertThat(saved.getSeats()).isEqualTo(5);
        assertThat(saved.getTransmissionType()).isEqualTo(CarEntity.TransmissionType.AUTOMATIC);
        assertThat(saved.getLargeLuggage()).isEqualTo(2);
        assertThat(saved.getSmallLuggage()).isEqualTo(3);
    }

    @Test
    void create_throwsIllegalArgument_whenLicensePlateExists() {
        when(repository.existsByLicensePlate("W-12345")).thenReturn(true);

        assertThatThrownBy(() -> service.create(createRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("license");

        verify(repository, never()).save(any());
    }

    // ---------- getCarsByTypeAndLocation ----------

    @Test
    void getCarsByTypeAndLocation_returnsMappedList() {
        CarEntity e1 = CarEntity.builder().build();
        CarEntity e2 = CarEntity.builder().build();
        CarResponse r1 = CarResponse.builder().build();
        CarResponse r2 = CarResponse.builder().build();

        when(repository.findByCarTypeAndLocation(CarType.SUV, "Vienna")).thenReturn(List.of(e1, e2));
        when(mapper.toResponse(e1)).thenReturn(r1);
        when(mapper.toResponse(e2)).thenReturn(r2);

        List<CarResponse> result = service.getCarsByTypeAndLocation(CarType.SUV, "Vienna");

        assertThat(result).containsExactly(r1, r2);
    }

    // ---------- updateCar ----------

    @Test
    void updateCar_appliesPatchToExistingEntity() throws JsonMappingException {
        UUID carId = UUID.randomUUID();
        CarEntity entity = CarEntity.builder().id(carId).build();
        UpdateCarRequest req = new UpdateCarRequest();
        when(repository.findById(carId)).thenReturn(Optional.of(entity));
        when(mapper.toResponse(entity)).thenReturn(CarResponse.builder().build());

        service.updateCar(carId, req);

        verify(patchMapper).updateValue(entity, req);
    }

    @Test
    void updateCar_throwsIllegalArgument_whenMissing() {
        UUID carId = UUID.randomUUID();
        when(repository.findById(carId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateCar(carId, new UpdateCarRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(carId.toString());
    }

    // ---------- getAllCars ----------

    @Test
    void getAllCars_returnsAllMapped() {
        CarEntity e1 = CarEntity.builder().build();
        CarResponse r1 = CarResponse.builder().build();
        when(repository.findAll()).thenReturn(List.of(e1));
        when(mapper.toResponse(e1)).thenReturn(r1);

        assertThat(service.getAllCars()).containsExactly(r1);
    }

    // ---------- deleteCar ----------

    @Test
    void deleteCar_deletes_whenExists() {
        UUID carId = UUID.randomUUID();
        when(repository.existsById(carId)).thenReturn(true);

        service.deleteCar(carId);

        verify(repository).deleteById(carId);
    }

    @Test
    void deleteCar_throwsIllegalArgument_whenMissing() {
        UUID carId = UUID.randomUUID();
        when(repository.existsById(carId)).thenReturn(false);

        assertThatThrownBy(() -> service.deleteCar(carId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(carId.toString());

        verify(repository, never()).deleteById(any(UUID.class));
    }

    // ---------- getCarPrice ----------

    @Test
    void getCarPrice_usesUsdRateDirectly_whenCurrencyIsUsd() {
        UUID carId = UUID.randomUUID();
        CarEntity entity = CarEntity.builder().id(carId).dailyRate(new BigDecimal("60")).build();
        when(repository.findById(carId)).thenReturn(Optional.of(entity));

        LocalDate start = LocalDate.of(2026, 6, 1);
        LocalDate end = LocalDate.of(2026, 6, 4);

        CarPriceResponse result = service.getCarPrice(carId, start, end, "USD");

        assertThat(result.getCurrency()).isEqualTo("USD");
        assertThat(result.getDays()).isEqualTo(3L);
        assertThat(result.getDailyRate()).isEqualByComparingTo("60");
        assertThat(result.getPrice()).isEqualByComparingTo("180");
        verify(currencyService, never()).convertDailyRate(any(), any());
    }

    @Test
    void getCarPrice_convertsRate_whenCurrencyIsForeign() {
        UUID carId = UUID.randomUUID();
        CarEntity entity = CarEntity.builder().id(carId).dailyRate(new BigDecimal("100")).build();
        when(repository.findById(carId)).thenReturn(Optional.of(entity));
        when(currencyService.convertDailyRate(new BigDecimal("100"), "EUR"))
                .thenReturn(new BigDecimal("90"));

        LocalDate start = LocalDate.of(2026, 6, 1);
        LocalDate end = LocalDate.of(2026, 6, 3);

        CarPriceResponse result = service.getCarPrice(carId, start, end, "EUR");

        assertThat(result.getCurrency()).isEqualTo("EUR");
        assertThat(result.getDailyRate()).isEqualByComparingTo("90");
        assertThat(result.getPrice()).isEqualByComparingTo("180");
    }

    @Test
    void getCarPrice_clampsDaysToMinimumOne_forSameDayRange() {
        UUID carId = UUID.randomUUID();
        CarEntity entity = CarEntity.builder().id(carId).dailyRate(new BigDecimal("75")).build();
        when(repository.findById(carId)).thenReturn(Optional.of(entity));

        LocalDate sameDay = LocalDate.of(2026, 6, 1);

        CarPriceResponse result = service.getCarPrice(carId, sameDay, sameDay, "USD");

        assertThat(result.getDays()).isEqualTo(1L);
        assertThat(result.getPrice()).isEqualByComparingTo("75");
    }

    @Test
    void getCarPrice_calculatesDaysCorrectly_forMultiDayRange() {
        UUID carId = UUID.randomUUID();
        CarEntity entity = CarEntity.builder().id(carId).dailyRate(new BigDecimal("40")).build();
        when(repository.findById(carId)).thenReturn(Optional.of(entity));

        LocalDate start = LocalDate.of(2026, 6, 1);
        LocalDate end = LocalDate.of(2026, 6, 8);

        CarPriceResponse result = service.getCarPrice(carId, start, end, "USD");

        assertThat(result.getDays()).isEqualTo(7L);
        assertThat(result.getPrice()).isEqualByComparingTo("280");
    }

    @Test
    void getCarPrice_throwsIllegalArgument_whenStartAfterEnd() {
        UUID carId = UUID.randomUUID();
        CarEntity entity = CarEntity.builder().id(carId).dailyRate(new BigDecimal("40")).build();
        when(repository.findById(carId)).thenReturn(Optional.of(entity));

        LocalDate start = LocalDate.of(2026, 6, 8);
        LocalDate end = LocalDate.of(2026, 6, 1);

        assertThatThrownBy(() -> service.getCarPrice(carId, start, end, "USD"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date");
    }

    @Test
    void getCarPrice_throwsIllegalArgument_whenCarMissing() {
        UUID carId = UUID.randomUUID();
        when(repository.findById(carId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCarPrice(carId, LocalDate.now(), LocalDate.now().plusDays(1), "USD"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(carId.toString());
    }

    // ---------- getCar ----------

    @Test
    void getCar_returnsMapped_whenFound() {
        UUID carId = UUID.randomUUID();
        CarEntity entity = CarEntity.builder().id(carId).build();
        CarResponse mapped = CarResponse.builder().id(carId).build();
        when(repository.findById(carId)).thenReturn(Optional.of(entity));
        when(mapper.toResponse(entity)).thenReturn(mapped);

        assertThat(service.getCar(carId)).isSameAs(mapped);
    }

    @Test
    void getCar_throwsIllegalArgument_whenMissing() {
        UUID carId = UUID.randomUUID();
        when(repository.findById(carId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCar(carId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(carId.toString());
    }

    // ---------- getCheapestDailyRate ----------

    @Test
    void getCheapestDailyRate_returnsMinimum_whenMultipleCars() {
        CarEntity c1 = CarEntity.builder().dailyRate(new BigDecimal("50")).build();
        CarEntity c2 = CarEntity.builder().dailyRate(new BigDecimal("30")).build();
        CarEntity c3 = CarEntity.builder().dailyRate(new BigDecimal("80")).build();
        when(repository.findByCarTypeAndLocation(eq(CarType.SUV), eq("Vienna")))
                .thenReturn(List.of(c1, c2, c3));

        BigDecimal result = service.getCheapestDailyRate(CarType.SUV, "Vienna");

        assertThat(result).isEqualByComparingTo("30");
    }

    @Test
    void getCheapestDailyRate_throwsIllegalArgument_whenNoCars() {
        when(repository.findByCarTypeAndLocation(eq(CarType.SUV), eq("Vienna"))).thenReturn(List.of());

        assertThatThrownBy(() -> service.getCheapestDailyRate(CarType.SUV, "Vienna"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No cars");
    }
}
