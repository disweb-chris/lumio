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

  // 1) Traer datos del proyecto
  useEffect(() => {
    const ref = doc(db, "proyectos", id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setProyecto({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [id]);

  // 2) Traer pagos de este proyecto (filtrado por proyectoId y uid)
  useEffect(() => {
    const pagosQuery = query(
      collection(db, "pagos"),
      where("proyectoId", "==", id),
      where("uid", "==", uid)
    );
    const unsub = onSnapshot(pagosQuery, (snap) => {
      setPagos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id, uid]);

  // 3) Traer colaboradores del usuario
  useEffect(() => {
    const colQuery = query(
      collection(db, "colaboradores"),
      where("uid", "==", uid)
    );
    const unsub = onSnapshot(colQuery, (snap) => {
      setColaboradores(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [uid]);

  if (!proyecto) return <p>Cargando proyecto…</p>;

  // Cálculo de totales
  const totalPagado = pagos.reduce((sum, p) => {
    return sum + (proyecto.moneda === "USD" ? (p.montoUSD || 0) : (p.montoARS || 0));
  }, 0);
  const restante = proyecto.presupuesto - totalPagado;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold">{proyecto.nombre}</h1>
        <p className="text-sm text-gray-500">Descripción: {proyecto.descripcion}</p>
        <p>
          Presupuesto: {proyecto.presupuesto} {proyecto.moneda}
        </p>
        <p>
          Pagado: {totalPagado} {proyecto.moneda} / Restante: {restante}{" "}
          {proyecto.moneda}
        </p>
      </div>

      {/* Formulario de pagos */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Registrar pago</h2>
        <PaymentForm
          proyectoId={id}
          colaboradores={colaboradores}
          onAgregarPago={async (pago) => {
            await addDoc(collection(db, "pagos"), {
                uid, 
                proyectoId: id, 
                ...pago, 
                colaboradorNombre: colabor?.nombre || "",  // <-- aquí guardamos el nombre 
                creadoEn: Timestamp.now(), 
              });
          }}
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
                className="p-3 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {proyecto.moneda === "USD"
                      ? `${p.montoUSD || 0} USD`
                      : `${p.montoARS || 0} ARS`}
                  </div>
                  <div className="text-sm text-gray-500">
                    Método: {p.metodoPago}
                  </div>
                  <div className="text-sm text-gray-500">
                    Colaborador: {p.colaboradorNombre}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(p.creadoEn.toDate()).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
