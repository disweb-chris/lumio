export function esPagoConTarjeta(metodo) {
    const m = String(metodo).toLowerCase();
    return m.includes("tarjeta") || m.includes("mercado pago");
  }
  