package at.ac.hcw.carrental.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("JwtTokenProvider")
class JwtTokenProviderTest {

    private static final String SECRET =
            "test-secret-key-that-is-definitely-long-enough-for-hmac-sha256!";
    private static final long EXPIRATION_MS = 60_000L;

    private JwtTokenProvider provider;

    @BeforeEach
    void setup() {
        provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(provider, "jwtExpirationMs", EXPIRATION_MS);
        provider.init();
    }

    private Authentication mockAuthentication(String email, String role) {
        UserDetails userDetails = new User(email, "pw", List.of(new SimpleGrantedAuthority(role)));
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        return auth;
    }

    @Test
    void generateToken_thenGetEmail_roundTrip() {
        String token = provider.generateToken(mockAuthentication("alice@example.com", "ROLE_USER"));

        assertThat(provider.getEmailFromToken(token)).isEqualTo("alice@example.com");
    }

    @Test
    void generateToken_includesRoleClaim() {
        String token = provider.generateToken(mockAuthentication("admin@example.com", "ROLE_ADMIN"));

        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertThat(claims.getSubject()).isEqualTo("admin@example.com");
        assertThat(claims.get("role", String.class)).isEqualTo("ROLE_ADMIN");
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isAfter(new Date());
    }

    @Test
    void validateToken_returnsTrue_forFreshToken() {
        String token = provider.generateToken(mockAuthentication("alice@example.com", "ROLE_USER"));

        assertThat(provider.validateToken(token)).isTrue();
    }

    @Test
    void validateToken_returnsFalse_forExpiredToken() {
        ReflectionTestUtils.setField(provider, "jwtExpirationMs", -1000L);
        String token = provider.generateToken(mockAuthentication("alice@example.com", "ROLE_USER"));

        assertThat(provider.validateToken(token)).isFalse();
    }

    @Test
    void validateToken_returnsFalse_forTamperedSignature() {
        String token = provider.generateToken(mockAuthentication("alice@example.com", "ROLE_USER"));
        // mutate last char (signature segment)
        char last = token.charAt(token.length() - 1);
        char swapped = (last == 'A') ? 'B' : 'A';
        String tampered = token.substring(0, token.length() - 1) + swapped;

        assertThat(provider.validateToken(tampered)).isFalse();
    }

    @Test
    void validateToken_returnsFalse_forMalformedToken() {
        assertThat(provider.validateToken("not.a.jwt")).isFalse();
        assertThat(provider.validateToken("garbage")).isFalse();
    }

    @Test
    void validateToken_returnsFalse_forNullOrEmpty() {
        assertThat(provider.validateToken(null)).isFalse();
        assertThat(provider.validateToken("")).isFalse();
    }

    @Test
    void validateToken_returnsFalse_forTokenSignedWithDifferentSecret() {
        SecretKey otherKey = Keys.hmacShaKeyFor(
                "completely-different-secret-key-also-long-enough-for-hs256!".getBytes(StandardCharsets.UTF_8));
        String foreignToken = Jwts.builder()
                .subject("alice@example.com")
                .claim("role", "ROLE_USER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(otherKey)
                .compact();

        assertThat(provider.validateToken(foreignToken)).isFalse();
    }
}
