import React, { useState, useEffect } from "react";

export default function ProyectoForm({ editando, onGuardar, onCancel }) {
  // Estados locales
  const [nombre, setNombre] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [descripcion, setDescripcion] = useState("");

  // Cuando cambiamos de "editando", rellenamos o reseteamos
  useEffect(() => {
    if (editando) {
      setNombre(editando.nombre);
      setPresupuesto(editando.presupuesto.toString());
      setMoneda(editando.moneda);
      setDescripcion(editando.descripcion || "");
    } else {
      setNombre("");
      setPresupuesto("");
      setMoneda("ARS");
      setDescripcion("");
    }
  }, [editando]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validaciones básicas
    if (!nombre.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }
    const presuNum = parseFloat(presupuesto);
    if (isNaN(presuNum) || presuNum < 0) {
      alert("Presupuesto inválido.");
      return;
    }

    // Llamamos al padre
    onGuardar({
      id: editando?.id,
      nombre: nombre.trim(),
      presupuesto: presuNum,
      moneda,
      descripcion: descripcion.trim(), // nunca undefined
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        {editando ? "Editar proyecto" : "Nuevo proyecto"}
      </h2>

      {/* Nombre */}
      <div className="mb-3">
        <label className="block mb-1 text-gray-700 dark:text-gray-300">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Presupuesto */}
      <div className="mb-3">
        <label className="block mb-1 text-gray-700 dark:text-gray-300">Presupuesto</label>
        <input
          type="number"
          value={presupuesto}
          onChange={(e) => setPresupuesto(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Moneda */}
      <div className="mb-3">
        <label className="block mb-1 text-gray-700 dark:text-gray-300">Moneda</label>
        <select
          value={moneda}
          onChange={(e) => setMoneda(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </div>

      {/* Descripción */}
      <div className="mb-4">
        <label className="block mb-1 text-gray-700 dark:text-gray-300">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          placeholder="Descripción opcional"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {editando ? "Actualizar" : "Crear"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
