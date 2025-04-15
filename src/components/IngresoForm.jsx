import { useState } from "react";

export default function IngresoForm({ onAgregarIngreso, cotizacionUSD }) {
  const [descripcion, setDescripcion] = useState("");
  const [montoARS, setMontoARS] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const montoNum = parseFloat(montoARS);
    if (!descripcion || !montoNum || !fecha) return;

    onAgregarIngreso({
      descripcion,
      monto: montoNum,
      fecha,
    });

    setDescripcion("");
    setMontoARS("");
    setMontoUSD("");
    setFecha(new Date().toISOString().split("T")[0]);
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

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        Registrar ingreso
      </h2>

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          placeholder="Ej: Sueldo, freelance..."
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en ARS
        </label>
        <input
          type="number"
          value={montoARS}
          onChange={(e) => actualizarDesdeARS(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          placeholder="Ej: 100000"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en USD
        </label>
        <input
          type="number"
          value={montoUSD}
          onChange={(e) => actualizarDesdeUSD(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          placeholder="Ej: 100"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Fecha esperada
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
      >
        Agregar ingreso
      </button>
    </form>
  );
}
