import { useState } from "react";

export default function VencimientoForm({ onAgregar }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!descripcion || !monto || !fecha) return;

    onAgregar({
      descripcion,
      monto: parseFloat(monto),
      fecha,
      pagado: false,
    });

    setDescripcion("");
    setMonto("");
    setFecha("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Nuevo vencimiento</h2>

      <input
        type="text"
        placeholder="Descripción"
        className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:text-white"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />
      <input
        type="number"
        placeholder="Monto"
        className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:text-white"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
      />
      <input
        type="date"
        className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:text-white"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />
      <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
        Agregar
      </button>
    </form>
  );
}
