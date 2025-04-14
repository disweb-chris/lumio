import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

export default function GastoForm() {
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date().toISOString().split("T")[0];
    return hoy;
  });

  useEffect(() => {
    const q = query(collection(db, "categorias"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategorias(data);
      if (data.length > 0 && !categoria) {
        setCategoria(data[0].nombre);
      }
    });

    return () => unsubscribe();
  }, [categoria]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0 || !categoria) return;

    try {
      await addDoc(collection(db, "gastos"), {
        categoria,
        monto: montoNum,
        descripcion,
        fecha: Timestamp.fromDate(new Date(fecha)),
        timestamp: Timestamp.now(),
      });
      console.log("✅ Gasto guardado en Firebase");
    } catch (error) {
      console.error("❌ Error al guardar en Firebase:", error);
    }

    setMonto("");
    setDescripcion("");
    setFecha(new Date().toISOString().split("T")[0]);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        Registrar gasto
      </h2>

      {/* Descripción */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <input
          type="text"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Almuerzo, Subte..."
        />
      </div>

      {/* Categoría */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Categoría
        </label>
        <select
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.nombre}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Monto */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto
        </label>
        <input
          type="number"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Ej: 1500"
        />
      </div>

      {/* Fecha */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Fecha
        </label>
        <input
          type="date"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2"
      >
        Agregar gasto
      </button>
    </form>
  );
}
