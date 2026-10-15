package com.depaya.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginDTO {

    @NotBlank(message = "El correo es obligatorio.")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria.")
    private String password;
}
