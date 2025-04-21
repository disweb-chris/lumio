// Conversión dinámica (para usar en formularios)
export function arsToUsd(montoARS, cotizacionUSD) {
  const num = parseFloat(montoARS);
  if (!isNaN(num) && cotizacionUSD > 0) {
    return (num / cotizacionUSD).toFixed(2);
  }
  return "";
}

export function usdToArs(montoUSD, cotizacionUSD) {
  const num = parseFloat(montoUSD);
  if (!isNaN(num) && cotizacionUSD > 0) {
    return (num * cotizacionUSD).toFixed(2);
  }
  return "";
}

// Conversión fija (para guardar en Firebase al momento del ingreso)
export function convertirUsdAArsFijo(montoUSD, cotizacionUSD) {
  const usd = parseFloat(montoUSD);
  const cot = parseFloat(cotizacionUSD);
  if (!isNaN(usd) && cot > 0) {
    return {
      montoUSD: usd.toFixed(2),
      cotizacionAlMomento: cot.toFixed(2),
      montoARSConvertido: (usd * cot).toFixed(2)
    };
  }
  return null;
}

// *Nueva* conversión fija ARS → USD
export function convertirArsAUsdFijo(montoARS, cotizacionUSD) {
  const ars = parseFloat(montoARS);
  const cot = parseFloat(cotizacionUSD);
  if (!isNaN(ars) && cot > 0) {
    return {
      montoARS: ars.toFixed(2),
      cotizacionAlMomento: cot.toFixed(2),
      montoUSDConvertido: (ars / cot).toFixed(2),
    };
  }
  return null;
}