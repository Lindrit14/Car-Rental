package at.ac.hcw.carrental.car;

import at.ac.hcw.carrental.car.dto.*;
import at.ac.hcw.carrental.car.internal.mapper.CarMapper;
import at.ac.hcw.carrental.car.internal.model.CarEntity;
import at.ac.hcw.carrental.car.internal.repository.CarRepository;
import at.ac.hcw.carrental.currency.CurrencyService;
import at.ac.hcw.carrental.shared.exception.DuplicateResourceException;
import at.ac.hcw.carrental.shared.exception.InvalidRequestException;
import at.ac.hcw.carrental.shared.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository repository;
    private final CarMapper mapper;
    private final ObjectMapper patchMapper;
    private final CurrencyService currencyService;

    @Transactional
    public CarResponse create(CreateCarRequest request){

        if(repository.existsByLicensePlate(request.getLicensePlate())){
            throw new DuplicateResourceException("Duplicate license plates not allowed");
        }

        CarEntity entity = CarEntity.builder()
                .brand(request.getBrand())
                .model(request.getModel())
                .carType(request.getCarType())
                .licensePlate(request.getLicensePlate())
                .year(request.getYear())
                .dailyRate(request.getDailyRate())
                .location(request.getLocation())
                .seats(request.getSeats())
                .transmissionType(request.getTransmissionType())
                .largeLuggage(request.getLargeLuggage())
                .smallLuggage(request.getSmallLuggage())
                .build();

        return mapper.toResponse(repository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<CarResponse> getCarsByTypeAndLocation(CarType type, String location){
        return repository.findByCarTypeAndLocation(type, location)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public CarResponse updateCar(UUID carId, UpdateCarRequest request) throws JsonMappingException {

        CarEntity entity = repository.findById(carId)
                .orElseThrow(() -> new ResourceNotFoundException("Car with id " + carId + " does not exist"));

        patchMapper.updateValue(entity, request);

        return mapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<CarResponse> getAllCars(){
        return repository.findAll()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public void deleteCar(UUID carId){
        if (repository.existsById(carId)){
            repository.deleteById(carId);
        } else  {
            throw new ResourceNotFoundException("Car with id " + carId + " does not exist");
        }
    }

    @Transactional(readOnly = true)
    public CarPriceResponse getCarPrice(UUID carId, LocalDate startDate, LocalDate endDate, String currency){

        CarEntity entity = repository.findById(carId)
                .orElseThrow(() -> new ResourceNotFoundException("Car with id " + carId + " does not exist"));

        if(startDate.isAfter(endDate)){
            throw new InvalidRequestException("Start date cannot be after the end date");
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate);
        if (days <= 0) days = 1;

        BigDecimal dailyRate = currency.equals("USD") ? entity.getDailyRate() : currencyService.convertDailyRate(entity.getDailyRate(), currency);
        BigDecimal price = dailyRate.multiply(BigDecimal.valueOf(days));

        return CarPriceResponse.builder()
                .carId(carId)
                .startDate(startDate)
                .endDate(endDate)
                .days(days)
                .dailyRate(dailyRate)
                .price(price)
                .currency(currency)
                .build();
    }

    @Transactional(readOnly = true)
    public CarResponse getCar(UUID carId){

        CarEntity entity = repository.findById(carId)
                .orElseThrow(() -> new ResourceNotFoundException("Car with id " + carId + " does not exist"));

        return mapper.toResponse(entity);
    }

    public BigDecimal getCheapestDailyRate(CarType type, String location) {
        return repository.findByCarTypeAndLocation(type, location)
                .stream()
                .map(CarEntity::getDailyRate)
                .min(BigDecimal::compareTo)
                .orElseThrow(() -> new ResourceNotFoundException("No cars found for type " + type));
    }

}
