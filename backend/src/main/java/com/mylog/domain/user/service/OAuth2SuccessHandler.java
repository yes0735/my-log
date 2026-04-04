package com.mylog.domain.user.service;

import com.mylog.domain.user.dto.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

// Design Ref: §6.1 — OAuth2 login also creates DB-managed refresh token
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserService userService;

    public OAuth2SuccessHandler(@Lazy UserService userService) {
        this.userService = userService;
    }

    @Value("${oauth.redirect-base:http://localhost:5173}")
    private String redirectBase;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        var user = oAuth2User.getUser();

        TokenResponse tokens = userService.createTokenResponse(user);

        String redirectUrl = redirectBase + "/oauth/callback?accessToken=" + tokens.getAccessToken()
                + "&refreshToken=" + tokens.getRefreshToken();
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
