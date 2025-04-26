import { useState, useEffect } from "react";
import { OPCIONES_PAGO } from "../constants/pagos"; // puedes extraer este array a un constants/pagos.js

export default function ColaboradorForm({
  colaboradores = [],
  onGuardar,
  editando = null,
  onCancel,
}) {
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [metodosPago, setMetodosPago] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editando) {
      // Al iniciar edición, cargo todos los campos
      setNombre(editando.nombre || "");
      setRol(editando.rol || "");
      setDni(editando.dni || "");
      setEmail(editando.email || "");
      setTelefono(editando.telefono || "");
      setMetodosPago(editando.metodosPago || []);
    } else {
      // Al salir de edición (o en alta), reseteo TODO
      setNombre("");
      setRol("");
      setDni("");
      setEmail("");
      setTelefono("");
      setMetodosPago([]);
    }
    setError("");
  }, [editando]);

  const handleCheckbox = (op) => {
    setMetodosPago((prev) =>
      prev.includes(op) ? prev.filter((m) => m !== op) : [...prev, op]
    );
  };

  const validarEmail = (em) => /^\S+@\S+\.\S+$/.test(em);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const nombreTrim = nombre.trim();
    if (!nombreTrim) return setError("El nombre es obligatorio.");
    if (
      colaboradores.some(
        (c) =>
          c.nombre.trim().toLowerCase() === nombreTrim.toLowerCase() &&
          c.id !== editando?.id
      )
    )
      return setError("Ya existe un colaborador con ese nombre.");
    if (!/^\d+$/.test(dni.trim())) return setError("DNI inválido.");
    if (!validarEmail(email.trim())) return setError("Email inválido.");
    if (!telefono.trim()) return setError("El teléfono es obligatorio.");
    if (metodosPago.length === 0)
      return setError("Selecciona al menos un método de pago.");

    onGuardar({
      id: editando?.id,
      nombre: nombreTrim,
      rol: rol.trim(),
      dni: dni.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      metodosPago,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        {editando ? "Editar colaborador" : "Nuevo colaborador"}
      </h2>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* DNI */}
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            DNI *
          </label>
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            Teléfono *
          </label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Rol */}
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            Rol
          </label>
          <input
            type="text"
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Métodos de pago */}
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            Métodos de pago *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {OPCIONES_PAGO.map((op) => (
              <label key={op} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={metodosPago.includes(op)}
                  onChange={() => handleCheckbox(op)}
                  className="accent-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">{op}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
