// src/components/ProyectoIngresoForm.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import { convertirUsdAArsFijo, convertirArsAUsdFijo } from "../utils/conversion";

export default function ProyectoIngresoForm({
  cotizacionUSD,
  onAgregarIngreso,
}) {
  const [descripcion, setDescripcion] = useState("");
  const [montoARS, setMontoARS] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [modo, setModo] = useState("completo");
  const [monto1, setMonto1] = useState("");
  const [monto2, setMonto2] = useState("");
  const [fecha2, setFecha2] = useState("");

  const calcularFechaSegundoPago = (fechaStr) => {
    const base = new Date(fechaStr);
    let diasAgregados = 0;
    let actual = new Date(base);
    while (diasAgregados < 30) {
      actual.setDate(actual.getDate() + 1);
      const dia = actual.getDay();
      if (dia !== 0 && dia !== 6) diasAgregados++;
    }
    return actual.toISOString().split("T")[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const arsNum = parseFloat(montoARS);
    const usdNum = parseFloat(montoUSD);
    const tieneARS = !isNaN(arsNum) && arsNum > 0;
    const tieneUSD = !isNaN(usdNum) && usdNum > 0;

    if (!descripcion.trim() || (!tieneARS && !tieneUSD)) {
      toast.error("❌ Completa descripción y al menos un monto");
      return;
    }

    // 1) Obtener objeto base
    let ingreso = {
      descripcion: descripcion.trim(),
      fecha1: fecha,
      recibido1: false,
      recibido2: false,
      dividido: modo !== "completo",
      montoRecibido: 0,
    };

    // 2) Conversión fija
    if (tieneUSD) {
      const conv = convertirUsdAArsFijo(usdNum, cotizacionUSD);
      ingreso = {
        ...ingreso,
        moneda: "USD",
        montoUSD: parseFloat(conv.montoUSD),
        montoARSConvertido: parseFloat(conv.montoARSConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
      };
    } else {
      const conv2 = convertirArsAUsdFijo(arsNum, cotizacionUSD);
      ingreso = {
        ...ingreso,
        moneda: "ARS",
        montoARS: parseFloat(conv2.montoARS),
        montoUSDConvertido: parseFloat(conv2.montoUSDConvertido),
        cotizacionAlMomento: parseFloat(conv2.cotizacionAlMomento),
      };
    }

    // 3) Modos de pago
    if (modo === "auto") {
      const total = ingreso.moneda === "USD" ? ingreso.montoUSD : ingreso.montoARS;
      ingreso.monto1 = total / 2;
      ingreso.monto2 = total / 2;
      ingreso.fecha2 = calcularFechaSegundoPago(fecha);
    }
    if (modo === "manual") {
      const m1 = parseFloat(monto1);
      const m2 = parseFloat(monto2);
      if (isNaN(m1) || isNaN(m2) || !fecha2) {
        toast.error("❌ Montos o fecha 2 inválidos");
        return;
      }
      ingreso.monto1 = m1;
      ingreso.monto2 = m2;
      ingreso.fecha2 = fecha2;
    }

    // 4) Enviar al padre
    await onAgregarIngreso(ingreso);

    // Reset
    setDescripcion("");
    setMontoARS("");
    setMontoUSD("");
    setFecha(new Date().toISOString().split("T")[0]);
    setModo("completo");
    setMonto1("");
    setMonto2("");
    setFecha2("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Descripción */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Descripción</label>
        <input
          type="text"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      {/* Montos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Monto ARS</label>
          <input
            type="number"
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
            value={montoARS}
            onChange={(e) => setMontoARS(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Monto USD</label>
          <input
            type="number"
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
            value={montoUSD}
            onChange={(e) => setMontoUSD(e.target.value)}
          />
        </div>
      </div>

      {/* Fecha 1 */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Fecha primer pago</label>
        <input
          type="date"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      {/* Tipo de ingreso */}
      <div>
        <p className="text-sm text-gray-300 mb-1">Tipo de ingreso</p>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              value="completo"
              checked={modo === "completo"}
              onChange={() => setModo("completo")}
              className="mr-1"
            />
            Completo
          </label>
          <label>
            <input
              type="radio"
              value="auto"
              checked={modo === "auto"}
              onChange={() => setModo("auto")}
              className="mr-1"
            />
            Dividir 50/50
          </label>
          <label>
            <input
              type="radio"
              value="manual"
              checked={modo === "manual"}
              onChange={() => setModo("manual")}
              className="mr-1"
            />
            Manual
          </label>
        </div>
      </div>

      {/* Inputs extra si manual */}
      {modo === "manual" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Monto 1º pago</label>
              <input
                type="number"
                className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
                value={monto1}
                onChange={(e) => setMonto1(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Monto 2º pago</label>
              <input
                type="number"
                className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
                value={monto2}
                onChange={(e) => setMonto2(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Fecha 2º pago</label>
            <input
              type="date"
              className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
              value={fecha2}
              onChange={(e) => setFecha2(e.target.value)}
            />
          </div>
        </>
      )}

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Guardar ingreso
      </button>
    </form>
);
}
