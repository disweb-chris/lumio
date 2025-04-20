// src/components/VencimientoForm.jsx
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { convertirUsdAArsFijo } from "../utils/conversion";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function VencimientoForm({
  onAgregar,
  onActualizar,
  editando,
  cotizacionUSD = 1,
}) {
  const { user } = useAuth();
  const uid = user.uid;

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

  /* ───────── cargar categorías del usuario ───────── */
  useEffect(() => {
    if (!uid) return;
    // Sólo categorías que tengan uid === tu uid
    const q = query(
      collection(db, "categorias"),
      where("uid", "==", uid),
      orderBy("nombre", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((doc) => doc.data().nombre);
      setCategoriasDisponibles(lista);
    });
    return () => unsub();
  }, [uid]);

  /* ───────── cargar datos al editar ───────── */
  useEffect(() => {
    if (editando) {
      setDescripcion(editando.descripcion || "");
      setMontoARS(editando.monto?.toString() || "");
      setMontoUSD(
        editando.monto
          ? (parseFloat(editando.monto) / cotizacionUSD).toFixed(2)
          : ""
      );
      setFecha(
        editando.fecha?.toDate
          ? editando.fecha.toDate().toISOString().split("T")[0]
          : editando.fecha || ""
      );
      setMetodoPago(
        editando.metodoPago?.includes("Tarjeta")
          ? "Tarjeta de crédito"
          : editando.metodoPago
      );
      setSubMetodo(
        editando.metodoPago?.includes("Tarjeta")
          ? editando.metodoPago.split(":")[1]?.trim()
          : ""
      );
      setRecurrente(editando.recurrente || false);
      setCategoria(editando.categoria || "");
    }
  }, [editando, cotizacionUSD]);

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

    // Incluimos uid aquí
    const nuevo = {
      uid,
      descripcion,
      monto: tieneARS ? montoARSnum : null,
      montoUSD: tieneUSD ? montoUSDnum : null,
      fecha,
      metodoPago: metodoFinal,
      recurrente,
      categoria,
    };

    if (tieneUSD) {
      const conversion = convertirUsdAArsFijo(montoUSD, cotizacionUSD);
      if (conversion) {
        nuevo.montoARSConvertido = parseFloat(conversion.montoARSConvertido);
        nuevo.cotizacionAlMomento = parseFloat(
          conversion.cotizacionAlMomento
        );
      }
    }

    try {
      if (editando?.id) {
        onActualizar({ ...nuevo, id: editando.id });
        toast.success("✅ Vencimiento actualizado");
      } else {
        onAgregar(nuevo);
        toast.success("✅ Vencimiento agregado");
      }
    } catch (error) {
      console.error("❌ Error al guardar vencimiento:", error);
      toast.error("❌ Error al guardar el vencimiento");
    }

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
        {editando ? "Editar vencimiento" : "Nuevo vencimiento"}
      </h2>

      {/* Descripción */}
      {/* ... el resto de tu formulario tal cual ... */}

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

      {/* Resto del formulario... */}
      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mt-2"
      >
        {editando ? "Actualizar" : "Agregar"}
      </button>
    </form>
  );
}
