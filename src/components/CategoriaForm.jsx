import { useState } from "react";

export default function CategoriaForm({ onAgregar }) {
  const [nombre, setNombre] = useState("");
  const [presupuesto, setPresupuesto] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !presupuesto) return alert("Completa ambos campos");

    onAgregar({
      nombre,
      presupuesto: parseInt(presupuesto),
      gastado: 0,
    });

    setNombre("");
    setPresupuesto("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 space-y-3"
    >
      <h2 className="text-lg font-semibold dark:text-white">Nueva categoría</h2>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
      />
      <input
        type="number"
        placeholder="Presupuesto"
        value={presupuesto}
        onChange={(e) => setPresupuesto(e.target.value)}
        className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Agregar categoría
      </button>
    </form>
  );
}
