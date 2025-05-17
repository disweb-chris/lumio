// src/pages/ProyectoDetalle.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import PaymentForm from "../components/PaymentForm";
import ProyectoIngresoForm from "../components/ProyectoIngresoForm";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import { ResponsiveContainer, PieChart, Pie, Tooltip } from "recharts";
import dayjs from "dayjs";

export default function ProyectoDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const uid = user.uid;

  // State para seleccionar mes y cotización
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [cotizacionUSD, setCotizacionUSD] = useState(1);

  const [proyecto, setProyecto] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [ingresosProyecto, setIngresosProyecto] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState("ingresos");
  const [editandoPago, setEditandoPago] = useState(null);
  const [showIngresoForm, setShowIngresoForm] = useState(false);
  const [showPagoForm, setShowPagoForm] = useState(false);

  // assignment inputs
  const [asigInputs, setAsigInputs] = useState({});

  // Generar opciones de meses (últimos 12)
  const generarMeses = () => {
    const meses = [];
    const inicio = dayjs();
    for (let i = 0; i < 12; i++) {
      meses.push(inicio.subtract(i, "month").format("YYYY-MM"));
    }
    return meses;
  };

  // Suscripciones
  useEffect(() => {
    const ref = doc(db, "proyectos", id);
    return onSnapshot(
      ref,
      (snap) => snap.exists() && setProyecto({ id: snap.id, ...snap.data() })
    );
  }, [id]);

  useEffect(() => {
    const pagosQ = query(
      collection(db, "pagos"),
      where("proyectoId", "==", id),
      where("uid", "==", uid),
      where("mes", "==", selectedMonth)
    );
    return onSnapshot(pagosQ, (snap) =>
      setPagos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [id, uid, selectedMonth]);

  useEffect(() => {
    const ingQ = query(
      collection(db, "ingresosProyecto"),
      where("proyectoId", "==", id),
      where("uid", "==", uid),
      where("mes", "==", selectedMonth)
    );
    return onSnapshot(ingQ, (snap) =>
      setIngresosProyecto(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [id, uid, selectedMonth]);

  useEffect(() => {
    const asigQ = query(
      collection(db, "proyectos", id, "asignaciones"),
      where("mes", "==", selectedMonth)
    );
    return onSnapshot(asigQ, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAsignaciones(arr);
      const map = {};
      arr.forEach((a) => (map[a.colaboradorId] = a.montoAsignado));
      setAsigInputs(map);
    });
  }, [id, selectedMonth]);

  useEffect(() => {
    const colQ = query(
      collection(db, "colaboradores"),
      where("uid", "==", uid)
    );
    return onSnapshot(colQ, (snap) =>
      setColaboradores(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [uid]);

  useEffect(() => {
    obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));
  }, []);

  if (!proyecto) return <p>Cargando proyecto…</p>;

  // Cálculos
  const totalPagado = pagos.reduce(
    (s, p) =>
      s +
      (proyecto.moneda === "USD"
        ? Number(p.montoUSD || 0)
        : Number(p.montoARS || 0)),
    0
  );
  const totalIngresos = ingresosProyecto.reduce((s, i) => {
    return (
      s +
      (proyecto.moneda === "USD"
        ? i.moneda === "USD"
          ? Number(i.montoUSD || 0)
          : Number(i.montoUSDConvertido || 0)
        : Number(i.montoARS || i.montoARSConvertido || 0))
    );
  }, 0);
  const disponible = totalIngresos - totalPagado;
  const pieData = [
    { name: "Ingresos", value: totalIngresos },
    { name: "Pagos", value: totalPagado },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de mes */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-gray-700 dark:text-gray-300">Mes:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-2 rounded border dark:bg-gray-700 dark:text-white"
        >
          {generarMeses().map((m) => (
            <option key={m} value={m}>
              {dayjs(m + "-01").format("MMMM YYYY")}
            </option>
          ))}
        </select>
      </div>

      {/* Header summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
          <p className="text-sm dark:text-gray-400">Pagado</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {totalPagado.toFixed(2)} {proyecto.moneda}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
          <p className="text-sm">Ingresos</p>
          <p className="text-xl font-bold text-green-600">
            {totalIngresos.toFixed(2)} {proyecto.moneda}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
          <p className="text-sm dark:text-gray-400">Disponible</p>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {disponible.toFixed(2)} {proyecto.moneda}
          </p>
        </div>
      </div>

      {/* Pie chart */}
      <div className="w-full h-48 bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              label
            />
            <Tooltip formatter={(v) => `${v.toFixed(2)} ${proyecto.moneda}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-4">
          {["ingresos", "pagos", "asignaciones"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 border-b-2 ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Ingresos Tab */}
      {activeTab === "ingresos" && (
        <div>
          {!showIngresoForm ? (
            <button
              onClick={() => setShowIngresoForm(true)}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              ➕ Registrar ingreso
            </button>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
              <button
                onClick={() => setShowIngresoForm(false)}
                className="mb-2 text-sm text-gray-600 hover:underline"
              >
                ← Cancelar ingreso
              </button>
              <ProyectoIngresoForm
                cotizacionUSD={cotizacionUSD}
                onAgregarIngreso={async (ing) => {
                  const fecha1 = Timestamp.fromDate(new Date(ing.fecha1));
                  const fecha2 = ing.fecha2
                    ? Timestamp.fromDate(new Date(ing.fecha2))
                    : null;
                  await addDoc(collection(db, "ingresosProyecto"), {
                    uid,
                    proyectoId: id,
                    mes: selectedMonth,
                    ...ing,
                    fecha1,
                    fecha2,
                    creadoEn: Timestamp.now(),
                  });
                  setShowIngresoForm(false);
                }}
              />
            </div>
          )}
          <h2 className="text-xl font-semibold mb-2">Historial de ingresos</h2>
          {ingresosProyecto.length === 0 ? (
            <p className="text-gray-500">No hay ingresos registrados.</p>
          ) : (
            <ul className="space-y-2">
              {ingresosProyecto.map((i) => (
                <li
                  key={i.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded shadow flex justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {proyecto.moneda === "USD"
                        ? `u$d ${i.montoUSD || 0}`
                        : `$${i.montoARS || 0} ARS`}
                    </p>
                    <p className="text-sm text-gray-500">{i.descripcion}</p>
                    <p className="text-sm text-gray-500">
                      Fecha:{" "}
                      {i.fecha1.toDate
                        ? i.fecha1.toDate().toLocaleDateString()
                        : new Date(i.fecha1).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {i.creadoEn.toDate
                      ? i.creadoEn.toDate().toLocaleDateString()
                      : new Date(i.creadoEn).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {/* Pagos Tab */}
      {activeTab === "pagos" && (
        <div>
          {!showPagoForm && !editandoPago ? (
            <button
              onClick={() => setShowPagoForm(true)}
              className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ➕ Registrar pago
            </button>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
              <button
                onClick={() => {
                  setShowPagoForm(false);
                  setEditandoPago(null);
                }}
                className="mb-2 text-sm text-gray-600 hover:underline"
              >
                ← Cancelar pago
              </button>
              <PaymentForm
                colaboradores={colaboradores}
                pagoInicial={editandoPago}
                onAgregarPago={async (pago) => {
                  const colabor = colaboradores.find(
                    (c) => c.id === pago.colaboradorId
                  );
                  await addDoc(collection(db, "pagos"), {
                    uid,
                    proyectoId: id,
                    mes: selectedMonth,
                    ...pago,
                    colaboradorNombre: colabor?.nombre || "",
                    creadoEn: Timestamp.now(),
                  });
                  setShowPagoForm(false);
                }}
                onActualizarPago={async (pago) => {
                  const refPago = doc(db, "pagos", pago.id);
                  const colabor = colaboradores.find(
                    (c) => c.id === pago.colaboradorId
                  );
                  await updateDoc(refPago, {
                    ...pago,
                    colaboradorNombre: colabor?.nombre || "",
                  });
                  setEditandoPago(null);
                  setShowPagoForm(false);
                }}
                onCancelEdit={() => {
                  setEditandoPago(null);
                  setShowPagoForm(false);
                }}
              />
            </div>
          )}
          <h2 className="text-xl font-semibold mb-2">Historial de pagos</h2>
          {pagos.length === 0 ? (
            <p className="text-gray-500">No hay pagos registrados.</p>
          ) : (
            <ul className="space-y-2">
              {pagos.map((p) => (
                <li
                  key={p.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded shadow flex justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {proyecto.moneda === "USD"
                        ? `${p.montoUSD || 0} USD`
                        : `${p.montoARS || 0} ARS`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Descripción: {p.descripcion}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditandoPago(p)}
                      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={async () =>
                        await deleteDoc(doc(db, "pagos", p.id))
                      }
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-sm"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Asignaciones Tab */}
      {activeTab === "asignaciones" && (
        <div>
          {/* Monto sin asignar */}
          {(() => {
            const totalAsig = asignaciones.reduce(
              (sum, a) => sum + (a.montoAsignado || 0),
              0
            );
            const sinAsignar = proyecto.presupuesto - totalAsig;
            return (
              <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
                <p className="text-sm dark:text-gray-400">Sin asignar</p>
                <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-300">
                  {sinAsignar.toFixed(2)} {proyecto.moneda}
                </p>
              </div>
            );
          })()}

          <h2 className="text-xl font-semibold mb-2">Asignar colaboradores</h2>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4">
            {colaboradores.map((col) => (
              <div key={col.id} className="flex items-center gap-4 mb-2">
                <label className="flex-1">{col.nombre}</label>
                <input
                  type="number"
                  min="0"
                  value={asigInputs[col.id] ?? ""}
                  onChange={(e) =>
                    setAsigInputs((prev) => ({
                      ...prev,
                      [col.id]: e.target.value,
                    }))
                  }
                  className="w-24 p-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="Monto"
                />
              </div>
            ))}
            <button
              onClick={async () => {
                const colRef = collection(db, "proyectos", id, "asignaciones");
                for (const col of colaboradores) {
                  const monto = Number(asigInputs[col.id] || 0);
                  const existing = asignaciones.find(
                    (a) => a.colaboradorId === col.id
                  );
                  if (existing) {
                    if (monto > 0) {
                      await updateDoc(
                        doc(db, "proyectos", id, "asignaciones", existing.id),
                        { montoAsignado: monto }
                      );
                    } else {
                      await deleteDoc(
                        doc(db, "proyectos", id, "asignaciones", existing.id)
                      );
                    }
                  } else if (monto > 0) {
                    await addDoc(colRef, {
                      uid,
                      colaboradorId: col.id,
                      mes: selectedMonth,
                      montoAsignado: monto,
                    });
                  }
                }
              }}
              className="mt-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Guardar asignaciones
            </button>
          </div>

          <h3 className="text-lg font-semibold mb-2">Resumen asignaciones</h3>
          <table className="w-full table-auto bg-white dark:bg-gray-800 rounded shadow">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="px-4 py-2 text-left">Colaborador</th>
                <th className="px-4 py-2 text-right">Asignado</th>
                <th className="px-4 py-2 text-right">Pagado</th>
                <th className="px-4 py-2 text-right">Restante</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((a) => {
                const pagosCol = pagos.filter(
                  (p) => p.colaboradorId === a.colaboradorId
                );
                const pagado = pagosCol.reduce(
                  (s, p) =>
                    s +
                    (proyecto.moneda === "USD"
                      ? Number(p.montoUSD || 0)
                      : Number(p.montoARS || 0)),
                  0
                );
                const pendiente = a.montoAsignado - pagado;
                const nombre = colaboradores.find(
                  (c) => c.id === a.colaboradorId
                )?.nombre;
                return (
                  <tr
                    key={a.id}
                    className="border-t border-gray-300 dark:border-gray-700"
                  >
                    <td className="px-4 py-2">{nombre}</td>
                    <td className="px-4 py-2 text-right">
                      {a.montoAsignado.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {pagado.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {pendiente.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
