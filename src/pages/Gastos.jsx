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

export default function Gastos() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [gastos, setGastos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [abiertos, setAbiertos] = useState([dayjs().format("YYYY-MM")]);
  const [cargando, setCargando] = useState(true);

  // Convierte "YYYY-MM-DD" en Date a las 12:00 de ese día, hora local
  const toNoonLocal = (dateStrOrDate) => {
    if (dateStrOrDate instanceof Date) {
      const d = dateStrOrDate;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    }
    // string "YYYY-MM-DD"
    const [year, month, day] = dateStrOrDate.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  // 1) Suscripción a Firestore
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

  // 2) Agregar gasto con conversión y fecha a mediodía
  const agregarGasto = async (nuevo) => {
    const cot = await obtenerCotizacionUSD();
    const fechaDate = toNoonLocal(nuevo.fecha);
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

  // 3) Actualizar gasto con la misma lógica de fecha
  const actualizarGasto = async (nuevo) => {
    const cot = await obtenerCotizacionUSD();
    const ref = doc(db, "gastos", nuevo.id);
    const fechaDate = toNoonLocal(nuevo.fecha);
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

  // 4) Eliminar
  const eliminarGasto = async (id) => {
    if (window.confirm("¿Eliminar este gasto?")) {
      await deleteDoc(doc(db, "gastos", id));
    }
  };

  // 5) Agrupar por mes
  const gastosPorMes = gastos.reduce((acc, g) => {
    const raw = g.fecha;
    const date = raw.toDate ? raw.toDate() : new Date(raw);
    const mes = dayjs(date).format("YYYY-MM");
    (acc[mes] ??= []).push(g);
    return acc;
  }, {});

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Cargando gastos…
      </div>
    );
  }

  return (
    <div>
      <GastoForm
        onAgregarGasto={agregarGasto}
        editando={editando}
        onActualizarGasto={actualizarGasto}
        onCancelEdit={() => setEditando(null)}
      />

      {Object.keys(gastosPorMes)
        .sort()
        .reverse()
        .map((mes) => (
          <div key={mes} className="mb-4">
            <button
              onClick={() =>
                setAbiertos((prev) =>
                  prev.includes(mes)
                    ? prev.filter((m) => m !== mes)
                    : [...prev, mes]
                )
              }
              className="w-full text-left bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded font-semibold"
            >
              {dayjs(mes + "-01").format("MMMM YYYY")} (
              {gastosPorMes[mes].length}) {abiertos.includes(mes) ? "▲" : "▼"}
            </button>

            {abiertos.includes(mes) && (
              <ul className="mt-2 space-y-3">
                {gastosPorMes[mes].map((g) => {
                  const raw = g.fecha;
                  const dateObj = raw.toDate
                    ? raw.toDate()
                    : new Date(raw);
                  return (
                    <li
                      key={g.id}
                      className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-start"
                    >
                      <div>
                        <p className="text-lg font-semibold">
                          {g.descripcion}
                        </p>
                        <p className="text-sm text-gray-500">
                          Monto:{" "}
                          {g.moneda === "USD"
                            ? `u$d ${parseFloat(g.montoUSD).toFixed(2)}`
                            : `$${formatearMoneda(g.montoARS)} ARS`}
                        </p>
                        <p className="text-sm text-gray-500">
                          Categoría: {g.categoria}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {dayjs(dateObj).format("DD/MM/YYYY")}
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
