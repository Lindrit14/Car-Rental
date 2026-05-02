package at.ac.hcw.carrental.shared.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class PatchMapperConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public ObjectMapper patchMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.setDefaultPropertyInclusion(JsonInclude.Include.NON_NULL);
        return mapper;
    }
}
