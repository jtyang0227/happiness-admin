package com.happiness.admin.security;

import com.happiness.admin.entity.Authority;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expirationSeconds;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = secret.getBytes();
        // ensure at least 256 bits for HS256
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters");
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String createToken(String email, Authority authority) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationSeconds * 1000);
        return Jwts.builder()
                .subject(email)
                .claim("authority", authority.name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getEmail(String token) {
        return getClaims(token).getSubject();
    }

    public Authority getAuthority(String token) {
        String auth = getClaims(token).get("authority", String.class);
        return Authority.valueOf(auth);
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }
}
