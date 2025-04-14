import { useState } from "react";

export default function VencimientoForm({ onAgregar }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!descripcion || !monto || !fecha) {
      alert("Completa todos los campos.");
      return;
    }

    onAgregar({
      descripcion,
      monto: parseFloat(monto),
      fecha,
    });

    setDescripcion("");
    setMonto("");
    setFecha(new Date().toISOString().split("T")[0]);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        Nuevo vencimiento
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
          placeholder="Ej: Alquiler, Factura..."
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto
        </label>
        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Fecha límite
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
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mt-2"
      >
        Agregar
      </button>
    </form>
  );
}
