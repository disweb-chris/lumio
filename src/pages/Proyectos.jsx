import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ProyectoForm from "../components/ProyectoForm";

export default function Proyectos() {
  const { user } = useAuth();
  const uid = user.uid;
  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState([]);
  const [editando, setEditando] = useState(null);

  // 1) Suscripción a proyectos del usuario
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "proyectos"),
      where("uid", "==", uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setProyectos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [uid]);

  // 2) Crear o actualizar proyecto
  const handleGuardar = async ({ id, nombre, presupuesto, moneda, descripcion }) => {
    if (id) {
      // actualizar existente
      await updateDoc(doc(db, "proyectos", id), {
        nombre,
        presupuesto,
        moneda,
        descripcion: descripcion || "", // nunca undefined
      });
      setEditando(null);
    } else {
      // crear nuevo (incluimos uid y descripción)
      await addDoc(collection(db, "proyectos"), {
        uid,
        nombre,
        presupuesto,
        moneda,
        descripcion: descripcion || "",
        creadoEn: Timestamp.now(),
      });
    }
  };

  // 3) Eliminar proyecto
  const handleEliminar = async (id) => {
    if (window.confirm("¿Eliminar este proyecto?")) {
      await deleteDoc(doc(db, "proyectos", id));
      if (editando?.id === id) setEditando(null);
    }
  };

  return (
    <div>
      {/* Formulario de creación/edición */}
      <ProyectoForm
        editando={editando}
        onGuardar={handleGuardar}
        onCancel={() => setEditando(null)}
      />

      {/* Lista de proyectos */}
      <ul className="space-y-2">
        {proyectos.map((p) => (
          <li
            key={p.id}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{p.nombre}</p>
              <p className="text-sm text-gray-500">
                Presupuesto: {p.presupuesto} {p.moneda}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditando(p)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => navigate(`/proyectos/${p.id}`)}
                className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm"
              >
                📄 Ver detalle
              </button>
              <button
                onClick={() => handleEliminar(p.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
              >
                🗑 Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
