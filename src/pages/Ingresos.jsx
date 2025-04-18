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
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatearMoneda } from "../utils/format";
import IngresoForm from "../components/IngresoForm";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import dayjs from "dayjs";
import { toast } from "react-toastify";

export default function Ingresos() {
  const [ingresos, setIngresos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "ingresos"), orderBy("fecha1", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setIngresos(data);
    });

    obtenerCotizacionUSD().then((valor) => {
      if (valor) setCotizacionUSD(valor);
    });

    return () => unsubscribe();
  }, []);

  const mostrarARSyUSD = (monto, moneda = "ARS") => {
    const num = parseFloat(monto || 0);
    if (isNaN(num)) return "—";
    if (moneda === "USD") {
      const ars = cotizacionUSD > 0 ? num * cotizacionUSD : 0;
      return `u$d ${num.toFixed(2)} / $${formatearMoneda(ars)} ARS`;
    } else {
      const usd = cotizacionUSD > 0 ? num / cotizacionUSD : 0;
      return `$${formatearMoneda(num)} ARS / u$d ${usd.toFixed(2)}`;
    }
  };

  const agregarIngreso = async (nuevo) => {
    try {
      await addDoc(collection(db, "ingresos"), {
        ...nuevo,
        fecha1: Timestamp.fromDate(new Date(nuevo.fecha1)),
        fecha2: nuevo.fecha2 ? Timestamp.fromDate(new Date(nuevo.fecha2)) : null,
      });
    } catch (error) {
      console.error("❌ Error al agregar ingreso:", error);
    }
  };

  const actualizarIngreso = async (actualizado) => {
    try {
      const ingresoRef = doc(db, "ingresos", actualizado.id);
      const ingresoData = { ...actualizado };
      ingresoData.fecha1 = Timestamp.fromDate(new Date(actualizado.fecha1));
      ingresoData.fecha2 = actualizado.fecha2
        ? Timestamp.fromDate(new Date(actualizado.fecha2))
        : null;
      delete ingresoData.id;

      await updateDoc(ingresoRef, ingresoData);
      toast.success("✅ Ingreso actualizado");
      setEditando(null);
    } catch (error) {
      console.error("❌ Error al actualizar ingreso:", error);
      toast.error("❌ No se pudo actualizar");
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

  const totalEsperado = ingresos.reduce((acc, i) => {
    const monto = i.montoTotal || 0;
    return acc + (i.moneda === "USD" ? monto * cotizacionUSD : monto);
  }, 0);

  const totalRecibido = ingresos.reduce((acc, i) => acc + (i.montoRecibido || 0), 0);
  const pendiente = totalEsperado - totalRecibido;

  return (
    <div>
      <IngresoForm
        onAgregarIngreso={agregarIngreso}
        onActualizarIngreso={actualizarIngreso}
        editando={editando}
        cotizacionUSD={cotizacionUSD}
      />

      <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800 dark:text-white">
        Lista de ingresos
      </h3>

      <ul className="space-y-3">
        {ingresos.map((ingreso) => (
          <li key={ingreso.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            <div className="flex justify-between flex-wrap">
              <div>
                <p className="text-lg font-semibold">{ingreso.descripcion}</p>
                <p className="text-sm text-gray-500">
                  Monto total: {mostrarARSyUSD(ingreso.montoTotal, ingreso.moneda)}
                </p>
                <p className="text-sm text-gray-500">
                  Recibido: {mostrarARSyUSD(ingreso.montoRecibido || 0, "ARS")}
                </p>
                {ingreso.dividido && (
                  <>
                    <p className="text-sm text-gray-400 mt-2">
                      <strong>1º pago:</strong>{" "}
                      {mostrarARSyUSD(
                        ingreso.monto1 || ingreso.montoTotal / 2,
                        ingreso.moneda
                      )} –{" "}
                      {dayjs(ingreso.fecha1.toDate()).format("DD/MM/YYYY")} –{" "}
                      {ingreso.recibido1 ? "✅" : "❌"}
                    </p>
                    <p className="text-sm text-gray-400">
                      <strong>2º pago:</strong>{" "}
                      {mostrarARSyUSD(
                        ingreso.monto2 || ingreso.montoTotal / 2,
                        ingreso.moneda
                      )} –{" "}
                      {ingreso.fecha2
                        ? dayjs(ingreso.fecha2.toDate()).format("DD/MM/YYYY")
                        : "Sin fecha"}{" "}
                      – {ingreso.recibido2 ? "✅" : "❌"}
                    </p>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2 items-end justify-center mt-4 sm:mt-0">
                {!ingreso.recibido1 && (
                  <button
                    onClick={() => toast("🔧 Agregá lógica para togglePago si querés")}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Registrar 1° pago
                  </button>
                )}
                {ingreso.dividido && !ingreso.recibido2 && (
                  <button
                    onClick={() => toast("🔧 Agregá lógica para togglePago si querés")}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Registrar 2° pago
                  </button>
                )}
                <button
                  onClick={() => setEditando(ingreso)}
                  className="text-blue-600 border border-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-50"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => eliminarIngreso(ingreso.id)}
                  className="text-red-600 border border-red-600 px-3 py-1 rounded text-sm hover:bg-red-50"
                >
                  🗑 Eliminar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
