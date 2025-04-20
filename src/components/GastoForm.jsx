import { useEffect, useState } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { convertirUsdAArsFijo } from "../utils/conversion";
import { toast } from "react-toastify";

export default function GastoForm({
  cotizacionUSD,
  onAgregarGasto,
  editando = null,
  onActualizarGasto,
  onCancelEdit,
}) {
  const { user } = useAuth();
  const uid = user?.uid;

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

  /* ───────── cargar categorías del usuario ───────── */
  useEffect(() => {
    if (!user || !uid) return;
  
    try {
      const q = query(
        collection(db, "categorias"),
        where("uid", "==", uid),
        orderBy("nombre", "asc")
      );
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCategorias(data);
        if (data.length && !categoria) setCategoria(data[0].nombre);
      });
      return () => unsub();
    } catch (err) {
      console.error("Error al cargar categorías:", err.message);
    }
  }, [uid, user]);
  

  /* ───────── cargar datos al editar ───────── */
  useEffect(() => {
    if (editando) {
      setCategoria(editando.categoria || "");
      setDescripcion(editando.descripcion || "");
      setFecha(
        editando.fecha?.toDate
          ? editando.fecha.toDate().toISOString().split("T")[0]
          : editando.fecha
      );
      setMetodoPago(
        editando.metodoPago?.includes("Tarjeta")
          ? "Tarjeta de crédito"
          : editando.metodoPago || "Efectivo"
      );
      setSubMetodo(
        editando.metodoPago?.includes("Tarjeta")
          ? editando.metodoPago.split(":")[1]?.trim()
          : ""
      );
      setMontoARS(editando.monto?.toString() || "");
      setMontoUSD(
        editando.montoUSD?.toString() ||
          (editando.monto ? (editando.monto / cotizacionUSD).toFixed(2) : "")
      );
    } else {
      resetForm();
    }
  }, [editando]);

  const resetForm = () => {
    setCategoria(categorias[0]?.nombre || "");
    setDescripcion("");
    setMontoARS("");
    setMontoUSD("");
    setMetodoPago("Efectivo");
    setSubMetodo("");
    setFecha(new Date().toISOString().split("T")[0]);
  };

  const actualizarDesdeARS = (v) => {
    setMontoARS(v);
    const num = parseFloat(v);
    if (!isNaN(num) && cotizacionUSD > 0)
      setMontoUSD((num / cotizacionUSD).toFixed(2));
    else setMontoUSD("");
  };

  const actualizarDesdeUSD = (v) => {
    setMontoUSD(v);
    const num = parseFloat(v);
    if (!isNaN(num) && cotizacionUSD > 0)
      setMontoARS((num * cotizacionUSD).toFixed(2));
    else setMontoARS("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const montoARSnum = parseFloat(montoARS);
    const montoUSDnum = parseFloat(montoUSD);
    const tieneARS = !isNaN(montoARSnum) && montoARSnum > 0;
    const tieneUSD = !isNaN(montoUSDnum) && montoUSDnum > 0;

    if (!descripcion || (!tieneARS && !tieneUSD) || !fecha || !categoria) {
      toast.error("❌ Completa todos los campos obligatorios.");
      return;
    }

    const metodoFinal =
      metodoPago === "Tarjeta de crédito" && subMetodo
        ? `Tarjeta: ${subMetodo}`
        : metodoPago;

    const base = {
      uid,
      categoria,
      descripcion,
      metodoPago: metodoFinal,
      fecha, // se convierte a Date en Gastos.jsx
      monto: tieneARS ? montoARSnum : null,
      montoUSD: tieneUSD ? montoUSDnum : null,
    };

    if (tieneUSD) {
      const conv = convertirUsdAArsFijo(montoUSD, cotizacionUSD);
      if (conv) {
        base.montoARSConvertido = parseFloat(conv.montoARSConvertido);
        base.cotizacionAlMomento = parseFloat(conv.cotizacionAlMomento);
      }
    }

    try {
      if (editando) {
        await onActualizarGasto({ ...editando, ...base });
        toast.success("✅ Gasto actualizado");
      } else {
        await onAgregarGasto(base);
        toast.success("✅ Gasto guardado correctamente");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("❌ Error al guardar gasto");
    }
  };

  const subOpcionesTarjeta = [
    "Ualá Emma",
    "Ualá Chris",
    "Naranja X",
    "Visa Santander",
    "Amex Santander",
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        {editando ? "Editar gasto" : "Registrar gasto"}
      </h2>

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

      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Método de pago
        </label>
        <select
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={metodoPago}
          onChange={(e) => {
            setMetodoPago(e.target.value);
            if (e.target.value !== "Tarjeta de crédito") setSubMetodo("");
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

      <div className="flex gap-3 mt-3">
        <button
          type="submit"
          className={`${
            editando ? "bg-blue-600" : "bg-green-600"
          } text-white px-4 py-2 rounded hover:opacity-90`}
        >
          {editando ? "Actualizar gasto" : "Agregar gasto"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={() => {
              onCancelEdit();
              resetForm();
            }}
            className="px-4 py-2 rounded bg-gray-500 text-white hover:opacity-90"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
