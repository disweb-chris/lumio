// src/pages/Vencimientos.jsx
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
import { useAuth } from "../context/AuthContext";
import VencimientoForm from "../components/VencimientoForm";
import AlertaVencimiento from "../components/AlertaVencimiento";
import { formatearMoneda } from "../utils/format";
import FiltroMes from "../components/FiltroMes";
import dayjs from "dayjs";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import { convertirUsdAArsFijo, convertirArsAUsdFijo } from "../utils/conversion";

export default function Vencimientos() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [vencimientos, setVencimientos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);
  const [editando, setEditando] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(
    dayjs().format("YYYY-MM")
  );
  const [verPagados, setVerPagados] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "vencimientos"),
      where("uid", "==", uid),
      orderBy("fecha", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setVencimientos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCargando(false);
      },
      (err) => console.warn("Error al cargar vencimientos:", err)
    );
    obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));
    return () => unsub();
  }, [uid]);

  // Marca/desmarca pagado y crea/elimina gasto asociado
  const togglePagado = async (id, pagado, item) => {
    const ref = doc(db, "vencimientos", id);
    if (!pagado) {
      await updateDoc(ref, { pagado: true });
      const gasto = {
        uid,
        categoria: item.categoria,
        descripcion: item.descripcion,
        metodoPago: item.metodoPago,
        fecha: item.fecha,
        timestamp: Timestamp.now(),
      };
      if (item.moneda === "USD") {
        gasto.moneda = "USD";
        gasto.montoUSD = item.montoUSD;
        gasto.montoARSConvertido = item.montoARSConvertido;
        gasto.cotizacionAlMomento = item.cotizacionAlMomento;
      } else {
        gasto.moneda = "ARS";
        gasto.montoARS = item.montoARS;
        gasto.montoUSDConvertido = item.montoUSDConvertido;
        gasto.cotizacionAlMomento = item.cotizacionAlMomento;
      }
      const gastoRef = await addDoc(collection(db, "gastos"), gasto);
      await updateDoc(ref, { idGasto: gastoRef.id });
    } else {
      await updateDoc(ref, { pagado: false });
      if (item.idGasto) {
        await deleteDoc(doc(db, "gastos", item.idGasto));
        await updateDoc(ref, { idGasto: null });
      }
    }
  };

  // Eliminar vencimiento (y gasto asociado si existe)
  const eliminarVencimiento = async (item) => {
    if (window.confirm("¿Eliminar este vencimiento?")) {
      if (item.pagado && item.idGasto) {
        await deleteDoc(doc(db, "gastos", item.idGasto));
      }
      await deleteDoc(doc(db, "vencimientos", item.id));
    }
  };

  // Agregar y actualizar con conversión fija
  const handleAgregar = async (nuevo) => {
    const cot = cotizacionUSD;
    const base = { ...nuevo, uid, pagado: false, categoria: nuevo.categoria };
    if (nuevo.montoUSD != null) {
      const conv = convertirUsdAArsFijo(nuevo.montoUSD, cot);
      Object.assign(base, {
        moneda: "USD",
        montoUSD: parseFloat(conv.montoUSD),
        montoARSConvertido: parseFloat(conv.montoARSConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
      });
    } else {
      const conv = convertirArsAUsdFijo(nuevo.montoARS, cot);
      Object.assign(base, {
        moneda: "ARS",
        montoARS: parseFloat(conv.montoARS),
        montoUSDConvertido: parseFloat(conv.montoUSDConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
      });
    }
    await addDoc(collection(db, "vencimientos"), base);
  };

  const handleActualizar = async (nuevo) => {
    const cot = cotizacionUSD;
    const ref = doc(db, "vencimientos", nuevo.id);
    const data = { ...nuevo };
    delete data.id;
    if (nuevo.montoUSD != null) {
      const conv = convertirUsdAArsFijo(nuevo.montoUSD, cot);
      Object.assign(data, {
        moneda: "USD",
        montoUSD: parseFloat(conv.montoUSD),
        montoARSConvertido: parseFloat(conv.montoARSConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
        montoARS: null,
        montoUSDConvertido: null,
      });
    } else {
      const conv = convertirArsAUsdFijo(nuevo.montoARS, cot);
      Object.assign(data, {
        moneda: "ARS",
        montoARS: parseFloat(conv.montoARS),
        montoUSDConvertido: parseFloat(conv.montoUSDConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
        montoUSD: null,
        montoARSConvertido: null,
      });
    }
    await updateDoc(ref, data);
    setEditando(null);
  };

  // Filtrar por mes y estado pagado
  const lista = vencimientos
    .filter((v) =>
      mesSeleccionado === "todos"
        ? true
        : dayjs(
            v.fecha?.toDate ? v.fecha.toDate() : v.fecha
          ).format("YYYY-MM") === mesSeleccionado
    )
    .filter((v) => (verPagados ? v.pagado : !v.pagado));

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Cargando vencimientos…
      </div>
    );
  }

  return (
    <div>
      <VencimientoForm
        onAgregar={handleAgregar}
        onActualizar={handleActualizar}
        editando={editando}
        onCancelEdit={() => setEditando(null)}
        cotizacionUSD={cotizacionUSD}
      />

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <FiltroMes
          items={vencimientos}
          onMesChange={setMesSeleccionado}
          onFiltrar={() => {}}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={verPagados}
            onChange={(e) => setVerPagados(e.target.checked)}
          />
          Ver vencimientos pagados
        </label>
      </div>

      <ul className="space-y-2">
        {lista.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-300">
            No hay vencimientos para este filtro.
          </p>
        ) : (
          lista.map((item) => {
            const dateObj = item.fecha?.toDate ? item.fecha.toDate() : new Date(item.fecha);
            // Garantizar valores numéricos para toFixed
            const usdAmount = Number(item.montoUSD ?? item.montoUSDConvertido ?? 0).toFixed(2);
            const arsAmount = Number(item.montoARS ?? item.montoARSConvertido ?? 0);
            const arsFormatted = formatearMoneda(arsAmount);
            return (
              <li
                key={item.id}
                className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
              >
                <div>
                  <p className="text-lg font-semibold">{item.descripcion}</p>
                  <p className="text-sm text-gray-500">
                    Fecha: {dayjs(dateObj).format("DD/MM/YYYY")}
                  </p>
                  <p className="text-sm text-gray-500">
                    Monto:{' '}
                    {item.moneda === 'USD'
                      ? `u$d ${item.montoUSD.toFixed(2)} / $${formatearMoneda(item.montoARSConvertido)}`
                      : `$${formatearMoneda(item.montoARS)} / u$d ${item.montoUSDConvertido.toFixed(2)}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Categoría: {item.categoria}
                  </p>
                  {item.recurrente && (
                    <span className="text-xs text-purple-500 font-semibold block mt-1">
                      🔁 Recurrente mensual
                    </span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <AlertaVencimiento fecha={item.fecha} pagado={item.pagado} />
                  <button
                    onClick={() => togglePagado(item.id, item.pagado, item)}
                    className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {item.pagado ? 'Desmarcar' : 'Marcar pagado'}
                  </button>
                  <button
                    onClick={() => setEditando(item)}
                    className="text-sm px-2 py-1 rounded bg-yellow-100 text-yellow-800 border hover:bg-yellow-200"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => eliminarVencimiento(item)}
                    className="text-sm px-2 py-1 rounded bg-white text-red-600 border hover:bg-red-100"
                  >
                    🗑
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
