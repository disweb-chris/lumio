import { useState, useEffect } from "react";
import { obtenerDeStorage, guardarEnStorage } from "../utils/storage";
import { formatearMoneda } from "../utils/format";
import CategoriaForm from "../components/CategoriaForm";

export default function Presupuestos() {
  const [categorias, setCategorias] = useState(() =>
    obtenerDeStorage("categorias", [])
  );

  const [gastos, setGastos] = useState(() =>
    obtenerDeStorage("gastos", [])
  );

  const [editando, setEditando] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState("");

  const guardarCambios = (index) => {
    const nombreTrim = nuevoNombre.trim();
    const presupuestoNum = parseFloat(nuevoPresupuesto);

    if (!nombreTrim || isNaN(presupuestoNum) || presupuestoNum <= 0) {
      alert("Debes ingresar un nombre válido y un presupuesto mayor a 0.");
      return;
    }

    const nombreAnterior = categorias[index].nombre;

    if (
      nombreTrim !== nombreAnterior &&
      categorias.some((cat) => cat.nombre.toLowerCase() === nombreTrim.toLowerCase())
    ) {
      alert("Ya existe una categoría con ese nombre.");
      return;
    }

    const actualizado = [...categorias];
    actualizado[index].nombre = nombreTrim;
    actualizado[index].presupuesto = presupuestoNum;
    setCategorias(actualizado);
    guardarEnStorage("categorias", actualizado);

    if (nombreAnterior !== nombreTrim) {
      const gastosActualizados = gastos.map((g) =>
        g.categoria === nombreAnterior
          ? { ...g, categoria: nombreTrim }
          : g
      );
      setGastos(gastosActualizados);
      guardarEnStorage("gastos", gastosActualizados);
    }

    setEditando(null);
    setNuevoNombre("");
    setNuevoPresupuesto("");
  };

  const eliminarCategoria = (index) => {
    const categoria = categorias[index];
    const tieneGastos = gastos.some((g) => g.categoria === categoria.nombre);
    if (tieneGastos) {
      alert("No se puede eliminar una categoría con gastos asociados.");
      return;
    }

    const confirmado = window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`);
    if (!confirmado) return;

    const actualizadas = categorias.filter((_, i) => i !== index);
    setCategorias(actualizadas);
    guardarEnStorage("categorias", actualizadas);
  };

  const agregarCategoria = (nueva) => {
    const yaExiste = categorias.some(
      (c) => c.nombre.toLowerCase() === nueva.nombre.toLowerCase()
    );
    if (yaExiste) return alert("Ya existe una categoría con ese nombre.");

    const actualizadas = [...categorias, nueva];
    setCategorias(actualizadas);
    guardarEnStorage("categorias", actualizadas);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Presupuestos por categoría
      </h2>

      <CategoriaForm onAgregar={agregarCategoria} />

      <ul className="space-y-3 mt-4">
        {categorias.map((cat, index) => (
          <li
            key={index}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
          >
            {editando === index ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full sm:w-1/2 px-2 py-1 rounded border dark:bg-gray-700 dark:text-white"
                    placeholder="Nuevo nombre"
                  />
                  <input
                    type="number"
                    value={nuevoPresupuesto}
                    onChange={(e) => setNuevoPresupuesto(e.target.value)}
                    className="w-full sm:w-1/3 px-2 py-1 rounded border dark:bg-gray-700 dark:text-white"
                    placeholder="Nuevo presupuesto"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => guardarCambios(index)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-lg font-semibold">{cat.nombre}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Presupuesto actual: ${formatearMoneda(cat.presupuesto)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditando(index);
                      setNuevoNombre(cat.nombre);
                      setNuevoPresupuesto(cat.presupuesto);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarCategoria(index)}
                    className="bg-white text-red-600 border px-3 py-1 rounded hover:bg-gray-200"
                    title="Eliminar categoría"
                  >
                    🗑
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
