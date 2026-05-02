package at.ac.hcw.carrental.car.internal.repository;

import at.ac.hcw.carrental.car.dto.CarType;
import at.ac.hcw.carrental.car.internal.model.CarEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CarRepository extends JpaRepository<CarEntity, UUID> {
    boolean existsByLicensePlate(String licensePlate);
    List<CarEntity> findByCarTypeAndLocation(CarType carType, String location);
    List<CarEntity> findByCarType(CarType carType);
}
