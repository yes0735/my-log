package com.mylog.domain.user.service;

import com.mylog.domain.user.dto.*;
import com.mylog.domain.user.entity.RefreshToken;
import com.mylog.domain.user.entity.User;
import com.mylog.domain.user.repository.RefreshTokenRepository;
import com.mylog.domain.user.repository.UserRepository;
import com.mylog.global.auth.JwtTokenProvider;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import com.mylog.global.security.AesEncryptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

// Design Ref: §4.2 — Auth service: signup, login, token refresh
// Design Ref: §3.3 — emailHash-based lookup for encrypted email
// Design Ref: §6 — Refresh Token DB management with Token Rotation
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpirationMs;

    @Transactional
    public TokenResponse signup(SignupRequest request) {
        // Plan SC: email_hash로 중복 체크
        String emailHash = AesEncryptor.sha256(request.getEmail());
        if (userRepository.existsByEmailHash(emailHash)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        User user = User.builder()
                .email(request.getEmail())
                .emailHash(emailHash)
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .provider("LOCAL")
                .build();

        userRepository.save(user);

        return createTokenResponse(user);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        // Plan SC: email_hash로 사용자 조회 (암호화된 email 직접 검색 불가)
        String emailHash = AesEncryptor.sha256(request.getEmail());
        User user = userRepository.findByEmailHash(emailHash)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        return createTokenResponse(user);
    }

    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_REQUIRED));
        return UserResponse.from(user);
    }

    // Design Ref: §3.1 — DB-based refresh token with Token Rotation
    // Plan SC: Access Token 만료 → Refresh Token으로 자동 갱신 → 요청 재시도
    @Transactional
    public TokenResponse refreshToken(String tokenString) {
        RefreshToken stored = refreshTokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new BusinessException(ErrorCode.TOKEN_EXPIRED));

        if (stored.isExpired()) {
            refreshTokenRepository.delete(stored);
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_REQUIRED));

        // Token Rotation: delete old, create new
        refreshTokenRepository.delete(stored);

        return createTokenResponse(user);
    }

    // Design Ref: §3.2 — Logout: delete all refresh tokens for user
    // Plan SC: 로그아웃 버튼 클릭 → Refresh Token 무효화 → /login 이동
    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Transactional
    public TokenResponse createTokenResponse(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());

        // Create UUID-based refresh token and store in DB
        String refreshTokenUuid = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshTokenUuid)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenUuid)
                .user(UserResponse.from(user))
                .build();
    }
}
