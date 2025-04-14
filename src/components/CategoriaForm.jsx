import { useState } from "react";

export default function CategoriaForm({ onAgregar }) {
  const [nombre, setNombre] = useState("");
  const [presupuesto, setPresupuesto] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre || !presupuesto || parseFloat(presupuesto) <= 0) {
      alert("Completa todos los campos correctamente");
      return;
    }

    onAgregar({
      nombre: nombre.trim(),
      presupuesto: parseFloat(presupuesto),
    });

    setNombre("");
    setPresupuesto("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        Nueva categoría
      </h2>

      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre"
        className="w-full mb-2 p-2 rounded border dark:bg-gray-700 dark:text-white"
      />

      <input
        type="number"
        value={presupuesto}
        onChange={(e) => setPresupuesto(e.target.value)}
        placeholder="Presupuesto"
        className="w-full mb-2 p-2 rounded border dark:bg-gray-700 dark:text-white"
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
