// src/pages/ProyectoDetalle.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import PaymentForm from "../components/PaymentForm";

export default function ProyectoDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const uid = user.uid;

  const [proyecto, setProyecto] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [editandoPago, setEditandoPago] = useState(null);

  // 1) Cargar proyecto
  useEffect(() => {
    const ref = doc(db, "proyectos", id);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setProyecto({ id: snap.id, ...snap.data() });
    });
  }, [id]);

  // 2) Cargar pagos
  useEffect(() => {
    const pagosQuery = query(
      collection(db, "pagos"),
      where("proyectoId", "==", id),
      where("uid", "==", uid)
    );
    return onSnapshot(pagosQuery, (snap) => {
      setPagos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [id, uid]);

  // 3) Cargar colaboradores
  useEffect(() => {
    const colQuery = query(
      collection(db, "colaboradores"),
      where("uid", "==", uid)
    );
    return onSnapshot(colQuery, (snap) => {
      setColaboradores(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  if (!proyecto) return <p>Cargando proyecto…</p>;

  // Totales
  const totalPagado = pagos.reduce((sum, p) => {
    const monto = proyecto.moneda === "USD"
      ? Number(p.montoUSD || 0)
      : Number(p.montoARS || 0);
    return sum + monto;
  }, 0);
  const restante = proyecto.presupuesto - totalPagado;

  // Handlers
  const crearPago = async (pago) => {
    const colabor = colaboradores.find(c => c.id === pago.colaboradorId);
    await addDoc(collection(db, "pagos"), {
      uid,
      proyectoId: id,
      ...pago,
      colaboradorNombre: colabor?.nombre || "",
      creadoEn: Timestamp.now(),
    });
  };

  const actualizarPago = async (pago) => {
    const ref = doc(db, "pagos", pago.id);
    const colabor = colaboradores.find(c => c.id === pago.colaboradorId);
    await updateDoc(ref, {
      ...pago,
      colaboradorNombre: colabor?.nombre || "",
    });
    setEditandoPago(null);
  };

  const eliminarPago = async (pagoId) => {
    if (window.confirm("¿Eliminar este pago?")) {
      await deleteDoc(doc(db, "pagos", pagoId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold">{proyecto.nombre}</h1>
        <p className="text-sm text-gray-500">
          Descripción: {proyecto.descripcion}
        </p>
        <p>Presupuesto: {proyecto.presupuesto} {proyecto.moneda}</p>
        <p>
          Pagado: {totalPagado} {proyecto.moneda} / Restante: {restante}{" "}
          {proyecto.moneda}
        </p>
      </div>

      {/* Formulario de pago (nueva o edición) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editandoPago ? "Editar pago" : "Registrar pago"}
        </h2>
        <PaymentForm
          colaboradores={colaboradores}
          pagoInicial={editandoPago}
          onAgregarPago={crearPago}
          onActualizarPago={actualizarPago}
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
                      onClick={() => eliminarPago(p.id)}
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
