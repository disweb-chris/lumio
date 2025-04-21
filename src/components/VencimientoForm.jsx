// src/components/VencimientoForm.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { convertirUsdAArsFijo, convertirArsAUsdFijo } from "../utils/conversion";

export default function VencimientoForm({
  onAgregar,
  onActualizar,
  editando,
  onCancelEdit,
  cotizacionUSD = 1,
}) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [descripcion, setDescripcion] = useState("");
  const [montoARS, setMontoARS] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [subMetodo, setSubMetodo] = useState("");
  const [recurrente, setRecurrente] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);

  const subOpcionesTarjeta = [
    "Ualá Emma",
    "Ualá Chris",
    "Naranja X",
    "Visa Santander",
    "Amex Santander",
  ];

  // Carga categorías
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "categorias"),
      where("uid", "==", uid),
      orderBy("nombre", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data().nombre);
      setCategoriasDisponibles(list);
      // set default categoria if none
      if (!categoria && list.length) setCategoria(list[0]);
    });
    return () => unsub();
  }, [uid]);

  // Rellenar datos al editar
  useEffect(() => {
    if (editando) {
      setDescripcion(editando.descripcion || "");
      // fecha
      setFecha(
        editando.fecha?.toDate
          ? editando.fecha.toDate().toISOString().split("T")[0]
          : editando.fecha || new Date().toISOString().split("T")[0]
      );
      // metodo pago y submetodo
      if (editando.metodoPago?.includes("Tarjeta")) {
        setMetodoPago("Tarjeta de crédito");
        setSubMetodo(editando.metodoPago.split(":")[1]?.trim() || "");
      } else {
        setMetodoPago(editando.metodoPago || "Efectivo");
        setSubMetodo("");
      }
      setRecurrente(!!editando.recurrente);
      setCategoria(editando.categoria || "");
      // montos
      if (editando.moneda === "ARS" || editando.montoARS != null) {
        const ars = editando.montoARS ?? editando.montoARSConvertido;
        setMontoARS(ars?.toString() || "");
        setMontoUSD(
          ars && cotizacionUSD > 0 ? (ars / cotizacionUSD).toFixed(2) : ""
        );
      } else {
        const usd = editando.montoUSD ?? editando.montoUSDConvertido;
        setMontoUSD(usd?.toString() || "");
        setMontoARS(
          usd && cotizacionUSD > 0 ? (usd * cotizacionUSD).toFixed(2) : ""
        );
      }
    } else {
      // reset formulario
      setDescripcion("");
      setMontoARS("");
      setMontoUSD("");
      setFecha(new Date().toISOString().split("T")[0]);
      setMetodoPago("Efectivo");
      setSubMetodo("");
      setRecurrente(false);
      setCategoria(categoriasDisponibles[0] || "");
    }
  }, [editando, cotizacionUSD, categoriasDisponibles]);

  const actualizarDesdeARS = (v) => {
    setMontoARS(v);
    const num = parseFloat(v);
    if (!isNaN(num) && cotizacionUSD > 0) setMontoUSD((num / cotizacionUSD).toFixed(2));
  };
  const actualizarDesdeUSD = (v) => {
    setMontoUSD(v);
    const num = parseFloat(v);
    if (!isNaN(num) && cotizacionUSD > 0) setMontoARS((num * cotizacionUSD).toFixed(2));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ars = parseFloat(montoARS);
    const usd = parseFloat(montoUSD);
    const tieneARS = !isNaN(ars) && ars > 0;
    const tieneUSD = !isNaN(usd) && usd > 0;
    if (!descripcion || (!tieneARS && !tieneUSD) || !fecha || !categoria) {
      toast.error("❌ Completa todos los campos.");
      return;
    }
    const metodo = metodoPago === "Tarjeta de crédito" && subMetodo
      ? `Tarjeta: ${subMetodo}`
      : metodoPago;
    // objeto a guardar
    const base = {
      uid,
      descripcion,
      fecha,
      metodoPago: metodo,
      recurrente,
      categoria,
    };
    if (tieneARS) {
      const conv = convertirArsAUsdFijo(ars, cotizacionUSD);
      Object.assign(base, {
        moneda: "ARS",
        montoARS: ars,
        montoUSDConvertido: parseFloat(conv.montoUSDConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
      });
    }
    if (tieneUSD) {
      const conv = convertirUsdAArsFijo(usd, cotizacionUSD);
      Object.assign(base, {
        moneda: "USD",
        montoUSD: usd,
        montoARSConvertido: parseFloat(conv.montoARSConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
      });
    }

    try {
      if (editando?.id) {
        await onActualizar({ id: editando.id, ...base });
        toast.success("✅ Vencimiento actualizado");
      } else {
        await onAgregar(base);
        toast.success("✅ Vencimiento agregado");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Error guardando vencimiento");
    }

    // limpiar y notificar cancel
    onCancelEdit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        {editando ? "Editar vencimiento" : "Nuevo vencimiento"}
      </h2>

      {/* Descripción */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Descripción</label>
        <input
          type="text"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Monto ARS y USD */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className="block text-sm text-gray-700 dark:text-gray-300">Monto ARS</label>
          <input
            type="number"
            value={montoARS}
            onChange={e => actualizarDesdeARS(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-700 dark:text-gray-300">Monto USD</label>
          <input
            type="number"
            value={montoUSD}
            onChange={e => actualizarDesdeUSD(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Fecha */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Método de pago */}
      <div className="mb-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Método de pago</label>
        <select
          value={metodoPago}
          onChange={e => { setMetodoPago(e.target.value); setSubMetodo(""); }}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Mercado Pago">Mercado Pago</option>
          <option value="Tarjeta de crédito">Tarjeta de crédito</option>
        </select>
      </div>

      {/* Submétodo tarjeta */}
      {metodoPago === "Tarjeta de crédito" && (
        <div className="mb-2">
          <label className="block text-sm text-gray-700 dark:text-gray-300">Tarjeta</label>
          <select
            value={subMetodo}
            onChange={e => setSubMetodo(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          >
            <option value="">Selecciona una tarjeta</option>
            {subOpcionesTarjeta.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
        </div>
      )}

      {/* Recurrente */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="rec"
          checked={recurrente}
          onChange={e => setRecurrente(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="rec" className="text-sm text-gray-700 dark:text-gray-300">Recurrente mensual</label>
      </div>

      {/* Categoría */}
      <div className="mb-4">
        <label className="block text-sm text-gray-700 dark:text-gray-300">Categoría</label>
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          <option value="">Selecciona una categoría</option>
          {categoriasDisponibles.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          {editando ? "Actualizar" : "Agregar"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={() => onCancelEdit && onCancelEdit()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
