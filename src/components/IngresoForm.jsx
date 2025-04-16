import { useState } from "react";

export default function IngresoForm({ onAgregarIngreso, cotizacionUSD = 1 }) {
  const [descripcion, setDescripcion] = useState("");
  const [montoARS, setMontoARS] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().split("T")[0]
  );

  const [modo, setModo] = useState("completo"); // completo | auto | manual
  const [monto1, setMonto1] = useState("");
  const [monto2, setMonto2] = useState("");
  const [fecha2, setFecha2] = useState("");

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
    const monto = parseFloat(montoARS);
    if (!descripcion || !monto || !fecha) return;

    let ingreso = {
      descripcion,
      montoTotal: monto,
      fecha1: fecha,
      recibido1: false,
      recibido2: false,
      dividido: modo !== "completo",
    };

    if (modo === "completo") {
      ingreso.montoRecibido = monto;
      ingreso.recibido1 = true;
      ingreso.fecha2 = null;
    }

    if (modo === "auto") {
      ingreso.montoRecibido = 0;
      ingreso.monto1 = monto / 2;
      ingreso.monto2 = monto / 2;
      ingreso.fecha2 = calcularFechaSegundoPago(fecha);
    }

    if (modo === "manual") {
      const m1 = parseFloat(monto1);
      const m2 = parseFloat(monto2);
      if (isNaN(m1) || isNaN(m2)) return alert("Montos inválidos");
      ingreso.montoRecibido = 0;
      ingreso.monto1 = m1;
      ingreso.monto2 = m2;
      ingreso.fecha2 = fecha2 || null;
    }

    onAgregarIngreso(ingreso);

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
        Registrar ingreso
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

      {/* Fecha del primer pago */}
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

      {/* Opciones */}
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

      {/* División manual */}
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
        Guardar ingreso
      </button>
    </form>
  );
}
