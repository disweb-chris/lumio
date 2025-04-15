import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatearMoneda } from "../utils/format";
import CategoriaForm from "../components/CategoriaForm";
import { obtenerCotizacionUSD } from "../utils/configuracion";

export default function Presupuestos() {
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState("");
  const [cotizacionUSD, setCotizacionUSD] = useState(1);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categorias"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategorias(data);
    });

    obtenerCotizacionUSD().then((valor) => {
      if (valor) setCotizacionUSD(valor);
    });

    return () => unsubscribe();
  }, []);

  const agregarCategoria = async (nueva) => {
    try {
      await addDoc(collection(db, "categorias"), nueva);
    } catch (error) {
      alert("Error al agregar categoría");
      console.error(error);
    }
  };

  const guardarCambios = async (id) => {
    const nombre = nuevoNombre.trim();
    const presupuesto = parseFloat(nuevoPresupuesto);

    if (!nombre || isNaN(presupuesto) || presupuesto <= 0) {
      alert("Datos inválidos.");
      return;
    }

    try {
      await updateDoc(doc(db, "categorias", id), {
        nombre,
        presupuesto,
      });
      setEditando(null);
      setNuevoNombre("");
      setNuevoPresupuesto("");
    } catch (error) {
      console.error("❌ Error al actualizar categoría:", error);
    }
  };

  const eliminarCategoria = async (id) => {
    const confirmado = window.confirm("¿Eliminar esta categoría?");
    if (!confirmado) return;

    try {
      await deleteDoc(doc(db, "categorias", id));
    } catch (error) {
      console.error("❌ Error al eliminar categoría:", error);
    }
  };

  const mostrarARSyUSD = (monto) => {
    const usd = (monto / cotizacionUSD).toFixed(2);
    return `${formatearMoneda(monto)} ARS / u$d ${usd}`;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Presupuestos por categoría
      </h2>

      <CategoriaForm onAgregar={agregarCategoria} />

      <ul className="space-y-3 mt-4">
        {categorias.map((cat) => (
          <li
            key={cat.id}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
          >
            {editando === cat.id ? (
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
                    onClick={() => guardarCambios(cat.id)}
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
                    Presupuesto actual: {mostrarARSyUSD(cat.presupuesto)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditando(cat.id);
                      setNuevoNombre(cat.nombre);
                      setNuevoPresupuesto(cat.presupuesto);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarCategoria(cat.id)}
                    className="bg-white text-red-600 border px-3 py-1 rounded hover:bg-gray-200"
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
