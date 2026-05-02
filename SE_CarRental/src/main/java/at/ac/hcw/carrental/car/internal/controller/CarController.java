package at.ac.hcw.carrental.car.internal.controller;

import at.ac.hcw.carrental.car.CarService;
import at.ac.hcw.carrental.car.dto.*;
import com.fasterxml.jackson.databind.JsonMappingException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/car")
@RequiredArgsConstructor
@Tag(name = "Car", description = "Manage cars")
public class CarController {

    private final CarService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new car")
    public CarResponse create(@Valid @RequestBody CreateCarRequest request) {
        return service.create(request);
    }

    @GetMapping
    @Operation(summary = "Get all cars")
    public List<CarResponse> getAllCars() {
        return service.getAllCars();
    }

    @GetMapping("/{carId}")
    @Operation(summary = "Get car by ID")
    public CarResponse getCar(@PathVariable UUID carId) {
        return service.getCar(carId);
    }

    @GetMapping("/type/{carType}")
    @Operation(summary = "Get all cars by type")
    public List<CarResponse> getCarsByType(@PathVariable CarType carType, @RequestParam(required = false) String location) {
        return service.getCarsByTypeAndLocation(carType, location);
    }

    @GetMapping("/{carId}/price")
    @Operation(summary = "Calculate price for a car rental period")
    public CarPriceResponse getPrice(
            @PathVariable UUID carId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(defaultValue = "USD") String currency) {
        return service.getCarPrice(carId, startDate, endDate, currency);
    }

    @PatchMapping("/{carId}")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Update information of a car")
    public CarResponse update(@PathVariable UUID carId, @Valid @RequestBody UpdateCarRequest request) throws JsonMappingException {
        return service.updateCar(carId, request);
    }

    @DeleteMapping("/{carId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a car")
    public void delete(@PathVariable UUID carId) {
        service.deleteCar(carId);
    }
}