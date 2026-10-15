package com.depaya.pagos.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// Si el ADMIN no confirma el reembolso a tiempo, se aprueba solo.
@Slf4j
@Component
@RequiredArgsConstructor
public class ReembolsoAutomatico {

    private final PagoService pagoService;

    @Scheduled(fixedDelayString = "${depaya.reembolso.intervalo-ms:60000}", initialDelayString = "${depaya.reembolso.intervalo-ms:60000}")
    public void aprobarVencidos() {
        int n = pagoService.procesarReembolsosVencidos();
        if (n > 0) {
            log.info("{} reembolso(s) aprobado(s) automáticamente por vencer el plazo.", n);
        }
    }
}
