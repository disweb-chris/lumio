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

export default function ProyectoDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const uid = user.uid;

  const [proyecto, setProyecto] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [ingresosProyecto, setIngresosProyecto] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);

  // UI states
  const [activeTab, setActiveTab] = useState("ingresos"); // 'ingresos' or 'pagos'
  const [editandoPago, setEditandoPago] = useState(null);
  const [showIngresoForm, setShowIngresoForm] = useState(false);
  const [showPagoForm, setShowPagoForm] = useState(false);

  // 1) Proyecto
  useEffect(() => {
    const ref = doc(db, "proyectos", id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setProyecto({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [id]);

  // 2) Pagos
  useEffect(() => {
    const pagosQ = query(
      collection(db, "pagos"),
      where("proyectoId", "==", id),
      where("uid", "==", uid)
    );
    const unsub = onSnapshot(pagosQ, (snap) =>
      setPagos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [id, uid]);

  // 3) Ingresos al proyecto
  useEffect(() => {
    const ingQ = query(
      collection(db, "ingresosProyecto"),
      where("proyectoId", "==", id),
      where("uid", "==", uid)
    );
    const unsub = onSnapshot(ingQ, (snap) =>
      setIngresosProyecto(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [id, uid]);

  // 4) Colaboradores
  useEffect(() => {
    const colQ = query(
      collection(db, "colaboradores"),
      where("uid", "==", uid)
    );
    const unsub = onSnapshot(colQ, (snap) =>
      setColaboradores(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [uid]);

  // 5) Cotización dólar
  useEffect(() => {
    obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));
  }, []);

  if (!proyecto) return <p>Cargando proyecto…</p>;

  // Totales en moneda del proyecto
  const totalPagado = pagos.reduce((sum, p) => {
    return (
      sum +
      (proyecto.moneda === "USD"
        ? Number(p.montoUSD || 0)
        : Number(p.montoARS || 0))
    );
  }, 0);

  const totalIngresos = ingresosProyecto.reduce((sum, i) => {
    if (proyecto.moneda === "USD") {
      return (
        sum +
        (i.moneda === "USD"
          ? Number(i.montoUSD || 0)
          : Number(i.montoUSDConvertido || 0))
      );
    }
    return (
      sum +
      (Number(i.montoARS || 0) || Number(i.montoARSConvertido || 0))
    );
  }, 0);

  const disponible = totalIngresos - totalPagado;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold">{proyecto.nombre}</h1>
        <p className="text-sm text-gray-500">Descripción: {proyecto.descripcion}</p>
        <p>Presupuesto: {proyecto.presupuesto} {proyecto.moneda}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div>
            <p className="text-sm">Pagado</p>
            <p className="font-semibold text-red-600">
              {totalPagado.toFixed(2)} {proyecto.moneda}
            </p>
          </div>
          <div>
            <p className="text-sm">Ingresos</p>
            <p className="font-semibold text-green-600">
              {totalIngresos.toFixed(2)} {proyecto.moneda}
            </p>
          </div>
          <div>
            <p className="text-sm">Disponible</p>
            <p className="font-semibold text-blue-600">
              {disponible.toFixed(2)} {proyecto.moneda}
            </p>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px space-x-4">
          {['ingresos','pagos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 font-medium border-b-2 ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'ingresos' ? 'Ingresos' : 'Pagos'}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de pestañas */}
      {activeTab === 'ingresos' ? (
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
                <li key={i.id} className="p-3 bg-white dark:bg-gray-800 rounded shadow flex justify-between">
                  <div>
                    <p className="font-medium">
                      {proyecto.moneda === 'USD' ? `u$d ${i.montoUSD || 0}` : `$${i.montoARS || 0} ARS`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Fecha: {i.fecha1.toDate ? i.fecha1.toDate().toLocaleDateString() : new Date(i.fecha1).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {i.creadoEn.toDate ? i.creadoEn.toDate().toLocaleDateString() : new Date(i.creadoEn).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          {!(showPagoForm || editandoPago) ? (
            <button
              onClick={() => setShowPagoForm(true)}
              className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ➕ Registrar pago
            </button>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
              <button
                onClick={() => { setShowPagoForm(false); setEditandoPago(null); }}
                className="mb-2 text-sm text-gray-600 hover:underline"
              >
                ← Cancelar pago
              </button>
              <PaymentForm
                colaboradores={colaboradores}
                pagoInicial={editandoPago}
                onAgregarPago={async (pago) => {
                  const colabor = colaboradores.find(c => c.id === pago.colaboradorId);
                  await addDoc(collection(db, "pagos"), {
                    uid,
                    proyectoId: id,
                    ...pago,
                    colaboradorNombre: colabor?.nombre || "",
                    creadoEn: Timestamp.now(),
                  });
                  setShowPagoForm(false);
                }}
                onActualizarPago={async (pago) => {
                  const ref = doc(db, "pagos", pago.id);
                  const colabor = colaboradores.find(c => c.id === pago.colaboradorId);
                  await updateDoc(ref, { ...pago, colaboradorNombre: colabor?.nombre || "" });
                  setEditandoPago(null);
                  setShowPagoForm(false);
                }}
                onCancelEdit={() => { setEditandoPago(null); setShowPagoForm(false); }}
              />
            </div>
          )}
          <h2 className="text-xl font-semibold mb-2">Historial de pagos</h2>
          {pagos.length === 0 ? (
            <p className="text-gray-500">No hay pagos registrados.</p>
          ) : (
            <ul className="space-y-2">
              {pagos.map((p) => (
                <li key={p.id} className="p-3 bg-white dark:bg-gray-800 rounded shadow flex justify-between">
                  <div>
                    <p className="font-medium">
                      {proyecto.moneda === 'USD' ? `${p.montoUSD || 0} USD` : `${p.montoARS || 0} ARS`}
                    </p>
                    <p className="text-sm text-gray-500">Descripción: {p.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditandoPago(p)} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-sm">✏️</button>
                    <button onClick={async () => await deleteDoc(doc(db, "pagos", p.id))} className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-sm">🗑</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
