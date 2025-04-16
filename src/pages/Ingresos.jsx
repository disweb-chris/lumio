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

export default function Ingresos() {
  const [ingresos, setIngresos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);

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

  const togglePago = async (ingreso, parte) => {
    try {
      const nuevo = { ...ingreso };
      const cotiz = await obtenerCotizacionUSD();

      const getEnARS = (monto, moneda) =>
        moneda === "USD" ? monto * cotiz : monto;

      if (parte === 1 && !ingreso.recibido1) {
        nuevo.recibido1 = true;

        const monto = ingreso.monto1 ?? ingreso.montoTotal;
        const enARS = getEnARS(monto, ingreso.moneda || "ARS");

        nuevo.montoRecibido = (nuevo.montoRecibido || 0) + enARS;
      }

      if (parte === 2 && !ingreso.recibido2) {
        nuevo.recibido2 = true;

        const monto = ingreso.monto2 ?? ingreso.montoTotal / 2;
        const enARS = getEnARS(monto, ingreso.moneda || "ARS");

        nuevo.montoRecibido = (nuevo.montoRecibido || 0) + enARS;
      }

      // Si no está dividido y se registra completo (ej: desde botón único)
      if (!ingreso.dividido && !ingreso.recibido1 && parte === 1) {
        nuevo.recibido1 = true;
        const monto = ingreso.montoTotal;
        const enARS = getEnARS(monto, ingreso.moneda || "ARS");
        nuevo.montoRecibido = enARS;
      }

      await updateDoc(doc(db, "ingresos", ingreso.id), nuevo);
    } catch (error) {
      console.error("❌ Error al registrar pago:", error);
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
    if (i.moneda === "USD") {
      return acc + monto * cotizacionUSD;
    }
    return acc + monto;
  }, 0);

  const totalRecibido = ingresos.reduce((acc, i) => acc + (i.montoRecibido || 0), 0);

  const pendiente = totalEsperado - totalRecibido;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">Total esperado</p>
          <p className="text-lg font-bold text-blue-400">
            {mostrarARSyUSD(totalEsperado, "ARS")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">Total recibido</p>
          <p className="text-lg font-bold text-green-500">
            {mostrarARSyUSD(totalRecibido, "ARS")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">Pendiente de cobro</p>
          <p className="text-lg font-bold text-yellow-400">
            {mostrarARSyUSD(pendiente, "ARS")}
          </p>
        </div>
      </div>

      <IngresoForm onAgregarIngreso={agregarIngreso} cotizacionUSD={cotizacionUSD} />

      <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800 dark:text-white">
        Lista de ingresos
      </h3>

      <ul className="space-y-3">
        {ingresos.map((ingreso) => (
          <li
            key={ingreso.id}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow"
          >
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
                      {mostrarARSyUSD(ingreso.monto1 || ingreso.montoTotal / 2, ingreso.moneda)} –{" "}
                      {dayjs(ingreso.fecha1.toDate()).format("DD/MM/YYYY")} –{" "}
                      {ingreso.recibido1 ? "✅" : "❌"}
                    </p>
                    <p className="text-sm text-gray-400">
                      <strong>2º pago:</strong>{" "}
                      {mostrarARSyUSD(ingreso.monto2 || ingreso.montoTotal / 2, ingreso.moneda)} –{" "}
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
                    onClick={() => togglePago(ingreso, 1)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Registrar 1° pago
                  </button>
                )}
                {ingreso.dividido && !ingreso.recibido2 && (
                  <button
                    onClick={() => togglePago(ingreso, 2)}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Registrar 2° pago
                  </button>
                )}
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
