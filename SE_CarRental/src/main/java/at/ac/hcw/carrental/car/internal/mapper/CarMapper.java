package at.ac.hcw.carrental.car.internal.mapper;

import at.ac.hcw.carrental.car.dto.CarResponse;
import at.ac.hcw.carrental.car.internal.model.CarEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CarMapper {

    CarResponse toResponse(CarEntity entity);

}
