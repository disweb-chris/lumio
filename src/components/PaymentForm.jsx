// src/components/PaymentForm.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import { convertirUsdAArsFijo, convertirArsAUsdFijo } from "../utils/conversion";
import dayjs from "dayjs";

export default function PaymentForm({
  colaboradores = [],
  proyectoId,
  onAgregarPago,
}) {
  const { user } = useAuth();
  const [colaborador, setColaborador] = useState("");
  const [montoARS, setMontoARS] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
  const [fecha, setFecha] = useState(dayjs().format("YYYY-MM-DD"));
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (colaboradores.length && !colaborador) {
      setColaborador(colaboradores[0].id);
    }
  }, [colaboradores]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ars = parseFloat(montoARS);
    const usd = parseFloat(montoUSD);
    if (!colaborador || (!ars && !usd) || !fecha) return alert("Completa todos los campos.");

    setGuardando(true);
    const cot = await obtenerCotizacionUSD();
    let pago = {
      proyectoId,
      uid: user.uid,
      colaboradorId: colaborador,
      fecha: new Date(fecha),
      metodoPago,
      timestamp: new Date(),
    };
    if (usd > 0) {
      const conv = convertirUsdAArsFijo(usd, cot);
      pago = { ...pago, moneda: "USD", montoUSD: parseFloat(conv.montoUSD), montoARSConvertido: parseFloat(conv.montoARSConvertido), cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento) };
    } else {
      const conv = convertirArsAUsdFijo(ars, cot);
      pago = { ...pago, moneda: "ARS", montoARS: parseFloat(conv.montoARS), montoUSDConvertido: parseFloat(conv.montoUSDConvertido), cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento) };
    }

    await onAgregarPago(pago);
    // reset
    setMontoARS("");
    setMontoUSD("");
    setFecha(dayjs().format("YYYY-MM-DD"));
    setMetodoPago("Efectivo");
    setGuardando(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Registrar pago</h3>

      {/* Colaborador */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Colaborador</label>
        <select
          value={colaborador}
          onChange={e => setColaborador(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          {colaboradores.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Montos */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className="block text-sm text-gray-700 dark:text-gray-300">Monto ARS</label>
          <input
            type="number"
            value={montoARS}
            onChange={e => setMontoARS(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-700 dark:text-gray-300">Monto USD</label>
          <input
            type="number"
            value={montoUSD}
            onChange={e => setMontoUSD(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Fecha */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Método */}
      <div className="mb-4">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Método de pago</label>
        <select
          value={metodoPago}
          onChange={e => setMetodoPago(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          <option>Efectivo</option>
          <option>Transferencia</option>
          <option>Mercado Pago</option>
          <option>Binance</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {guardando ? "Guardando..." : "Guardar pago"}
      </button>
    </form>
  );
}
