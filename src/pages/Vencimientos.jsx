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

export default function Vencimientos() {
  const [vencimientos, setVencimientos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);
  const [editando, setEditando] = useState(null); // 👈 Nuevo estado

  useEffect(() => {
    const q = query(collection(db, "vencimientos"), orderBy("fecha", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVencimientos(data);
    });

    obtenerCotizacionUSD().then((valor) => {
      if (valor) setCotizacionUSD(valor);
    });

    return () => unsubscribe();
  }, []);

  const agregarVencimiento = async (nuevo) => {
    try {
      await addDoc(collection(db, "vencimientos"), {
        ...nuevo,
        pagado: false,
        fecha: Timestamp.fromDate(new Date(nuevo.fecha)),
      });
    } catch (error) {
      console.error("❌ Error al guardar vencimiento:", error);
    }
  };

  const actualizarVencimiento = async (actualizado) => {
    try {
      const ref = doc(db, "vencimientos", actualizado.id);
      const data = { ...actualizado };
      delete data.id;

      await updateDoc(ref, {
        ...data,
        fecha: Timestamp.fromDate(new Date(actualizado.fecha)),
      });

      setEditando(null);
    } catch (error) {
      console.error("❌ Error al actualizar vencimiento:", error);
    }
  };

  const togglePagado = async (id, actual, vencimiento) => {
    try {
      const nuevoEstado = !actual;

      if (!nuevoEstado && vencimiento.idGasto) {
        await deleteDoc(doc(db, "gastos", vencimiento.idGasto));
      }

      if (nuevoEstado) {
        const docRef = await addDoc(collection(db, "gastos"), {
          categoria: vencimiento.categoria || "Vencimientos",
          descripcion: vencimiento.descripcion,
          monto: vencimiento.monto,
          metodoPago: vencimiento.metodoPago || "Sin especificar",
          fecha: vencimiento.fecha,
          timestamp: Timestamp.now(),
        });

        await updateDoc(doc(db, "vencimientos", id), {
          pagado: true,
          idGasto: docRef.id,
        });

        if (vencimiento.recurrente) {
          const fechaActual = vencimiento.fecha?.toDate
            ? vencimiento.fecha.toDate()
            : new Date(vencimiento.fecha);

          const fechaProxima = new Date(
            fechaActual.getFullYear(),
            fechaActual.getMonth() + 1,
            fechaActual.getDate()
          );

          await addDoc(collection(db, "vencimientos"), {
            descripcion: vencimiento.descripcion,
            monto: vencimiento.monto,
            metodoPago: vencimiento.metodoPago || "Sin especificar",
            pagado: false,
            recurrente: true,
            categoria: vencimiento.categoria || "Vencimientos",
            fecha: Timestamp.fromDate(fechaProxima),
          });
        }
      } else {
        await updateDoc(doc(db, "vencimientos", id), {
          pagado: false,
          idGasto: null,
        });
      }
    } catch (error) {
      console.error("❌ Error al actualizar vencimiento:", error);
    }
  };

  const eliminarVencimiento = async (id) => {
    const confirmado = window.confirm("¿Eliminar este vencimiento?");
    if (!confirmado) return;

    try {
      await deleteDoc(doc(db, "vencimientos", id));
    } catch (error) {
      console.error("❌ Error al eliminar vencimiento:", error);
    }
  };

  return (
    <div>
      <VencimientoForm
        onAgregar={agregarVencimiento}
        onActualizar={actualizarVencimiento}
        editando={editando}
        cotizacionUSD={cotizacionUSD}
      />

      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Pagos con vencimiento
      </h3>

      <ul className="space-y-2">
        {vencimientos.map((item) => (
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
    </div>
  );
}
