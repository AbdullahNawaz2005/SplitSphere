package com.splitsphere.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.splitsphere.dto.auth.AuthResponse;
import com.splitsphere.dto.auth.GoogleLoginRequest;
import com.splitsphere.dto.auth.LoginRequest;
import com.splitsphere.dto.auth.RegisterRequest;
import com.splitsphere.dto.auth.UserResponse;
import com.splitsphere.entity.User;
import com.splitsphere.exception.ConflictException;
import com.splitsphere.exception.UnauthorizedException;
import com.splitsphere.repository.UserRepository;
import com.splitsphere.security.JwtService;
import com.splitsphere.security.UserPrincipal;
import com.splitsphere.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            @Value("${security.google.client-id}") String googleClientId
    ) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException("GOOGLE_CLIENT_ID must be set");
        }
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.googleIdTokenVerifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

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

    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleToken(request.idToken());
        String email = normalizeGoogleEmail(payload);
        Boolean emailVerified = payload.getEmailVerified();
        if (emailVerified != null && !emailVerified) {
            throw new UnauthorizedException("Google email is not verified");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> createGoogleUser(payload, email));

        String token = jwtService.generateToken(UserPrincipal.from(user));
        return new AuthResponse(token, "Bearer", jwtService.expiresInSeconds(), UserResponse.from(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        try {
            GoogleIdToken verifiedToken = googleIdTokenVerifier.verify(idToken);
            if (verifiedToken == null) {
                throw new UnauthorizedException("Invalid Google token");
            }
            return verifiedToken.getPayload();
        } catch (GeneralSecurityException | IOException | IllegalArgumentException ex) {
            throw new UnauthorizedException("Invalid Google token");
        }
    }

    private String normalizeGoogleEmail(GoogleIdToken.Payload payload) {
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Google token does not include an email address");
        }
        return normalizeEmail(email);
    }

    private User createGoogleUser(GoogleIdToken.Payload payload, String email) {
        User user = new User();
        String name = (String) payload.get("name");
        user.setName(InputSanitizer.cleanText(name == null || name.isBlank() ? email : name));
        user.setEmail(email);
        user.setAvatarUrl((String) payload.get("picture"));
        user.setPasswordHash(passwordEncoder.encode("GOOGLE:" + UUID.randomUUID()));
        return userRepository.save(user);
    }
}
