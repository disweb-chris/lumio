import { useState } from "react";

export default function IngresoForm({ onAgregarIngreso }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!descripcion || !montoNum || !fecha) return;

    onAgregarIngreso({
      descripcion,
      monto: montoNum,
      fecha,
      recibido: false,
    });

    setDescripcion("");
    setMonto("");
    setFecha("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Registrar ingreso</h2>

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Descripción</label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          placeholder="Ej: Sueldo, freelance..."
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Monto</label>
        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Fecha esperada</label>
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
