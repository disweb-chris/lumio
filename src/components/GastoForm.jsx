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
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [subMetodo, setSubMetodo] = useState("");

  const subOpcionesTarjeta = [
    "Ualá Emma",
    "Ualá Chris",
    "Naranja X",
    "Visa Santander",
    "Amex Santander",
  ];

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

    const metodoFinal =
      metodoPago === "Tarjeta de crédito" && subMetodo
        ? `Tarjeta: ${subMetodo}`
        : metodoPago;

    try {
      await addDoc(collection(db, "gastos"), {
        categoria,
        monto: montoNum,
        descripcion,
        metodoPago: metodoFinal,
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
    setMetodoPago("Efectivo");
    setSubMetodo("");
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

      {/* Monto ARS */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en ARS
        </label>
        <input
          type="number"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={montoARS}
          onChange={(e) => actualizarDesdeARS(e.target.value)}
        />
      </div>

      {/* Monto USD */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en USD
        </label>
        <input
          type="number"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={montoUSD}
          onChange={(e) => actualizarDesdeUSD(e.target.value)}
        />
      </div>

      {/* Método de pago */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Método de pago
        </label>
        <select
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={metodoPago}
          onChange={(e) => {
            setMetodoPago(e.target.value);
            if (e.target.value !== "Tarjeta de crédito") {
              setSubMetodo("");
            }
          }}
        >
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Mercado Pago">Mercado Pago</option>
          <option value="Tarjeta de crédito">Tarjeta de crédito</option>
        </select>
      </div>

      {metodoPago === "Tarjeta de crédito" && (
        <div className="mb-2">
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Tarjeta utilizada
          </label>
          <select
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
            value={subMetodo}
            onChange={(e) => setSubMetodo(e.target.value)}
          >
            <option value="">Selecciona una tarjeta</option>
            {subOpcionesTarjeta.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>
      )}

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
