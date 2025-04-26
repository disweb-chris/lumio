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
import { toast } from "react-toastify";
import ColaboradorForm from "../components/ColaboradorForm";

export default function Colaboradores() {
  const { user } = useAuth();
  const uid = user.uid;

  const [colaboradores, setColaboradores] = useState([]);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "colaboradores"), where("uid", "==", uid));
    const unsub = onSnapshot(q, (snap) =>
      setColaboradores(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [uid]);

  const handleGuardar = async (col) => {
    try {
      if (col.id) {
        const ref = doc(db, "colaboradores", col.id);
        await updateDoc(ref, {
          nombre: col.nombre,
          rol: col.rol,
          dni: col.dni,
          email: col.email,
          telefono: col.telefono,
          metodosPago: col.metodosPago,
        });
        toast.success("✅ Colaborador actualizado");
      } else {
        await addDoc(collection(db, "colaboradores"), {
          uid,
          nombre: col.nombre,
          rol: col.rol,
          dni: col.dni,
          email: col.email,
          telefono: col.telefono,
          metodosPago: col.metodosPago,
          creadoEn: new Date(),
        });
        toast.success("✅ Colaborador agregado");
      }
      setEditando(null);
    } catch (err) {
      console.error(err);
      toast.error("❌ Error guardando colaborador");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este colaborador?")) return;
    await deleteDoc(doc(db, "colaboradores", id));
    toast.success("🗑 Colaborador eliminado");
  };

  return (
    <div>
      <ColaboradorForm
        colaboradores={colaboradores}
        editando={editando}
        onGuardar={handleGuardar}
        onCancel={() => setEditando(null)}
      />

      <ul className="space-y-2">
        {colaboradores.map((c) => (
          <li
            key={c.id}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{c.nombre}</p>
              <p className="text-sm text-gray-500">Rol: {c.rol}</p>
              <p className="text-sm text-gray-500">DNI: {c.dni}</p>
              <p className="text-sm text-gray-500">Email: {c.email}</p>
              <p className="text-sm text-gray-500">Tel: {c.telefono}</p>
              <p className="text-sm text-gray-500">
                Pagos: {c.metodosPago.join(", ")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditando(c)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
              >
                ✏️
              </button>
              <button
                onClick={() => handleEliminar(c.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
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
