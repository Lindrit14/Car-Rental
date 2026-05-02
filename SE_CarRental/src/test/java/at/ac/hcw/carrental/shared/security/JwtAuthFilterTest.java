package at.ac.hcw.carrental.shared.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthFilter")
class JwtAuthFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private UserDetailsService userDetailsService;
    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthFilter filter;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_setsAuthentication_forValidBearerToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.addHeader("Authorization", "Bearer good-token");

        UserDetails userDetails = new User(
                "alice@example.com",
                "pw",
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
        when(jwtTokenProvider.validateToken("good-token")).thenReturn(true);
        when(jwtTokenProvider.getEmailFromToken("good-token")).thenReturn("alice@example.com");
        when(userDetailsService.loadUserByUsername("alice@example.com")).thenReturn(userDetails);

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isSameAs(userDetails);
        assertThat(auth.getAuthorities())
                .extracting(a -> a.getAuthority())
                .containsExactly("ROLE_USER");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_skipsAuth_whenAuthorizationHeaderMissing() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtTokenProvider, never()).validateToken(anyString());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_skipsAuth_whenHeaderHasNoBearerPrefix() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.addHeader("Authorization", "Basic abc123");

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtTokenProvider, never()).validateToken(anyString());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_skipsAuth_whenTokenInvalid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.addHeader("Authorization", "Bearer bad-token");
        when(jwtTokenProvider.validateToken("bad-token")).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userDetailsService, never()).loadUserByUsername(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_alwaysCallsFilterChain() throws Exception {
        // Cover both branches in one test for the "always continue chain" invariant.
        MockHttpServletRequest req1 = new MockHttpServletRequest();
        MockHttpServletResponse res1 = new MockHttpServletResponse();
        filter.doFilterInternal(req1, res1, filterChain);
        verify(filterChain).doFilter(req1, res1);

        MockHttpServletRequest req2 = new MockHttpServletRequest();
        MockHttpServletResponse res2 = new MockHttpServletResponse();
        req2.addHeader("Authorization", "Bearer some-token");
        when(jwtTokenProvider.validateToken("some-token")).thenReturn(false);
        filter.doFilterInternal(req2, res2, filterChain);
        verify(filterChain).doFilter(req2, res2);
    }
}
