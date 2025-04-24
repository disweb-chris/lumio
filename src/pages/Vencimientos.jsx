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
import { toast } from "react-toastify";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import { convertirUsdAArsFijo, convertirArsAUsdFijo } from "../utils/conversion";

export default function Vencimientos() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [vencimientos, setVencimientos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);
  const [editando, setEditando] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(dayjs().format("YYYY-MM"));
  const [verPagados, setVerPagados] = useState(false);
  const [cargando, setCargando] = useState(true);

  // 1) Suscripción a Firestore
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "vencimientos"),
      where("uid", "==", uid),
      orderBy("fecha", "asc")
    );
    const unsub = onSnapshot(
      q,
      snap => {
        setVencimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCargando(false);
      },
      err => console.warn("Error al cargar vencimientos:", err)
    );
    obtenerCotizacionUSD().then(v => v && setCotizacionUSD(v));
    return () => unsub();
  }, [uid]);

  // 2) Marcar/desmarcar pagado y manejar recurrentes
  const togglePagado = async (id, pagado, item) => {
    const ref = doc(db, "vencimientos", id);

    if (!pagado) {
      // A) Marcar pagado
      await updateDoc(ref, { pagado: true });

      // B) Crear gasto asociado
      const gasto = {
        uid,
        categoria: item.categoria,
        descripcion: item.descripcion,
        metodoPago: item.metodoPago,
        fecha: item.fecha,
        timestamp: Timestamp.now(),
      };
      if (item.moneda === "USD") {
        Object.assign(gasto, {
          moneda: "USD",
          montoUSD: item.montoUSD,
          montoARSConvertido: item.montoARSConvertido,
          cotizacionAlMomento: item.cotizacionAlMomento,
        });
      } else {
        Object.assign(gasto, {
          moneda: "ARS",
          montoARS: item.montoARS,
          montoUSDConvertido: item.montoUSDConvertido,
          cotizacionAlMomento: item.cotizacionAlMomento,
        });
      }
      const gastoRef = await addDoc(collection(db, "gastos"), gasto);
      await updateDoc(ref, { idGasto: gastoRef.id });

      // C) Si es recurrente, clonar al mes siguiente
      if (item.recurrente) {
        const actualDate = item.fecha?.toDate
          ? item.fecha.toDate()
          : item.fecha instanceof Date
          ? item.fecha
          : new Date(item.fecha);

        const next = dayjs(actualDate)
          .add(1, "month")
          .hour(0)
          .minute(0)
          .second(0)
          .toDate();

        const nuevoVto = {
          uid,
          descripcion: item.descripcion,
          fecha: Timestamp.fromDate(next),
          metodoPago: item.metodoPago,
          recurrente: true,
          categoria: item.categoria,
          moneda: item.moneda,
          montoARS: item.montoARS ?? null,
          montoARSConvertido: item.montoARSConvertido ?? null,
          montoUSD: item.montoUSD ?? null,
          montoUSDConvertido: item.montoUSDConvertido ?? null,
          cotizacionAlMomento: item.cotizacionAlMomento ?? null,
          pagado: false,
          idGasto: null,
        };
        await addDoc(collection(db, "vencimientos"), nuevoVto);

        const mesSig = dayjs(next).format("YYYY-MM");
        const fmt = dayjs(next).format("DD/MM/YYYY");
        toast.success(`Nuevo vencimiento para ${fmt}`);
        setMesSeleccionado(mesSig);
      }
    } else {
      // Desmarcar y borrar gasto
      await updateDoc(ref, { pagado: false });
      if (item.idGasto) {
        await deleteDoc(doc(db, "gastos", item.idGasto));
        await updateDoc(ref, { idGasto: null });
      }
    }
  };

  // 3) Eliminar vencimiento (y gasto si existiera)
  const eliminarVencimiento = async item => {
    if (!window.confirm("¿Eliminar este vencimiento?")) return;
    if (item.pagado && item.idGasto) {
      await deleteDoc(doc(db, "gastos", item.idGasto));
    }
    await deleteDoc(doc(db, "vencimientos", item.id));
  };

  // 4) Agregar nuevo vencimiento
  const handleAgregar = async nuevo => {
    const fechaDate = new Date(`${nuevo.fecha}T00:00`);
    const base = {
      ...nuevo,
      uid,
      pagado: false,
      categoria: nuevo.categoria,
      fecha: Timestamp.fromDate(fechaDate),
    };

    if (nuevo.montoUSD != null) {
      const conv = convertirUsdAArsFijo(nuevo.montoUSD, cotizacionUSD);
      Object.assign(base, {
        moneda: "USD",
        montoUSD: parseFloat(conv.montoUSD),
        montoARSConvertido: parseFloat(conv.montoARSConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
      });
    } else {
      const conv = convertirArsAUsdFijo(nuevo.montoARS, cotizacionUSD);
      Object.assign(base, {
        moneda: "ARS",
        montoARS: parseFloat(conv.montoARS),
        montoUSDConvertido: parseFloat(conv.montoUSDConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
      });
    }

    await addDoc(collection(db, "vencimientos"), base);
  };

  // 5) Actualizar vencimiento existente
  const handleActualizar = async nuevo => {
    const ref = doc(db, "vencimientos", nuevo.id);
    const datos = { ...nuevo };
    delete datos.id;

    datos.fecha = Timestamp.fromDate(new Date(`${nuevo.fecha}T00:00`));

    if (nuevo.montoUSD != null) {
      const conv = convertirUsdAArsFijo(nuevo.montoUSD, cotizacionUSD);
      Object.assign(datos, {
        moneda: "USD",
        montoUSD: parseFloat(conv.montoUSD),
        montoARSConvertido: parseFloat(conv.montoARSConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
        montoARS: null,
        montoUSDConvertido: null,
      });
    } else {
      const conv = convertirArsAUsdFijo(nuevo.montoARS, cotizacionUSD);
      Object.assign(datos, {
        moneda: "ARS",
        montoARS: parseFloat(conv.montoARS),
        montoUSDConvertido: parseFloat(conv.montoUSDConvertido),
        cotizacionAlMomento: parseFloat(conv.cotizacionAlMomento),
        montoUSD: null,
        montoARSConvertido: null,
      });
    }

    await updateDoc(ref, datos);
    setEditando(null);
  };

  // 6) Filtrar lista por mes y estado
  const lista = vencimientos
    .filter(v => {
      const dateObj = v.fecha?.toDate
        ? v.fecha.toDate()
        : v.fecha instanceof Date
        ? v.fecha
        : new Date(v.fecha);
      if (mesSeleccionado === "todos") return true;
      return dayjs(dateObj).format("YYYY-MM") === mesSeleccionado;
    })
    .filter(v => (verPagados ? v.pagado : !v.pagado));

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
        <FiltroMes items={vencimientos} onMesChange={setMesSeleccionado} onFiltrar={() => {}} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={verPagados} onChange={e => setVerPagados(e.target.checked)} />
          Ver vencimientos pagados
        </label>
      </div>

      <ul className="space-y-2">
        {lista.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-300">No hay vencimientos para este filtro.</p>
        ) : (
          lista.map(item => {
            const dateObj = item.fecha?.toDate
              ? item.fecha.toDate()
              : item.fecha instanceof Date
              ? item.fecha
              : new Date(item.fecha);

            return (
              <li
                key={item.id}
                className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
              >
                <div>
                  <p className="text-lg font-semibold">{item.descripcion}</p>
                  <p className="text-sm text-gray-500">Fecha: {dayjs(dateObj).format("DD/MM/YYYY")}</p>
                  <p className="text-sm text-gray-500">
                    Monto:{" "}
                    {item.moneda === "USD"
                      ? `u$d ${item.montoUSD.toFixed(2)} / $${formatearMoneda(item.montoARSConvertido)}`
                      : `$${formatearMoneda(item.montoARS)} / u$d ${item.montoUSDConvertido.toFixed(2)}`}
                  </p>
                  <p className="text-sm text-gray-500">Categoría: {item.categoria}</p>
                  {item.recurrente && (
                    <span className="text-xs text-purple-500 font-semibold block mt-1">🔁 Recurrente mensual</span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <AlertaVencimiento fecha={item.fecha} pagado={item.pagado} />
                  <button
                    onClick={() => togglePagado(item.id, item.pagado, item)}
                    className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {item.pagado ? "Desmarcar" : "Marcar pagado"}
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
