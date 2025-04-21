import { useState } from "react";
import { toast } from "react-toastify";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import {
  convertirUsdAArsFijo,
  convertirArsAUsdFijo
} from "../utils/conversion";

export default function IngresoForm({ onAgregarIngreso }) {
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

  // Calcula fecha de segundo pago sumando 30 días hábiles
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

  // Actualizaciones simples de inputs
  const actualizarDesdeARS = (valor) => {
    setMontoARS(valor);
  };
  const actualizarDesdeUSD = (valor) => {
    setMontoUSD(valor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoARSnum = parseFloat(montoARS);
    const montoUSDnum = parseFloat(montoUSD);
    const tieneARS = !isNaN(montoARSnum) && montoARSnum > 0;
    const tieneUSD = !isNaN(montoUSDnum) && montoUSDnum > 0;

    if (!descripcion || (!tieneARS && !tieneUSD) || !fecha) {
      toast.error("❌ Completa todos los campos obligatorios.");
      return;
    }

    // 1) Obtener cotización global en el momento
    let cotizacion;
    try {
      cotizacion = await obtenerCotizacionUSD();
    } catch (err) {
      console.error(err);
      toast.error("❌ Error al obtener la cotización.");
      return;
    }
    if (!cotizacion) {
      toast.error("❌ Cotización no disponible.");
      return;
    }

    // 2) Construir objeto base
    let ingreso = {
      descripcion,
      fecha1: fecha,
      recibido1: false,
      recibido2: false,
      dividido: modo !== "completo",
      montoRecibido: 0,
    };

    // 3) Conversión fija según moneda de origen
    if (tieneUSD) {
      const conv = convertirUsdAArsFijo(montoUSDnum, cotizacion);
      ingreso = {
        ...ingreso,
        moneda: "USD",
        montoUSD: parseFloat(conv.montoUSD),
        montoARSConvertido: parseFloat(conv.montoARSConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
      };
    } else if (tieneARS) {
      const conv2 = convertirArsAUsdFijo(montoARSnum, cotizacion);
      ingreso = {
        ...ingreso,
        moneda: "ARS",
        montoARS: parseFloat(conv2.montoARS),
        montoUSDConvertido: parseFloat(conv2.montoUSDConvertido),
        cotizacionAlMomento: parseFloat(conv2.cotizacionAlMomento),
      };
    }

    // 4) Manejo de modos de pago
    if (modo === "auto") {
      const total = ingreso.moneda === "USD"
        ? ingreso.montoUSD
        : ingreso.montoARS;
      ingreso.monto1 = total / 2;
      ingreso.monto2 = total / 2;
      ingreso.fecha2 = calcularFechaSegundoPago(fecha);
    }
    if (modo === "manual") {
      const m1 = parseFloat(monto1);
      const m2 = parseFloat(monto2);
      if (isNaN(m1) || isNaN(m2)) {
        toast.error("❌ Montos inválidos en ingreso dividido manual");
        return;
      }
      ingreso.monto1 = m1;
      ingreso.monto2 = m2;
      ingreso.fecha2 = fecha2 || null;
    }

    // 5) Enviar a Firestore
    try {
      await onAgregarIngreso(ingreso);
      toast.success("✅ Ingreso registrado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error al guardar el ingreso");
    }

    // 6) Resetear formulario
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
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        Registrar ingreso
      </h2>

      {/* Descripción */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <input
          type="text"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Proyecto X"
        />
      </div>

      {/* Monto en ARS */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en ARS
        </label>
        <input
          type="number"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={montoARS}
          onChange={(e) => actualizarDesdeARS(e.target.value)}
        />
      </div>

      {/* Monto en USD */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en USD
        </label>
        <input
          type="number"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={montoUSD}
          onChange={(e) => actualizarDesdeUSD(e.target.value)}
        />
      </div>

      {/* Fecha primer pago */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Fecha primer pago
        </label>
        <input
          type="date"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      {/* Tipo de ingreso */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo de ingreso
        </p>
        <div className="flex gap-4 flex-wrap">
          <label className="text-sm">
            <input
              type="radio"
              value="completo"
              checked={modo === "completo"}
              onChange={(e) => setModo(e.target.value)}
              className="mr-2"
            />
            Completo
          </label>
          <label className="text-sm">
            <input
              type="radio"
              value="auto"
              checked={modo === "auto"}
              onChange={(e) => setModo(e.target.value)}
              className="mr-2"
            />
            Dividir 50/50
          </label>
          <label className="text-sm">
            <input
              type="radio"
              value="manual"
              checked={modo === "manual"}
              onChange={(e) => setModo(e.target.value)}
              className="mr-2"
            />
            Ingreso dividido manual
          </label>
        </div>
      </div>

      {/* Ingreso dividido manual */}
      {modo === "manual" && (
        <>
          <div className="mb-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Monto 1º pago
            </label>
            <input
              type="number"
              value={monto1}
              onChange={(e) => setMonto1(e.target.value)}
              className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Monto 2º pago
            </label>
            <input
              type="number"
              value={monto2}
              onChange={(e) => setMonto2(e.target.value)}
              className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Fecha 2º pago
            </label>
            <input
              type="date"
              value={fecha2}
              onChange={(e) => setFecha2(e.target.value)}
              className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
      >
        Guardar ingreso
      </button>
    </form>
  );
}
