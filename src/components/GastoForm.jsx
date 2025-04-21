// src/components/GastoForm.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

export default function GastoForm({
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
  const [fecha, setFecha] = useState(
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

  // Cargar categorías autorizadas para este usuario
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "categorias"),
      where("uid", "==", uid),
      orderBy("nombre", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCategorias(data);
        if (!categoria && data.length) setCategoria(data[0].nombre);
      },
      (err) => {
        console.warn("Error al cargar categorías:", err);
      }
    );
    return () => unsub();
  }, [uid]);

  // Carga datos al editar
  useEffect(() => {
    if (editando) {
      setCategoria(editando.categoria || "");
      setDescripcion(editando.descripcion || "");
      setFecha(
        editando.fecha?.toDate
          ? editando.fecha.toDate().toISOString().split("T")[0]
          : editando.fecha
      );
      setMetodoPago(editando.metodoPago?.startsWith("Tarjeta") ? "Tarjeta de crédito" : editando.metodoPago || "Efectivo");
      setSubMetodo(
        editando.metodoPago?.startsWith("Tarjeta")
          ? editando.metodoPago.split(":")[1].trim()
          : ""
      );
      setMontoARS(
        editando.monto != null ? editando.monto.toString() : ""
      );
      setMontoUSD(
        editando.montoUSD != null ? editando.montoUSD.toString() : ""
      );
    } else {
      resetForm();
    }
  }, [editando, uid]);

  const resetForm = () => {
    setCategoria(categorias[0]?.nombre || "");
    setDescripcion("");
    setMontoARS("");
    setMontoUSD("");
    setMetodoPago("Efectivo");
    setSubMetodo("");
    setFecha(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoARSnum = parseFloat(montoARS);
    const montoUSDnum = parseFloat(montoUSD);
    const tieneARS = !isNaN(montoARSnum) && montoARSnum > 0;
    const tieneUSD = !isNaN(montoUSDnum) && montoUSDnum > 0;

    if (!descripcion || (!tieneARS && !tieneUSD) || !categoria || !fecha) {
      toast.error("❌ Completa todos los campos obligatorios.");
      return;
    }

    const metodoFinal =
      metodoPago === "Tarjeta de crédito" && subMetodo
        ? `Tarjeta: ${subMetodo}`
        : metodoPago;

    const nuevo = {
      categoria,
      descripcion,
      metodoPago: metodoFinal,
      fecha,
      monto: tieneARS ? montoARSnum : null,
      montoUSD: tieneUSD ? montoUSDnum : null,
    };

    try {
      if (editando && editando.id) {
        await onActualizarGasto({ id: editando.id, ...nuevo });
        toast.success("✅ Gasto actualizado");
      } else {
        await onAgregarGasto(nuevo);
        toast.success("✅ Gasto guardado correctamente");
      }
      resetForm();
      onCancelEdit && onCancelEdit();
    } catch (err) {
      console.error(err);
      toast.error("❌ Error al guardar gasto");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
        {editando ? "Editar gasto" : "Registrar gasto"}
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
          placeholder="Ej: Almuerzo, Transporte"
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
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
          {categorias.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.nombre}
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
          onChange={(e) => setMontoARS(e.target.value)}
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
          onChange={(e) => setMontoUSD(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Método de pago */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Método de pago
        </label>
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Mercado Pago">Mercado Pago</option>
          <option value="Tarjeta de crédito">Tarjeta de crédito</option>
        </select>
      </div>

      {/* Submétodo si Tarjeta */}
      {metodoPago === "Tarjeta de crédito" && (
        <div className="mb-2">
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Tarjeta usada
          </label>
          <select
            value={subMetodo}
            onChange={(e) => setSubMetodo(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
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
      <div className="mb-4">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Fecha
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editando ? "Actualizar" : "Agregar gasto"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={() => { resetForm(); onCancelEdit(); }}
            className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
