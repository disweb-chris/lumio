import { useState } from "react";

export default function ColaboradorForm({
  colaboradores = [],
  onAgregar,
  onCancel,       // opcional, para editar
  editando = null // objeto { id, nombre, rol } o null
}) {
  const [nombre, setNombre] = useState(editando?.nombre || "");
  const [rol, setRol] = useState(editando?.rol || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const nombreTrim = nombre.trim();
    if (!nombreTrim) {
      setError("El nombre es obligatorio.");
      return;
    }
    // evitar duplicados (case-insensitive, trim)
    if (
      colaboradores.some(
        (c) =>
          c.nombre.trim().toLowerCase() === nombreTrim.toLowerCase() &&
          c.id !== editando?.id
      )
    ) {
      setError("Ya existe un colaborador con ese nombre.");
      return;
    }

    onAgregar({ 
      id: editando?.id, 
      nombre: nombreTrim, 
      rol: rol.trim() 
    });

    // reset si es un alta
    if (!editando) {
      setNombre("");
      setRol("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        {editando ? "Editar colaborador" : "Nuevo colaborador"}
      </h2>

      {error && (
        <p className="text-sm text-red-500 mb-3">{error}</p>
      )}

      <input
        type="text"
        value={nombre}
        onChange={(e) => {
          setError("");
          setNombre(e.target.value);
        }}
        placeholder="Nombre completo"
        className="w-full mb-2 p-2 rounded border dark:bg-gray-700 dark:text-white"
      />

      <input
        type="text"
        value={rol}
        onChange={(e) => setRol(e.target.value)}
        placeholder="Rol (opcional)"
        className="w-full mb-4 p-2 rounded border dark:bg-gray-700 dark:text-white"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!nombre.trim()}
        >
          {editando ? "Guardar cambios" : "Agregar colaborador"}
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
