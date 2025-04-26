// src/components/PaymentForm.jsx
import { useState, useEffect } from "react";

export default function PaymentForm({
  colaboradores,
  pagoInicial = null,
  onAgregarPago,
  onActualizarPago,
  onCancelEdit,
}) {
  const [colaboradorId, setColaboradorId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [montoARS, setMontoARS] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");

  // Cuando cambia pagoInicial, rellenar o resetear
  useEffect(() => {
    if (pagoInicial) {
      setColaboradorId(pagoInicial.colaboradorId);
      setDescripcion(pagoInicial.descripcion || "");
      setMontoARS(pagoInicial.montoARS?.toString() || "");
      setMontoUSD(pagoInicial.montoUSD?.toString() || "");
      // fecha puede venir como string o Timestamp
      const f = pagoInicial.fecha
        ? pagoInicial.fecha.toDate
          ? pagoInicial.fecha.toDate().toISOString().split("T")[0]
          : pagoInicial.fecha
        : new Date().toISOString().split("T")[0];
      setFecha(f);
      setMetodoPago(pagoInicial.metodoPago || "Efectivo");
    } else {
      // modo nuevo
      if (colaboradores.length > 0) {
        setColaboradorId(colaboradores[0].id);
      }
      setDescripcion("");
      setMontoARS("");
      setMontoUSD("");
      setFecha(new Date().toISOString().split("T")[0]);
      setMetodoPago("Efectivo");
    }
  }, [pagoInicial, colaboradores]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!colaboradorId) {
      alert("Selecciona un colaborador.");
      return;
    }
    if (!descripcion.trim()) {
      alert("La descripción es obligatoria.");
      return;
    }
    const pago = {
      // si es edición incluir id
      ...(pagoInicial ? { id: pagoInicial.id } : {}),
      colaboradorId,
      descripcion: descripcion.trim(),
      montoARS: montoARS ? parseFloat(montoARS) : null,
      montoUSD: montoUSD ? parseFloat(montoUSD) : null,
      fecha,
      metodoPago,
    };

    if (pagoInicial) {
      onActualizarPago(pago);
    } else {
      onAgregarPago(pago);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Colaborador */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Colaborador</label>
        <select
          value={colaboradorId}
          onChange={(e) => setColaboradorId(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          {colaboradores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Descripción</label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Pago fase 1"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Montos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Monto ARS</label>
          <input
            type="number"
            value={montoARS}
            onChange={(e) => setMontoARS(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Monto USD</label>
          <input
            type="number"
            value={montoUSD}
            onChange={(e) => setMontoUSD(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Método de pago */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Método de pago</label>
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          <option>Efectivo</option>
          <option>Transferencia</option>
          <option>Mercado Pago</option>
          <option>Binance</option>
          <option>Tarjeta de crédito</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {pagoInicial ? "Actualizar pago" : "Guardar pago"}
        </button>
        {pagoInicial && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
