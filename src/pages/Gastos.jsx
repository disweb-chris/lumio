import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
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

  useEffect(() => {
    const q = query(collection(db, "gastos"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGastos(data);
    });

    obtenerCotizacionUSD().then((valor) => {
      if (valor) setCotizacionUSD(valor);
    });

    return () => unsubscribe();
  }, []);

  const agregarGasto = async (nuevo) => {
    try {
      await addDoc(collection(db, "gastos"), {
        ...nuevo,
        fecha: Timestamp.fromDate(new Date(nuevo.fecha)),
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error("❌ Error al guardar gasto:", error);
    }
  };

  const eliminarGasto = async (id) => {
    const confirmado = window.confirm("¿Eliminar este gasto?");
    if (!confirmado) return;

    try {
      await deleteDoc(doc(db, "gastos", id));
    } catch (error) {
      console.error("❌ Error al eliminar gasto:", error);
    }
  };

  const mostrarARSyUSD = (monto) => {
    const num = parseFloat(monto || 0);
    const usd = cotizacionUSD > 0 ? (num / cotizacionUSD).toFixed(2) : "0.00";
    return `$${formatearMoneda(num)} ARS / u$d ${usd}`;
  };

  return (
    <div>
      <GastoForm onAgregarGasto={agregarGasto} cotizacionUSD={cotizacionUSD} />

      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Historial de gastos
      </h3>

      <ul className="space-y-3">
        {gastos.map((gasto) => (
          <li
            key={gasto.id}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-start"
          >
            <div>
              <p className="text-lg font-semibold">{gasto.descripcion}</p>
              <p className="text-sm text-gray-500">
                Monto: {mostrarARSyUSD(gasto.monto)}
              </p>
              <p className="text-sm text-gray-500">
                Categoría: {gasto.categoria}
              </p>
              <p className="text-sm text-gray-500">
                Método de pago: {gasto.metodoPago}
              </p>

              {gasto.metodoPago?.toLowerCase().includes("tarjeta") && (
                <p className="text-xs text-purple-500 font-semibold mt-1">
                  💳 Pago con tarjeta de crédito
                </p>
              )}

              <p className="text-sm text-gray-400 mt-1">
                {dayjs(gasto.fecha?.toDate?.() || gasto.fecha).format(
                  "DD/MM/YYYY"
                )}
              </p>
            </div>

            <button
              onClick={() => eliminarGasto(gasto.id)}
              className="text-red-600 hover:text-red-800 border border-red-600 rounded px-3 py-1 text-sm"
            >
              🗑 Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
