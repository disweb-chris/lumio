import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatearMoneda } from "../utils/format";
import dayjs from "dayjs";
import FiltroMes from "../components/FiltroMes";
import GastoForm from "../components/GastoForm";
import { obtenerCotizacionUSD } from "../utils/configuracion";

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [gastosFiltrados, setGastosFiltrados] = useState([]);
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

  const eliminarGasto = async (id) => {
    const confirmado = window.confirm("¿Eliminar este gasto?");
    if (!confirmado) return;

    try {
      await deleteDoc(doc(db, "gastos", id));
      console.log("🗑 Gasto eliminado de Firebase");
    } catch (error) {
      console.error("❌ Error al eliminar gasto:", error);
    }
  };

  const mostrarARSyUSD = (monto) => {
    const usd = (monto / cotizacionUSD).toFixed(2);
    return `${formatearMoneda(monto)} ARS / u$d ${usd}`;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Historial de gastos
      </h2>

      <GastoForm cotizacionUSD={cotizacionUSD} />

      <FiltroMes items={gastos} onFiltrar={setGastosFiltrados} />

      {gastosFiltrados.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          No hay gastos para este mes.
        </p>
      ) : (
        <ul className="space-y-3">
          {gastosFiltrados.map((gasto) => (
            <li
              key={gasto.id}
              className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-semibold">
                  {gasto.descripcion || "Gasto"}
                </p>
                <p className="text-sm text-gray-500">
                  {gasto.categoria} –{" "}
                  {dayjs(
                    gasto.fecha?.toDate ? gasto.fecha.toDate() : gasto.fecha
                  ).format("DD/MM/YYYY")}
                </p>
                {gasto.metodoPago && (
                  <p className="text-sm text-gray-500 mt-1">
                    Método de pago: {gasto.metodoPago}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xl font-bold text-red-500">
                  - ${formatearMoneda(gasto.monto)}
                </p>
                <button
                  onClick={() => eliminarGasto(gasto.id)}
                  className="text-sm px-2 py-1 rounded bg-white text-red-600 hover:bg-gray-200 border"
                  title="Eliminar gasto"
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
