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
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import GastoForm from "../components/GastoForm";
import { formatearMoneda } from "../utils/format";
import dayjs from "dayjs";
import { obtenerCotizacionUSD } from "../utils/configuracion";

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);
  const [editando, setEditando] = useState(null);
  const [abiertos, setAbiertos] = useState([dayjs().format("YYYY-MM")]);

  /* carga datos */
  useEffect(() => {
    const q = query(collection(db, "gastos"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));
    return () => unsub();
  }, []);

  /* CRUD */
  const agregarGasto = async (nuevo) => {
    await addDoc(collection(db, "gastos"), {
      ...nuevo,
      fecha: Timestamp.fromDate(new Date(nuevo.fecha)),
      timestamp: Timestamp.now(),
    });
  };

  const actualizarGasto = async (g) => {
    await updateDoc(doc(db, "gastos", g.id), g);
    setEditando(null);
  };

  const eliminarGasto = async (id) =>
    window.confirm("¿Eliminar este gasto?") &&
    deleteDoc(doc(db, "gastos", id));

  /* agrupación */
  const gastosPorMes = gastos.reduce((acc, g) => {
    const mes = dayjs(g.fecha?.toDate?.() || g.fecha).format("YYYY-MM");
    (acc[mes] ??= []).push(g);
    return acc;
  }, {});

  const toggleMes = (m) =>
    setAbiertos((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );

  /* helpers UI */
  const mostrarARSyUSD = (m) =>
    `$${formatearMoneda(m)} ARS / u$d ${(m / cotizacionUSD).toFixed(2)}`;

  /* mapping method → badge classes */
  const badge = {
    Efectivo: "bg-green-100 text-green-800",
    Transferencia: "bg-blue-100 text-blue-800",
    "Mercado Pago": "bg-amber-100 text-amber-800",
    Tarjeta: "bg-purple-100 text-purple-800",
    Default: "bg-gray-200 text-gray-800",
  };

  const getBadgeCls = (metodo) => {
    if (metodo?.startsWith("Tarjeta")) return badge.Tarjeta;
    return badge[metodo] || badge.Default;
  };

  /* render */
  return (
    <div>
      <GastoForm
        cotizacionUSD={cotizacionUSD}
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
              onClick={() => toggleMes(mes)}
              className="w-full text-left bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded font-semibold"
            >
              {dayjs(mes + "-01").format("MMMM YYYY")} (
              {gastosPorMes[mes].length}) {abiertos.includes(mes) ? "▲" : "▼"}
            </button>

            {abiertos.includes(mes) && (
              <ul className="mt-2 space-y-3">
                {gastosPorMes[mes].map((g) => (
                  <li
                    key={g.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-start"
                  >
                    <div>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        {g.descripcion}
                        {g.metodoPago?.toLowerCase().includes("tarjeta") && (
                          <span className="text-purple-500">💳</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Monto: {mostrarARSyUSD(g.monto)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Categoría: {g.categoria}
                      </p>

                      {/* badge método */}
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${getBadgeCls(
                          g.metodoPago
                        )}`}
                      >
                        {g.metodoPago}
                      </span>

                      <p className="text-sm text-gray-400 mt-1">
                        {dayjs(g.fecha?.toDate?.() || g.fecha).format(
                          "DD/MM/YYYY"
                        )}
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
                ))}
              </ul>
            )}
          </div>
        ))}
    </div>
  );
}
