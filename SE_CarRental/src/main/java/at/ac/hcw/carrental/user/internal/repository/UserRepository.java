package at.ac.hcw.carrental.user.internal.repository;

import at.ac.hcw.carrental.user.internal.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
}
