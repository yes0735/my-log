package com.mylog.domain.user.service;

import com.mylog.domain.user.entity.User;
import com.mylog.domain.user.repository.UserRepository;
import com.mylog.global.security.AesEncryptor;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = extractEmail(registrationId, attributes);
        String name = extractName(registrationId, attributes);
        String imageUrl = extractImageUrl(registrationId, attributes);
        String providerId = extractProviderId(registrationId, attributes);

        // Design Ref: §3.3 — emailHash-based lookup for OAuth2 users
        String emailHash = AesEncryptor.sha256(email);
        User user = userRepository.findByEmailHash(emailHash).orElse(null);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .emailHash(emailHash)
                    .nickname(name != null ? name : email.split("@")[0])
                    .profileImageUrl(imageUrl)
                    .provider(registrationId.toUpperCase())
                    .providerId(providerId)
                    .build();
            userRepository.save(user);
        }

        return new CustomOAuth2User(user, attributes);
    }

    @SuppressWarnings("unchecked")
    private String extractEmail(String provider, Map<String, Object> attrs) {
        if ("kakao".equals(provider)) {
            Map<String, Object> account = (Map<String, Object>) attrs.get("kakao_account");
            return account != null ? (String) account.get("email") : null;
        }
        return (String) attrs.get("email");
    }

    @SuppressWarnings("unchecked")
    private String extractName(String provider, Map<String, Object> attrs) {
        if ("kakao".equals(provider)) {
            Map<String, Object> properties = (Map<String, Object>) attrs.get("properties");
            return properties != null ? (String) properties.get("nickname") : null;
        }
        return (String) attrs.get("name");
    }

    @SuppressWarnings("unchecked")
    private String extractImageUrl(String provider, Map<String, Object> attrs) {
        if ("kakao".equals(provider)) {
            Map<String, Object> properties = (Map<String, Object>) attrs.get("properties");
            return properties != null ? (String) properties.get("profile_image") : null;
        }
        if ("github".equals(provider)) return (String) attrs.get("avatar_url");
        return (String) attrs.get("picture");
    }

    private String extractProviderId(String provider, Map<String, Object> attrs) {
        Object id = attrs.get("id");
        if ("kakao".equals(provider) && id != null) return id.toString();
        return attrs.get("sub") != null ? attrs.get("sub").toString() : (id != null ? id.toString() : null);
    }
}
