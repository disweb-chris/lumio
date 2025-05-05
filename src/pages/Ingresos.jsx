// src/pages/Ingresos.jsx
import { useState, useEffect, useMemo } from "react";
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
import { formatearMoneda } from "../utils/format";
import IngresoForm from "../components/IngresoForm";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import FiltroMes from "../components/FiltroMes";

export default function Ingresos() {
  const { user } = useAuth();
  const uid = user.uid;

  const [ingresos, setIngresos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState(dayjs().format("YYYY-MM"));

  // Suscripción a Firestore
  useEffect(() => {
    const q = query(
      collection(db, "ingresos"),
      where("uid", "==", uid),
      orderBy("fecha1", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setIngresos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCargando(false);
    });
    return () => unsub();
  }, [uid]);

  // Agrupar ingresos por mes
  const ingresosPorMes = useMemo(() => {
    const groups = {};
    ingresos.forEach((i) => {
      const fecha = i.fecha1.toDate ? i.fecha1.toDate() : new Date(i.fecha1);
      const mes = dayjs(fecha).format("YYYY-MM");
      groups[mes] = groups[mes] || [];
      groups[mes].push(i);
    });
    return Object.entries(groups)
      .map(([mes, items]) => ({ mes, items }))
      .sort((a, b) => (a.mes < b.mes ? 1 : -1));
  }, [ingresos]);

  // Ingresos de cada mes
  const ingresosDelMes = useMemo(
    () => ingresosPorMes.find((g) => g.mes === mesSeleccionado)?.items || [],
    [ingresosPorMes, mesSeleccionado]
  );

  // Totales ARS y USD por mes seleccionado
  const totalEsperadoARSMes = useMemo(
    () =>
      ingresosDelMes.reduce(
        (sum, i) => sum + (i.moneda === "USD" ? i.montoARSConvertido : i.montoARS),
        0
      ),
    [ingresosDelMes]
  );
  const totalEsperadoUSDMes = useMemo(
    () =>
      ingresosDelMes.reduce(
        (sum, i) =>
          sum + (i.montoUSD != null
            ? parseFloat(i.montoUSD)
            : parseFloat(i.montoUSDConvertido || 0)),
        0
      ),
    [ingresosDelMes]
  );

  const totalRecibidoARSMes = useMemo(
    () => ingresosDelMes.reduce((sum, i) => sum + (i.montoRecibido || 0), 0),
    [ingresosDelMes]
  );
  const totalRecibidoUSDMes = useMemo(
    () =>
      ingresosDelMes.reduce(
        (sum, i) =>
          sum + ((i.montoRecibido || 0) / (parseFloat(i.cotizacionAlMomento) || 1)),
        0
      ),
    [ingresosDelMes]
  );

  // Ingresos pendientes global
  const ingresosPendientes = useMemo(
    () =>
      ingresos.filter((i) => {
        const total = i.moneda === "USD" ? i.montoARSConvertido : i.montoARS;
        return (i.montoRecibido || 0) < total;
      }),
    [ingresos]
  );
  const totalPendienteARS = useMemo(
    () =>
      ingresosPendientes.reduce((sum, i) => {
        const total = i.moneda === "USD" ? i.montoARSConvertido : i.montoARS;
        return sum + (total - (i.montoRecibido || 0));
      }, 0),
    [ingresosPendientes]
  );
  const totalPendienteUSDMes = useMemo(
    () =>
      ingresosPendientes.reduce((sum, i) => {
        const totalARS = i.moneda === "USD" ? i.montoARSConvertido : i.montoARS;
        const recARS = i.montoRecibido || 0;
        const diffARS = totalARS - recARS;
        const cot = parseFloat(i.cotizacionAlMomento) || 1;
        return sum + diffARS / cot;
      }, 0),
    [ingresosPendientes]
  );

  // Métodos CRUD
  const eliminarIngreso = async (id) => {
    if (window.confirm("¿Eliminar este ingreso?")) {
      await deleteDoc(doc(db, "ingresos", id));
    }
  };
  const togglePago = async (ing, parte) => {
    const ref = doc(db, "ingresos", ing.id);
    const nuevo = { ...ing };
    const total = ing.moneda === "USD" ? ing.montoARSConvertido : ing.montoARS;
    if (parte === 1 && !ing.recibido1) {
      nuevo.recibido1 = true;
      nuevo.montoRecibido =
        (nuevo.montoRecibido || 0) + (ing.dividido ? total / 2 : total);
    }
    if (parte === 2 && ing.dividido && !ing.recibido2) {
      nuevo.recibido2 = true;
      nuevo.montoRecibido = (nuevo.montoRecibido || 0) + total / 2;
    }
    await updateDoc(ref, nuevo);
  };

  if (cargando) return <p className="text-center text-gray-500">Cargando…</p>;

  return (
    <div>
      {/* Filtro y selector de mes */}
      <div className="flex items-center gap-4 mb-6">
        <FiltroMes items={ingresos} onMesChange={setMesSeleccionado} />
        <span className="text-sm text-gray-600">
          {dayjs(mesSeleccionado + "-01").format("MMMM YYYY")}
        </span>
      </div>

      {/* Resumen global mensual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Total esperado</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatearMoneda(totalEsperadoARSMes)} ARS / u$d {totalEsperadoUSDMes.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Total recibido</p>
          <p className="text-2xl font-bold text-green-500">
            {formatearMoneda(totalRecibidoARSMes)} ARS / u$d {totalRecibidoUSDMes.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Pendiente</p>
          <p className="text-2xl font-bold text-yellow-500">
            {formatearMoneda(totalPendienteARS)} ARS / u$d {totalPendienteUSDMes.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <IngresoForm
        onAgregarIngreso={async (nuevo) => {
          await addDoc(collection(db, "ingresos"), {
            ...nuevo,
            uid,
            fecha1: Timestamp.fromDate(new Date(nuevo.fecha1)),
            fecha2: nuevo.fecha2
              ? Timestamp.fromDate(new Date(nuevo.fecha2))
              : null,
          });
        }}
      />

      {/* Listado mensual desplegable */}
      <ul className="space-y-4 mt-6">
        {ingresosPorMes.map(({ mes, items }) => (
          <li key={mes}>
            <details open className="bg-white dark:bg-gray-800 rounded shadow">
              <summary className="cursor-pointer px-4 py-2 flex justify-between items-center">
                <span className="font-semibold text-lg text-gray-800 dark:text-white">
                  {dayjs(mes + "-01").format("MMMM YYYY")}
                </span>
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span>
                    Esperado: {formatearMoneda(
                      items.reduce(
                        (sum, i) => sum + (i.moneda === "USD" ? i.montoARSConvertido : i.montoARS),
                        0
                      )
                    )} ARS / u$d {items.reduce(
                      (sum, i) => sum + (i.montoUSD != null ? parseFloat(i.montoUSD) : parseFloat(i.montoUSDConvertido || 0)),
                      0
                    ).toFixed(2)}
                  </span>
                  <span className="text-green-600">
                    Recibido: {formatearMoneda(
                      items.reduce((sum, i) => sum + (i.montoRecibido || 0), 0)
                    )} ARS / u$d {items.reduce(
                      (sum, i) => sum + ((i.montoRecibido || 0) / (parseFloat(i.cotizacionAlMomento)||1)),
                      0
                    ).toFixed(2)}
                  </span>
                  <span className="text-yellow-500">
                    Pendiente: {formatearMoneda(
                      items.reduce(
                        (sum, i) => sum + (i.moneda === "USD" ? i.montoARSConvertido : i.montoARS) - (i.montoRecibido || 0),
                        0
                      )
                    )} ARS / u$d {(
                      items.reduce(
                        (sum,i) => sum + (i.montoUSD != null ? parseFloat(i.montoUSD) : parseFloat(i.montoUSDConvertido || 0))
                          - ((i.montoRecibido || 0) / (parseFloat(i.cotizacionAlMomento)||1)),
                        0
                      )
                    ).toFixed(2)}
                  </span>
                </div>
              </summary>
              <ul className="space-y-3 px-4 pb-4">
                {items.map((ing) => {
                  const fecha = ing.fecha1.toDate
                    ? ing.fecha1.toDate()
                    : new Date(ing.fecha1);
                  const total = ing.moneda === "USD" ? ing.montoARSConvertido : ing.montoARS;
                  const authRec = ing.montoRecibido || 0;
                  const recUSD = ((ing.montoRecibido || 0) / (parseFloat(ing.cotizacionAlMomento) || 1)).toFixed(2);
                  return (
                    <li
                      key={ing.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {ing.descripcion}
                        </p>
                        <p className="text-sm text-gray-500">
                          {dayjs(fecha).format("DD/MM/YYYY")}
                        </p>
                        <p className="text-sm text-gray-500">
                          Total: {formatearMoneda(total)} ARS / u$d {(ing.montoUSD != null ? parseFloat(ing.montoUSD) : parseFloat(ing.montoUSDConvertido || 0)).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Recibido: {formatearMoneda(authRec)} ARS / u$d {recUSD}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {!ing.recibido1 && (
                          <button
                            onClick={() => togglePago(ing, 1)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Registrar 1° pago
                          </button>
                        )}
                        {ing.dividido && !ing.recibido2 && (
                          <button
                            onClick={() => togglePago(ing, 2)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Registrar 2° pago
                          </button>
                        )}
                        <button
                          onClick={() => eliminarIngreso(ing.id)}
                          className="text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-100 text-sm"
                        >
                          🗑 Eliminar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}