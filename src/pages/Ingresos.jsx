import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import { formatearMoneda } from "../utils/format";
import IngresoForm from "../components/IngresoForm";
import dayjs from "dayjs";

export default function Ingresos() {
  const [ingresos, setIngresos] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "ingresos"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setIngresos(data);
    });

    return () => unsubscribe();
  }, []);

  const agregarIngreso = async (nuevo) => {
    try {
      await addDoc(collection(db, "ingresos"), {
        ...nuevo,
        recibido: false,
        fecha: Timestamp.fromDate(new Date(nuevo.fecha)),
      });
    } catch (error) {
      console.error("❌ Error al agregar ingreso:", error);
    }
  };

  const toggleRecibido = async (id, actual) => {
    try {
      await updateDoc(doc(db, "ingresos", id), {
        recibido: !actual,
      });
    } catch (error) {
      console.error("❌ Error al actualizar ingreso:", error);
    }
  };

  const eliminarIngreso = async (id) => {
    const confirmado = window.confirm("¿Eliminar este ingreso?");
    if (!confirmado) return;

    try {
      await deleteDoc(doc(db, "ingresos", id));
    } catch (error) {
      console.error("❌ Error al eliminar ingreso:", error);
    }
  };

  const totalEsperado = ingresos.reduce((acc, i) => acc + i.monto, 0);
  const totalRecibido = ingresos
    .filter((i) => i.recibido)
    .reduce((acc, i) => acc + i.monto, 0);
  const pendiente = totalEsperado - totalRecibido;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">Total esperado</p>
          <p className="text-2xl font-bold text-blue-400">
            ${formatearMoneda(totalEsperado)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">Total recibido</p>
          <p className="text-2xl font-bold text-green-500">
            ${formatearMoneda(totalRecibido)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">Pendiente de cobro</p>
          <p className="text-2xl font-bold text-yellow-400">
            ${formatearMoneda(pendiente)}
          </p>
        </div>
      </div>

      <IngresoForm onAgregarIngreso={agregarIngreso} />

      <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800 dark:text-white">
        Lista de ingresos
      </h3>

      <ul className="space-y-3">
        {ingresos.map((ingreso) => (
          <li
            key={ingreso.id}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="text-lg font-semibold">{ingreso.descripcion}</p>
              <p className="text-sm text-gray-500">
                {dayjs(
                  ingreso.fecha?.toDate
                    ? ingreso.fecha.toDate()
                    : ingreso.fecha
                ).format("DD/MM/YYYY")}
              </p>
              <p className="text-sm">
                Monto: ${formatearMoneda(ingreso.monto)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                onClick={() => toggleRecibido(ingreso.id, ingreso.recibido)}
                className={`text-sm px-3 py-1 rounded font-semibold ${
                  ingreso.recibido
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {ingreso.recibido ? "Recibido" : "Marcar recibido"}
              </button>
              <button
                onClick={() => eliminarIngreso(ingreso.id)}
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
