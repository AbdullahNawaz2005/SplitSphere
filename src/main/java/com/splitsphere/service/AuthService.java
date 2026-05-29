package com.splitsphere.service;

import com.splitsphere.dto.auth.AuthResponse;
import com.splitsphere.dto.auth.LoginRequest;
import com.splitsphere.dto.auth.RegisterRequest;
import com.splitsphere.dto.auth.UserResponse;
import com.splitsphere.entity.User;
import com.splitsphere.exception.ConflictException;
import com.splitsphere.repository.UserRepository;
import com.splitsphere.security.JwtService;
import com.splitsphere.security.UserPrincipal;
import com.splitsphere.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email is already registered");
        }

        User user = new User();
        user.setName(InputSanitizer.cleanText(request.name()));
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = userRepository.save(user);

        String token = jwtService.generateToken(UserPrincipal.from(user));
        return new AuthResponse(token, "Bearer", jwtService.expiresInSeconds(), UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
        );
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ConflictException("Account is unavailable"));
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, "Bearer", jwtService.expiresInSeconds(), UserResponse.from(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
