import { nombreDeArchivo } from '../services/descargas.service';
import { Ocupada } from '../models/api.models';
import { aIso, chocan, deIso, nochesEntre, sumarDias, tiempoRestante } from './fechas';
import { construirParams } from './http-params';
import { destinoSeguro } from './navegacion';
import { crearOcupacion } from './ocupacion';

describe('fechas', () => {
  it('aIso y deIso son inversas y usan la fecha local', () => {
    const f = new Date(2027, 0, 5);
    expect(aIso(f)).toBe('2027-01-05');
    expect(aIso(deIso('2027-01-05'))).toBe('2027-01-05');
    expect(deIso('2027-01-05T10:20:30').getDate()).toBe(5);
  });

  it('cuenta las noches entre dos fechas (también cruzando mes y año)', () => {
    expect(nochesEntre(deIso('2026-10-24'), deIso('2026-10-29'))).toBe(5);
    expect(nochesEntre(deIso('2026-12-30'), deIso('2027-01-02'))).toBe(3);
    expect(nochesEntre(deIso('2027-03-01'), deIso('2027-03-01'))).toBe(0);
  });

  it('el rango [ingreso, salida) deja libre la fecha de salida', () => {
    const a = [deIso('2026-10-24'), deIso('2026-10-29')] as const;
    expect(chocan(deIso('2026-10-29'), deIso('2026-11-01'), ...a)).toBe(false); // ingresa el día que otro sale
    expect(chocan(deIso('2026-10-20'), deIso('2026-10-24'), ...a)).toBe(false); // sale el día que otro ingresa
    expect(chocan(deIso('2026-10-28'), deIso('2026-10-30'), ...a)).toBe(true);
    expect(chocan(deIso('2026-10-25'), deIso('2026-10-26'), ...a)).toBe(true);
  });

  it('sumarDias', () => {
    expect(aIso(sumarDias(deIso('2026-12-31'), 1))).toBe('2027-01-01');
  });

  it('tiempoRestante indica si queda tiempo o ya venció', () => {
    expect(tiempoRestante(new Date(Date.now() + 5 * 3_600_000 + 30_000).toISOString())).toContain('quedan 5 h');
    expect(tiempoRestante(new Date(Date.now() - 2 * 3_600_000 - 30_000).toISOString())).toContain('vencido hace 2 h');
    expect(tiempoRestante(null)).toBe('');
  });
});

describe('construirParams', () => {
  it('omite valores vacíos y convierte fechas, números y booleanos', () => {
    const p = construirParams({ q: '', distrito: null, wifi: true, precioMax: 500, desde: undefined, page: 0, size: 12 }, { sort: 'precioNoche,asc', x: Number.NaN });
    expect(p.keys().sort()).toEqual(['page', 'precioMax', 'size', 'sort', 'wifi']);
    expect(p.get('wifi')).toBe('true');
    expect(p.get('page')).toBe('0');
    expect(p.get('sort')).toBe('precioNoche,asc');
  });

  it('convierte un Date a yyyy-MM-dd', () => {
    expect(construirParams({ desde: new Date(2027, 0, 10) }).get('desde')).toBe('2027-01-10');
  });
});

describe('nombreDeArchivo (Content-Disposition)', () => {
  it('lee filename="..."', () => {
    expect(nombreDeArchivo('attachment; filename="reservas.csv"', 'x.csv')).toBe('reservas.csv');
  });
  it('lee filename*=UTF-8\'\'...', () => {
    expect(nombreDeArchivo("attachment; filename*=UTF-8''pagos%20de%20octubre.csv", 'x.csv')).toBe('pagos de octubre.csv');
  });
  it('usa el nombre alternativo si no hay cabecera', () => {
    expect(nombreDeArchivo(null, 'usuarios.csv')).toBe('usuarios.csv');
    expect(nombreDeArchivo('inline', 'usuarios.csv')).toBe('usuarios.csv');
  });
});

describe('destinoSeguro', () => {
  it('acepta rutas internas y rechaza direcciones externas', () => {
    expect(destinoSeguro('/huesped/reservar/3?ingreso=2027-01-10')).toBe('/huesped/reservar/3?ingreso=2027-01-10');
    expect(destinoSeguro('https://malo.com')).toBeNull();
    expect(destinoSeguro('//malo.com')).toBeNull();
    expect(destinoSeguro('/\\malo.com')).toBeNull();
    expect(destinoSeguro(undefined)).toBeNull();
  });
});

describe('Ocupacion (calendario)', () => {
  const ocupadas: Ocupada[] = [
    { fechaIngreso: '2026-10-24', fechaSalida: '2026-10-27', estado: 'CONFIRMADA' },
    { fechaIngreso: '2026-11-03', fechaSalida: '2026-11-05', estado: 'PENDIENTE' },
  ];

  it('marca como ocupadas las noches [ingreso, salida) y deja libre la salida', () => {
    const o = crearOcupacion(ocupadas);
    expect(o.nocheOcupada(deIso('2026-10-24'))).toBe(true);
    expect(o.nocheOcupada(deIso('2026-10-26'))).toBe(true);
    expect(o.nocheOcupada(deIso('2026-10-27'))).toBe(false);
    expect(o.nocheOcupada({ year: 2026, month: 10, day: 3 })).toBe(true); // noviembre = mes 10
  });

  it('bloquea solo los días interiores (noche propia y anterior ocupadas)', () => {
    const o = crearOcupacion(ocupadas);
    expect(o.bloqueadas.map(aIso)).toEqual(['2026-10-25', '2026-10-26', '2026-11-04']);
  });

  it('detecta el choque de una estadía con las ocupadas', () => {
    const o = crearOcupacion(ocupadas);
    expect(o.choca(deIso('2026-10-27'), deIso('2026-11-03'))).toBe(false);
    expect(o.choca(deIso('2026-10-22'), deIso('2026-10-25'))).toBe(true);
  });

  it('puede ignorar la propia reserva al editarla', () => {
    const o = crearOcupacion(ocupadas, (r) => r.fechaIngreso === '2026-11-03');
    expect(o.choca(deIso('2026-11-02'), deIso('2026-11-06'))).toBe(false);
  });
});
