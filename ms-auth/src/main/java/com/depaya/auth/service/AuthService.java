package com.depaya.auth.service;

import com.depaya.auth.dto.AuthRespuestaDTO;
import com.depaya.auth.dto.LoginDTO;
import com.depaya.auth.dto.UsuarioCrearDTO;
import com.depaya.auth.dto.UsuarioDTO;
import com.depaya.auth.model.Rol;
import com.depaya.auth.model.Usuario;
import com.depaya.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final UsuarioService usuarioService;

    public AuthRespuestaDTO login(LoginDTO dto) {
        Usuario u = repo.findByCorreoIgnoreCase(dto.getCorreo().trim()).orElse(null);
        if (u == null || !encoder.matches(dto.getPassword(), u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos.");
        }
        if (!u.isActivo()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta está desactivada. Contacta al administrador.");
        }
        return respuesta(u);
    }

    // Registro público: solo INQUILINO o PROPIETARIO. Devuelve el token.
    public AuthRespuestaDTO registro(UsuarioCrearDTO dto) {
        if (dto.getRol() == Rol.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo puedes registrarte como INQUILINO o PROPIETARIO.");
        }
        UsuarioDTO creado = usuarioService.crear(dto);
        Usuario u = repo.findById(creado.getId()).orElseThrow();
        return respuesta(u);
    }

    private AuthRespuestaDTO respuesta(Usuario u) {
        return new AuthRespuestaDTO(jwt.generar(u), "Bearer", jwt.expiraEnSegundos(), UsuarioService.aDTO(u));
    }
}
