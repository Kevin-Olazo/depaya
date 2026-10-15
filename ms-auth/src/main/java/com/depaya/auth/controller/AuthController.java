package com.depaya.auth.controller;

import com.depaya.auth.config.UsuarioActual;
import com.depaya.auth.dto.AuthRespuestaDTO;
import com.depaya.auth.dto.LoginDTO;
import com.depaya.auth.dto.UsuarioCrearDTO;
import com.depaya.auth.dto.UsuarioDTO;
import com.depaya.auth.service.AuthService;
import com.depaya.auth.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public AuthRespuestaDTO login(@Valid @RequestBody LoginDTO dto) {
        return authService.login(dto);
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthRespuestaDTO registro(@Valid @RequestBody UsuarioCrearDTO dto) {
        return authService.registro(dto);
    }

    @GetMapping("/me")
    public UsuarioDTO me(@AuthenticationPrincipal Jwt jwt) {
        return usuarioService.obtener(UsuarioActual.de(jwt).getId());
    }
}
