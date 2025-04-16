import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function VencimientoForm({ onAgregar, cotizacionUSD = 1 }) {
  const [descripcion, setDescripcion] = useState("");
  const [montoARS, setMontoARS] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [subMetodo, setSubMetodo] = useState("");
  const [recurrente, setRecurrente] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categorias"), (snap) => {
      const lista = snap.docs.map((doc) => doc.data().nombre);
      setCategoriasDisponibles(lista);
    });
    return unsub;
  }, []);

  const subOpcionesTarjeta = [
    "Ualá Emma",
    "Ualá Chris",
    "Naranja X",
    "Visa Santander",
    "Amex Santander",
  ];

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

  const handleSubmit = (e) => {
    e.preventDefault();

    const montoNum = parseFloat(montoARS);
    if (!descripcion || !montoNum || !fecha || !categoria) {
      alert("Completa todos los campos.");
      return;
    }

    const metodoFinal =
      metodoPago === "Tarjeta de crédito" && subMetodo
        ? `Tarjeta: ${subMetodo}`
        : metodoPago;

    onAgregar({
      descripcion,
      monto: montoNum,
      fecha,
      metodoPago: metodoFinal,
      recurrente,
      categoria,
    });

    // Reset
    setDescripcion("");
    setMontoARS("");
    setMontoUSD("");
    setFecha(new Date().toISOString().split("T")[0]);
    setMetodoPago("Efectivo");
    setSubMetodo("");
    setRecurrente(false);
    setCategoria("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        Nuevo vencimiento
      </h2>

      {/* Descripción */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          placeholder="Ej: Alquiler, Factura..."
        />
      </div>

      {/* Categoría */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Categoría
        </label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          <option value="">Selecciona una categoría</option>
          {categoriasDisponibles.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
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
          value={montoARS}
          onChange={(e) => actualizarDesdeARS(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Monto en USD */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Monto en USD
        </label>
        <input
          type="number"
          value={montoUSD}
          onChange={(e) => actualizarDesdeUSD(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
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
          Fecha límite
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Recurrente */}
      <div className="mb-4 flex items-center gap-2">
        <input
          id="recurrente"
          type="checkbox"
          checked={recurrente}
          onChange={(e) => setRecurrente(e.target.checked)}
          className="form-checkbox text-purple-600"
        />
        <label
          htmlFor="recurrente"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Este vencimiento se repite todos los meses
        </label>
      </div>

      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mt-2"
      >
        Agregar
      </button>
    </form>
  );
}
