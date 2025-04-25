// src/components/CategoriaForm.jsx
import { useState } from "react";

export default function CategoriaForm({ onAgregar, categorias = [] }) {
  const [nombre, setNombre] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const nombreNorm = nombre.trim().toLowerCase();
    const presuNum = parseFloat(presupuesto);

    // Validaciones
    if (!nombreNorm) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }
    if (
      categorias.some(
        (c) => c.nombre.trim().toLowerCase() === nombreNorm
      )
    ) {
      setError("Ya existe una categoría con ese nombre.");
      return;
    }
    if (isNaN(presuNum) || presuNum <= 0) {
      setError("El presupuesto debe ser un número mayor que cero.");
      return;
    }

    // Agregar categoría
    onAgregar({
      nombre: nombre.trim(),
      presupuesto: presuNum,
    });

    // Reset
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

      {error && (
        <p className="text-sm text-red-500 mb-3">
          {error}
        </p>
      )}

      <input
        type="text"
        value={nombre}
        onChange={(e) => {
          setError("");
          setNombre(e.target.value);
        }}
        placeholder="Nombre"
        className="w-full mb-2 p-2 rounded border dark:bg-gray-700 dark:text-white"
      />

      <input
        type="number"
        value={presupuesto}
        onChange={(e) => {
          setError("");
          setPresupuesto(e.target.value);
        }}
        placeholder="Presupuesto"
        className="w-full mb-4 p-2 rounded border dark:bg-gray-700 dark:text-white"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={!nombre.trim() || !presupuesto}
      >
        Agregar categoría
      </button>
    </form>
  );
}
