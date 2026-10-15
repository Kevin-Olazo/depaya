package com.depaya.reservas.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Respuestas de error con formato único.
@RestControllerAdvice
public class ManejadorErrores {

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, Object>> estado(ResponseStatusException e, HttpServletRequest req) {
        HttpStatus status = HttpStatus.valueOf(e.getStatusCode().value());
        String mensaje = e.getReason() != null ? e.getReason() : status.getReasonPhrase();
        return respuesta(status, mensaje, null, req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> validacion(MethodArgumentNotValidException e, HttpServletRequest req) {
        return respuesta(HttpStatus.BAD_REQUEST, "Datos inválidos.", errores(e), req);
    }

    @ExceptionHandler(BindException.class)
    ResponseEntity<Map<String, Object>> enlace(BindException e, HttpServletRequest req) {
        return respuesta(HttpStatus.BAD_REQUEST, "Parámetros inválidos.", errores(e), req);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<Map<String, Object>> restricciones(ConstraintViolationException e, HttpServletRequest req) {
        return respuesta(HttpStatus.BAD_REQUEST, e.getMessage(), null, req);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> cuerpoInvalido(HttpMessageNotReadableException e, HttpServletRequest req) {
        return respuesta(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud es inválido o tiene valores no permitidos.", null, req);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    ResponseEntity<Map<String, Object>> parametro(Exception e, HttpServletRequest req) {
        return respuesta(HttpStatus.BAD_REQUEST, "Parámetro faltante o con formato inválido.", null, req);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, Object>> integridad(DataIntegrityViolationException e, HttpServletRequest req) {
        return respuesta(HttpStatus.CONFLICT, "Los datos entran en conflicto con registros existentes.", null, req);
    }

    private static List<Map<String, String>> errores(BindException e) {
        return e.getBindingResult().getFieldErrors().stream()
                .map((FieldError f) -> Map.of(
                        "campo", f.getField(),
                        "mensaje", f.getDefaultMessage() == null ? "inválido" : f.getDefaultMessage()))
                .toList();
    }

    private static ResponseEntity<Map<String, Object>> respuesta(
            HttpStatus status, String mensaje, Object errores, HttpServletRequest req) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("timestamp", LocalDateTime.now().toString());
        cuerpo.put("status", status.value());
        cuerpo.put("error", status.getReasonPhrase());
        cuerpo.put("mensaje", mensaje);
        if (errores != null) {
            cuerpo.put("errores", errores);
        }
        cuerpo.put("ruta", req.getRequestURI());
        return ResponseEntity.status(status).body(cuerpo);
    }
}
