package com.depaya.auth.config;

import com.depaya.auth.model.Rol;
import com.depaya.auth.model.Usuario;
import com.depaya.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

// Datos de ejemplo. Todos los usuarios entran con la clave 123456.
@Slf4j
@Component
@RequiredArgsConstructor
public class DatosIniciales implements CommandLineRunner {

    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        if (repo.count() > 0) {
            return;
        }
        String clave = encoder.encode("123456");
        repo.saveAll(List.of(
                nuevo("Alonso", "Vargas", "DNI", "42891234", "avargas@gmail.com", "987654321", Rol.PROPIETARIO, clave),
                nuevo("Mariana", "Silva", "DNI", "70123456", "msilva@outlook.com", "912345678", Rol.PROPIETARIO, clave),
                nuevo("Roberto", "Mendoza", "CE", "001122334", "rmendoza@empresa.pe", "998877112", Rol.PROPIETARIO, clave),
                nuevo("Diego", "Rojas", "DNI", "72345678", "drojas@gmail.com", "998877665", Rol.INQUILINO, clave),
                nuevo("Valeria", "Campos", "CE", "000456789", "vcampos@yahoo.com", "956321478", Rol.INQUILINO, clave),
                nuevo("Camila", "Torres", "DNI", "76543210", "ctorres@hotmail.com", "945612378", Rol.INQUILINO, clave),
                nuevo("Administrador", "DepaYa", "DNI", "00000001", "admin@depaya.com", "900000000", Rol.ADMIN, clave)));
        log.info("Usuarios de ejemplo creados (clave 123456). Admin: admin@depaya.com");
    }

    private static Usuario nuevo(String nombre, String apellido, String tipoDoc, String numeroDoc,
                                 String correo, String telefono, Rol rol, String claveHash) {
        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setApellido(apellido);
        u.setTipoDocumento(tipoDoc);
        u.setNumeroDocumento(numeroDoc);
        u.setCorreo(correo);
        u.setTelefono(telefono);
        u.setRol(rol);
        u.setPassword(claveHash);
        return u;
    }
}
