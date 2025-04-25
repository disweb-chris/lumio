// src/pages/Colaboradores.jsx
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ColaboradorForm from "../components/ColaboradorForm";
import { toast } from "react-toastify";

export default function Colaboradores() {
  const { user } = useAuth();
  const uid = user.uid;

  const [colaboradores, setColaboradores] = useState([]);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);

  // 1) Escuchar cambios en Firestore
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "colaboradores"),
      where("uid", "==", uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setColaboradores(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
        setCargando(false);
      },
      (err) => {
        console.error("Error cargando colaboradores:", err);
        setCargando(false);
      }
    );
    return () => unsub();
  }, [uid]);

  // 2) Agregar o actualizar
  const handleAgregar = async ({ id, nombre, rol }) => {
    try {
      if (id) {
        // actualizar existente
        const ref = doc(db, "colaboradores", id);
        await updateDoc(ref, { nombre, rol });
        toast.success("✅ Colaborador actualizado");
      } else {
        // nuevo colaborador
        await addDoc(collection(db, "colaboradores"), {
          uid,
          nombre,
          rol,
          creadoEn: new Date(),
        });
        toast.success("✅ Colaborador agregado");
      }
      setEditando(null);
    } catch (err) {
      console.error("Error guardando colaborador:", err);
      toast.error("❌ Error al guardar colaborador");
    }
  };

  // 3) Eliminar
  const handleEliminar = async (col) => {
    if (!window.confirm("¿Eliminar este colaborador?")) return;
    try {
      await deleteDoc(doc(db, "colaboradores", col.id));
      toast.info("🗑 Colaborador eliminado");
      if (editando?.id === col.id) setEditando(null);
    } catch (err) {
      console.error("Error eliminando colaborador:", err);
      toast.error("❌ Error al eliminar colaborador");
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg
          className="animate-spin h-12 w-12 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Colaboradores
      </h2>

      <ColaboradorForm
        colaboradores={colaboradores}
        onAgregar={handleAgregar}
        editando={editando}
        onCancel={() => setEditando(null)}
      />

      <ul className="space-y-3 mt-4">
        {colaboradores.map((col) => (
          <li
            key={col.id}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {col.nombre}
              </p>
              {col.rol && (
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {col.rol}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditando(col)}
                className="text-blue-600 border border-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-50"
              >
                ✏️
              </button>
              <button
                onClick={() => handleEliminar(col)}
                className="text-red-600 border border-red-600 px-3 py-1 rounded text-sm hover:bg-red-50"
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
