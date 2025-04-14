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

export default function Vencimientos() {
  const [vencimientos, setVencimientos] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "vencimientos"), orderBy("fecha", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVencimientos(data);
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

  const togglePagado = async (id, actual, vencimiento) => {
    try {
      const nuevoEstado = !actual;

      // DESMARCAR → ELIMINAR gasto asociado
      if (!nuevoEstado && vencimiento.idGasto) {
        await deleteDoc(doc(db, "gastos", vencimiento.idGasto));
      }

      // MARCAR COMO PAGADO → CREAR gasto
      if (nuevoEstado) {
        const docRef = await addDoc(collection(db, "gastos"), {
          categoria: "Vencimientos",
          descripcion: vencimiento.descripcion,
          monto: vencimiento.monto,
          fecha: vencimiento.fecha,
          timestamp: Timestamp.now(),
        });

        await updateDoc(doc(db, "vencimientos", id), {
          pagado: true,
          idGasto: docRef.id,
        });
      } else {
        // desmarcado: quitar idGasto y marcar como no pagado
        await updateDoc(doc(db, "vencimientos", id), {
          pagado: false,
          idGasto: null,
        });
      }
    } catch (error) {
      console.error("❌ Error al cambiar estado de pago:", error);
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
      <VencimientoForm onAgregar={agregarVencimiento} />

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
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Monto: ${formatearMoneda(item.monto)}
              </p>
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
