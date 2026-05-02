package at.ac.hcw.carrental.user.internal.mapper;

import at.ac.hcw.carrental.user.dto.UserResponse;
import at.ac.hcw.carrental.user.internal.model.UserEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(UserEntity entity);
}
