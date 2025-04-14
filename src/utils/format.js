export function formatearMoneda(valor) {
  const numero = Number(valor);
  if (isNaN(numero)) return "$0";
  return numero.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}
