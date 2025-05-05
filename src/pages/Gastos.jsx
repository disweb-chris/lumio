// src/pages/Gastos.jsx
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import GastoForm from "../components/GastoForm";
import { formatearMoneda } from "../utils/format";
import dayjs from "dayjs";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import { convertirUsdAArsFijo, convertirArsAUsdFijo } from "../utils/conversion";
import { esPagoConTarjeta } from "../utils/pago";
import FiltroMes from "../components/FiltroMes";

export default function Gastos() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Datos
  const [gastos, setGastos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [openCats, setOpenCats] = useState({}); // acordeón

  // Mes seleccionado para filtrar
  const [mesSeleccionado, setMesSeleccionado] = useState(
    dayjs().format("YYYY-MM")
  );

  // Suscripción a Firestore: todos los gastos del usuario
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "gastos"),
      where("uid", "==", uid),
      orderBy("fecha", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCargando(false);
      },
      (err) => console.warn("Error al cargar gastos:", err)
    );
    return () => unsub();
  }, [uid]);
  // Agregar gasto
  const agregarGasto = async (nuevo) => {
    const cot = await obtenerCotizacionUSD();
    const fechaDate = new Date(nuevo.fecha + "T12:00:00");
    const docData = {
      uid,
      categoria: nuevo.categoria,
      descripcion: nuevo.descripcion,
      metodoPago: nuevo.metodoPago,
      fecha: Timestamp.fromDate(fechaDate),
      timestamp: Timestamp.now(),
    };
    if (nuevo.montoUSD != null) {
      const conv = convertirUsdAArsFijo(nuevo.montoUSD, cot);
      Object.assign(docData, {
        moneda: "USD",
        montoUSD: parseFloat(conv.montoUSD),
        montoARSConvertido: parseFloat(conv.montoARSConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
      });
    } else {
      const conv2 = convertirArsAUsdFijo(nuevo.monto, cot);
      Object.assign(docData, {
        moneda: "ARS",
        montoARS: parseFloat(conv2.montoARS),
        montoUSDConvertido: parseFloat(conv2.montoUSDConvertido),
        cotizacionAlMomento: parseFloat(conv2.cotizacionAlMomento),
      });
    }
    await addDoc(collection(db, "gastos"), docData);
  };

  // Actualizar gasto
  const actualizarGasto = async (nuevo) => {
    const cot = await obtenerCotizacionUSD();
    const ref = doc(db, "gastos", nuevo.id);
    const fechaDate = new Date(nuevo.fecha + "T12:00:00");
    const updated = {
      categoria: nuevo.categoria,
      descripcion: nuevo.descripcion,
      metodoPago: nuevo.metodoPago,
      fecha: Timestamp.fromDate(fechaDate),
    };
    if (nuevo.montoUSD != null) {
      const conv = convertirUsdAArsFijo(nuevo.montoUSD, cot);
      Object.assign(updated, {
        moneda: "USD",
        montoUSD: parseFloat(conv.montoUSD),
        montoARSConvertido: parseFloat(conv.montoARSConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
        montoARS: null,
        montoUSDConvertido: null,
      });
    } else {
      const conv2 = convertirArsAUsdFijo(nuevo.monto, cot);
      Object.assign(updated, {
        moneda: "ARS",
        montoARS: parseFloat(conv2.montoARS),
        montoUSDConvertido: parseFloat(conv2.montoUSDConvertido),
        cotizacionAlMomento: parseFloat(conv2.cotizacionAlMomento),
        montoUSD: null,
        montoARSConvertido: null,
      });
    }
    await updateDoc(ref, updated);
    setEditando(null);
  };

  // Eliminar gasto
  const eliminarGasto = async (id) => {
    if (window.confirm("¿Eliminar este gasto?")) {
      await deleteDoc(doc(db, "gastos", id));
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Cargando gastos…
      </div>
    );
  }
  // Filtrar solo los gastos del mes seleccionado
  const gastosFiltradosMes = gastos.filter((g) => {
    const fecha = g.fecha?.toDate
      ? g.fecha.toDate()
      : new Date(g.fecha);
    return dayjs(fecha).format("YYYY-MM") === mesSeleccionado;
  });

  // Agrupar por categoría
  const gastosPorCategoria = gastosFiltradosMes.reduce((acc, g) => {
    const cat = g.categoria || "Sin categoría";
    (acc[cat] ??= []).push(g);
    return acc;
  }, {});

  const toggleCat = (cat) =>
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div>
      {/* Selector de mes */}
      <div className="mb-4">
        <FiltroMes items={gastos} onMesChange={setMesSeleccionado} />
      </div>

      {/* Formulario */}
      <GastoForm
        onAgregarGasto={agregarGasto}
        editando={editando}
        onActualizarGasto={actualizarGasto}
        onCancelEdit={() => setEditando(null)}
      />

      {/* Listado agrupado por categoría */}
      {Object.entries(gastosPorCategoria).map(([categoria, items]) => (
        <div
          key={categoria}
          className="mb-4 border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleCat(categoria)}
            className="w-full text-left bg-gray-200 dark:bg-gray-700 px-4 py-2 flex justify-between items-center"
          >
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {categoria} ({items.length})
            </span>
            <span className="text-xl">
              {openCats[categoria] ? "−" : "+"}
            </span>
          </button>
          {openCats[categoria] && (
            <ul className="divide-y divide-gray-300 dark:divide-gray-600">
              {items.map((g) => {
                const raw = g.fecha;
                const dateObj = raw.toDate
                  ? raw.toDate()
                  : new Date(raw);
                const isTarjeta = esPagoConTarjeta(g.metodoPago);
                return (
                  <li
                    key={g.id}
                    className={`px-4 py-3 bg-white dark:bg-gray-800 flex justify-between items-start ${
                      isTarjeta ? "border-l-4 border-blue-500" : ""
                    }`}
                  >
                    <div>
                      <p className="text-lg font-semibold flex items-center">
                        {isTarjeta && (
                          <span className="mr-2 text-blue-600">💳</span>
                        )}
                        {g.descripcion}
                      </p>
                      <p className="text-sm text-gray-500">
                        Monto:{" "}
                        {g.moneda === "USD"
                          ? `u$d ${parseFloat(g.montoUSD).toFixed(2)}`
                          : `$${formatearMoneda(g.montoARS)}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Fecha: {dayjs(dateObj).format("DD/MM/YYYY")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <button
                        onClick={() => setEditando(g)}
                        className="text-blue-600 border border-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-50"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => eliminarGasto(g.id)}
                        className="text-red-600 border border-red-600 px-3 py-1 rounded text-sm hover:bg-red-50"
                      >
                        🗑 Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
