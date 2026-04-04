package com.mylog.domain.user.entity;

import com.mylog.global.common.BaseEntity;
import com.mylog.global.security.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.*;

// Design Ref: §3.1 — User entity
// Design Ref: §2.1 — email AES encrypted, email_hash for search
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(nullable = false)
    private String email;

    @Column(name = "email_hash", length = 64)
    private String emailHash;

    private String password;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String provider = "LOCAL";

    @Column(name = "provider_id")
    private String providerId;
}
