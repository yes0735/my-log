package com.mylog.global.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.RequiredArgsConstructor;

// Design Ref: §5.2 — JPA @Converter for transparent AES encryption
@Converter
@RequiredArgsConstructor
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private final AesEncryptor aesEncryptor;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) return null;
        return aesEncryptor.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try {
            return aesEncryptor.decrypt(dbData);
        } catch (Exception e) {
            // Fallback: data is still plaintext (pre-migration)
            return dbData;
        }
    }
}
