import { useState, useEffect } from "react";
import { convertirUsdAArsFijo } from "../utils/conversion";
import { toast } from "react-toastify";

export default function IngresoForm({
  onAgregarIngreso,
  onActualizarIngreso,
  cotizacionUSD = 1,
  editando = null
}) {
  const [descripcion, setDescripcion] = useState("");
  const [montoARS, setMontoARS] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [modo, setModo] = useState("completo");
  const [monto1, setMonto1] = useState("");
  const [monto2, setMonto2] = useState("");
  const [fecha2, setFecha2] = useState("");

  useEffect(() => {
    if (editando) {
      setDescripcion(editando.descripcion || "");
      setFecha(editando.fecha1?.toDate?.() ? editando.fecha1.toDate().toISOString().split("T")[0] : editando.fecha1);
      setMontoARS(editando.montoARS?.toString() || "");
      setMontoUSD(editando.montoUSD?.toString() || "");
      setMonto1(editando.monto1?.toString() || "");
      setMonto2(editando.monto2?.toString() || "");
      setFecha2(
        editando.fecha2?.toDate?.()
          ? editando.fecha2.toDate().toISOString().split("T")[0]
          : editando.fecha2 || ""
      );
      setModo(editando.dividido ? (editando.monto1 && editando.monto2 ? "manual" : "auto") : "completo");
    }
  }, [editando]);

  const calcularFechaSegundoPago = (fechaStr) => {
    const base = new Date(fechaStr);
    let diasAgregados = 0;
    let actual = new Date(base);
    while (diasAgregados < 30) {
      actual.setDate(actual.getDate() + 1);
      const esDiaHabil = actual.getDay() !== 0 && actual.getDay() !== 6;
      if (esDiaHabil) diasAgregados++;
    }
    return actual.toISOString().split("T")[0];
  };

  const actualizarDesdeARS = (valor) => {
    setMontoARS(valor);
    const num = parseFloat(valor);
    if (!isNaN(num) && cotizacionUSD > 0) {
      setMontoUSD((num / cotizacionUSD).toFixed(2));
    } else {
      setMontoUSD("");
    }
  };

  const actualizarDesdeUSD = (valor) => {
    setMontoUSD(valor);
    const num = parseFloat(valor);
    if (!isNaN(num) && cotizacionUSD > 0) {
      setMontoARS((num * cotizacionUSD).toFixed(2));
    } else {
      setMontoARS("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const montoARSnum = parseFloat(montoARS);
    const montoUSDnum = parseFloat(montoUSD);
    const tieneARS = !isNaN(montoARSnum) && montoARSnum > 0;
    const tieneUSD = !isNaN(montoUSDnum) && montoUSDnum > 0;

    if (!descripcion || (!tieneARS && !tieneUSD) || !fecha) {
      toast.error("❌ Completa todos los campos obligatorios.");
      return;
    }

    const moneda = tieneUSD ? "USD" : "ARS";
    const montoTotal = moneda === "USD" ? montoUSDnum : montoARSnum;

    let ingreso = {
      descripcion,
      moneda,
      montoTotal,
      montoARS: tieneARS ? montoARSnum : null,
      montoUSD: tieneUSD ? montoUSDnum : null,
      fecha1: fecha,
      recibido1: editando?.recibido1 || false,
      recibido2: editando?.recibido2 || false,
      dividido: modo !== "completo",
    };

    if (editando?.montoRecibido) {
      ingreso.montoRecibido = editando.montoRecibido;
    }

    if (tieneUSD) {
      const conversion = convertirUsdAArsFijo(montoUSD, cotizacionUSD);
      if (conversion) {
        ingreso.montoARSConvertido = parseFloat(conversion.montoARSConvertido);
        ingreso.cotizacionAlMomento = parseFloat(conversion.cotizacionAlMomento);
      }
    }

    if (modo === "completo") {
      ingreso.fecha2 = null;
    }

    if (modo === "auto") {
      ingreso.monto1 = montoTotal / 2;
      ingreso.monto2 = montoTotal / 2;
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

    try {
      if (editando && editando.id) {
        ingreso.id = editando.id;
        onActualizarIngreso(ingreso);
        toast.success("✅ Ingreso actualizado");
      } else {
        onAgregarIngreso(ingreso);
        toast.success("✅ Ingreso registrado correctamente");
      }
    } catch (error) {
      console.error("❌ Error al guardar ingreso:", error);
      toast.error("❌ Error al guardar el ingreso");
    }

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
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        {editando ? "Editar ingreso" : "Registrar ingreso"}
      </h2>

      {/* Descripción */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Monto ARS */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en ARS
        </label>
        <input
          type="number"
          value={montoARS}
          onChange={(e) => actualizarDesdeARS(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Monto USD */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en USD
        </label>
        <input
          type="number"
          value={montoUSD}
          onChange={(e) => actualizarDesdeUSD(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Fecha */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Fecha primer pago
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
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
              Fecha 2º pago (estimada)
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
        {editando ? "Actualizar ingreso" : "Guardar ingreso"}
      </button>
    </form>
  );
}
