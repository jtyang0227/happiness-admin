package com.happiness.admin.privacy;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** 엔티티 필드에 `@Convert(converter = EncryptedStringConverter.class)`로 붙이면 저장 시 암호화, 조회 시 복호화. */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return FieldEncryptor.get().encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return FieldEncryptor.get().decrypt(dbData);
    }
}
