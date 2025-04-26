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
  const [editandoPago, setEditandoPago] = useState(null);

  // 1) Proyecto
  useEffect(() => {
    const ref = doc(db, "proyectos", id);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setProyecto({ id: snap.id, ...snap.data() });
    });
  }, [id]);

  // 2) Pagos
  useEffect(() => {
    const pagosQ = query(
      collection(db, "pagos"),
      where("proyectoId", "==", id),
      where("uid", "==", uid)
    );
    return onSnapshot(pagosQ, (snap) => {
      setPagos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [id, uid]);

  // 3) Ingresos al proyecto
  useEffect(() => {
    const ingQ = query(
      collection(db, "ingresosProyecto"),
      where("proyectoId", "==", id),
      where("uid", "==", uid)
    );
    return onSnapshot(ingQ, (snap) => {
      setIngresosProyecto(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [id, uid]);

  // 4) Colaboradores
  useEffect(() => {
    const colQ = query(
      collection(db, "colaboradores"),
      where("uid", "==", uid)
    );
    return onSnapshot(colQ, (snap) => {
      setColaboradores(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  // 5) Cotización dólar
  useEffect(() => {
    obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));
  }, []);

  if (!proyecto) return <p>Cargando proyecto…</p>;

  // Totales
  const totalPagado = pagos.reduce((sum, p) => {
    const m =
      proyecto.moneda === "USD"
        ? Number(p.montoUSD || 0)
        : Number(p.montoARS || 0);
    return sum + m;
  }, 0);
  const restante = proyecto.presupuesto - totalPagado;

  const totalIngresos = ingresosProyecto.reduce((sum, i) => {
    const ars = i.montoARS || i.montoARSConvertido || 0;
    return sum + ars;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold">{proyecto.nombre}</h1>
        <p className="text-sm text-gray-500">
          Descripción: {proyecto.descripcion}
        </p>
        <p>
          Presupuesto: {proyecto.presupuesto} {proyecto.moneda}
        </p>
        <p>
          Pagado: {totalPagado} {proyecto.moneda} / Restante: {restante}{" "}
          {proyecto.moneda}
        </p>
        <p>Ingresos recibidos (ARS): {totalIngresos}</p>
      </div>

      {/* Registrar ingreso al proyecto */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          Registrar ingreso al proyecto
        </h2>
        <ProyectoIngresoForm
          cotizacionUSD={cotizacionUSD}
          onAgregarIngreso={async (ingreso) => {
            await addDoc(collection(db, "ingresosProyecto"), {
              uid,
              proyectoId: id,
              ...ingreso,
              creadoEn: Timestamp.now(),
            });
          }}
        />
      </div>

      {/* Historial de ingresos */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Historial de ingresos</h2>
        {ingresosProyecto.length === 0 ? (
          <p className="text-gray-500">No hay ingresos registrados.</p>
        ) : (
          <ul className="space-y-2">
            {ingresosProyecto.map((i) => (
              <li
                key={i.id}
                className="p-3 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {i.moneda === "USD"
                      ? `u$d ${i.montoUSD || 0}`
                      : `$${i.montoARS || 0} ARS`}
                  </div>
                  <div className="text-sm text-gray-500">Fecha: {i.fecha1}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {i.creadoEn?.toDate
                    ? new Date(i.creadoEn.toDate()).toLocaleDateString()
                    : new Date(i.creadoEn).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Registrar pagos y su historial (igual que antes) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editandoPago ? "Editar pago" : "Registrar pago"}
        </h2>
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
              ...pago,
              colaboradorNombre: colabor?.nombre || "",
              creadoEn: Timestamp.now(),
            });
          }}
          onActualizarPago={async (pago) => {
            const ref = doc(db, "pagos", pago.id);
            const colabor = colaboradores.find(
              (c) => c.id === pago.colaboradorId
            );
            await updateDoc(ref, {
              ...pago,
              colaboradorNombre: colabor?.nombre || "",
            });
            setEditandoPago(null);
          }}
          onCancelEdit={() => setEditandoPago(null)}
        />
      </div>

      {/* Historial de pagos */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Historial de pagos</h2>
        {pagos.length === 0 ? (
          <p className="text-gray-500">No hay pagos registrados.</p>
        ) : (
          <ul className="space-y-2">
            {pagos.map((p) => (
              <li
                key={p.id}
                className="p-3 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-start"
              >
                <div>
                  <div className="font-medium">
                    {proyecto.moneda === "USD"
                      ? `${p.montoUSD || 0} USD`
                      : `${p.montoARS || 0} ARS`}
                  </div>
                  <div className="text-sm text-gray-500">
                    Descripción: {p.descripcion}
                  </div>
                  <div className="text-sm text-gray-500">
                    Método: {p.metodoPago}
                  </div>
                  <div className="text-sm text-gray-500">
                    Colaborador: {p.colaboradorNombre}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-gray-400">
                    {p.creadoEn?.toDate
                      ? new Date(p.creadoEn.toDate()).toLocaleDateString()
                      : new Date(p.creadoEn).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditandoPago(p)}
                      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteDoc(doc(db, "pagos", p.id))}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-sm"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
