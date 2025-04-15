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

export default function GastoForm({ cotizacionUSD }) {
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [montoARS, setMontoARS] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
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
    const montoNum = parseFloat(montoARS);
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

    setMontoARS("");
    setMontoUSD("");
    setDescripcion("");
    setFecha(new Date().toISOString().split("T")[0]);
  };

  const actualizarDesdeARS = (valor) => {
    setMontoARS(valor);
    const num = parseFloat(valor);
    if (!isNaN(num) && cotizacionUSD > 0) {
      setMontoUSD((num / cotizacionUSD).toFixed(2));
    } else {
      setMontoUSD("");
    }
  };

  const actualizarDesdeUSD = (valor) => {
    setMontoUSD(valor);
    const num = parseFloat(valor);
    if (!isNaN(num) && cotizacionUSD > 0) {
      setMontoARS((num * cotizacionUSD).toFixed(2));
    } else {
      setMontoARS("");
    }
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

      {/* Monto en ARS */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en ARS
        </label>
        <input
          type="number"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={montoARS}
          onChange={(e) => actualizarDesdeARS(e.target.value)}
          placeholder="Ej: 1500"
        />
      </div>

      {/* Monto en USD */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en USD
        </label>
        <input
          type="number"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={montoUSD}
          onChange={(e) => actualizarDesdeUSD(e.target.value)}
          placeholder="Ej: 10"
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
