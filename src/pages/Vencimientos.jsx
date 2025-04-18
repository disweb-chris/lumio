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
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import VencimientoForm from "../components/VencimientoForm";
import { formatearMoneda } from "../utils/format";
import AlertaVencimiento from "../components/AlertaVencimiento";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import FiltroMes from "../components/FiltroMes";
import dayjs from "dayjs";

export default function Vencimientos() {
  const [vencimientos, setVencimientos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);
  const [editando, setEditando] = useState(null);

  /* filtro mes + toggle */
  const [mesSeleccionado, setMesSeleccionado] = useState(
    dayjs().format("YYYY-MM")
  );
  const [verPagados, setVerPagados] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "vencimientos"), orderBy("fecha", "asc"));
    const unsub = onSnapshot(q, (snap) =>
      setVencimientos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));
    return () => unsub();
  }, []);

  /* CRUD (sin cambios) */
  const agregarVencimiento = async (nuevo) => {
    await addDoc(collection(db, "vencimientos"), {
      ...nuevo,
      pagado: false,
      fecha: Timestamp.fromDate(new Date(nuevo.fecha)),
    });
  };

  const actualizarVencimiento = async (v) => {
    const ref = doc(db, "vencimientos", v.id);
    const data = { ...v };
    delete data.id;
    data.fecha = Timestamp.fromDate(new Date(v.fecha));
    await updateDoc(ref, data);
    setEditando(null);
  };

  const togglePagado = async (id, actual, v) => {
    // idéntico a tu lógica existente
    try {
      const nuevoEstado = !actual;

      if (!nuevoEstado && v.idGasto) {
        await deleteDoc(doc(db, "gastos", v.idGasto));
      }

      if (nuevoEstado) {
        const docRef = await addDoc(collection(db, "gastos"), {
          categoria: v.categoria || "Vencimientos",
          descripcion: v.descripcion,
          monto: v.monto,
          metodoPago: v.metodoPago || "Sin especificar",
          fecha: v.fecha,
          timestamp: Timestamp.now(),
        });

        await updateDoc(doc(db, "vencimientos", id), {
          pagado: true,
          idGasto: docRef.id,
        });

        if (v.recurrente) {
          const fechaActual = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
          const proxima = new Date(
            fechaActual.getFullYear(),
            fechaActual.getMonth() + 1,
            fechaActual.getDate()
          );

          await addDoc(collection(db, "vencimientos"), {
            descripcion: v.descripcion,
            monto: v.monto,
            metodoPago: v.metodoPago || "Sin especificar",
            pagado: false,
            recurrente: true,
            categoria: v.categoria || "Vencimientos",
            fecha: Timestamp.fromDate(proxima),
          });
        }
      } else {
        await updateDoc(doc(db, "vencimientos", id), {
          pagado: false,
          idGasto: null,
        });
      }
    } catch (e) {
      console.error("❌ Error al actualizar vencimiento:", e);
    }
  };

  const eliminarVencimiento = async (id) =>
    window.confirm("¿Eliminar este vencimiento?") &&
    deleteDoc(doc(db, "vencimientos", id));

  /* ───────── FILTROS ───────── */
  const filtrarPorMes = (arr) =>
    arr.filter((v) => {
      if (mesSeleccionado === "todos") return true;
      const mes = dayjs(v.fecha?.toDate?.() || v.fecha).format("YYYY-MM");
      return mes === mesSeleccionado;
    });

  let lista = filtrarPorMes(vencimientos);
  if (!verPagados) lista = lista.filter((v) => !v.pagado);

  /* render */
  return (
    <div>
      {/* Form alta/edición */}
      <VencimientoForm
        onAgregar={agregarVencimiento}
        onActualizar={actualizarVencimiento}
        editando={editando}
        cotizacionUSD={cotizacionUSD}
      />

      {/* Controles de filtro */}
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

      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Pagos con vencimiento
      </h3>

      {lista.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300">
          No hay vencimientos para este filtro.
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((item) => (
            <li
              key={item.id}
              className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
            >
              <div>
                <p className="text-lg">{item.descripcion}</p>
                <p className="text-sm text-gray-500">
                  Fecha:{" "}
                  {item.fecha?.toDate
                    ? item.fecha.toDate().toLocaleDateString()
                    : item.fecha}
                </p>
                {item.metodoPago && (
                  <p className="text-sm text-gray-500">
                    Método de pago: {item.metodoPago}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Monto: ${formatearMoneda(item.monto)}
                </p>
                {item.categoria && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Categoría: {item.categoria}
                  </p>
                )}
                {item.recurrente && (
                  <span className="text-xs text-purple-500 font-semibold block mt-1">
                    🔁 Recurrente mensual
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <AlertaVencimiento fecha={item.fecha} pagado={item.pagado} />
                <button
                  onClick={() => togglePagado(item.id, item.pagado, item)}
                  className="text-sm px-3 py-1 rounded bg-blue-600 text-white"
                >
                  {item.pagado ? "Desmarcar" : "Marcar pagado"}
                </button>
                <button
                  onClick={() => setEditando(item)}
                  className="text-sm px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-300"
                >
                  ✏️
                </button>
                <button
                  onClick={() => eliminarVencimiento(item.id)}
                  className="text-sm px-2 py-1 rounded bg-white text-red-600 hover:bg-gray-200 border"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
