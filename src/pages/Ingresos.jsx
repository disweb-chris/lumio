// src/pages/Ingresos.jsx
import { useState, useEffect } from "react";
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

export default function Ingresos() {
  const { user } = useAuth();
  const uid = user.uid;

  const [ingresos, setIngresos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  // Listener de Firestore
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

  // Totales globales usando los campos fijos de cada documento
  const totalEsperadoARS = ingresos.reduce(
    (acc, i) => acc + (i.moneda === "USD" ? i.montoARSConvertido : i.montoARS),
    0
  );
  const totalEsperadoUSD = ingresos.reduce(
    (acc, i) => acc + (i.moneda === "ARS" ? i.montoUSDConvertido : i.montoUSD),
    0
  );
  const totalRecibidoARS = ingresos.reduce(
    (acc, i) => acc + (i.montoRecibido || 0),
    0
  );
  const totalRecibidoUSD = ingresos.reduce(
    (acc, i) => acc + (i.montoRecibido || 0) / i.cotizacionAlMomento,
    0
  );

  // Alta de ingreso
  const agregarIngreso = async (nuevo) => {
    await addDoc(collection(db, "ingresos"), {
      ...nuevo,
      uid,
      fecha1: Timestamp.fromDate(new Date(nuevo.fecha1)),
      fecha2: nuevo.fecha2 ? Timestamp.fromDate(new Date(nuevo.fecha2)) : null,
    });
  };

  // Registrar pago parcial o completo, respetando montos manuales y moneda
  const togglePago = async (ingreso, parte) => {
    const nuevo = { ...ingreso };
    const importeTotalARS =
      ingreso.moneda === "USD" ? ingreso.montoARSConvertido : ingreso.montoARS;

    // Pago 1
    if (parte === 1 && !ingreso.recibido1) {
      nuevo.recibido1 = true;
      let addARS;
      if (ingreso.dividido && typeof ingreso.monto1 === 'number') {
        // Manual: monto1 está en moneda original
        addARS = ingreso.moneda === 'USD'
          ? ingreso.monto1 * ingreso.cotizacionAlMomento
          : ingreso.monto1;
      } else if (ingreso.dividido) {
        // auto: mitad del total en ARS
        addARS = importeTotalARS / 2;
      } else {
        // pago completo
        addARS = importeTotalARS;
      }
      nuevo.montoRecibido = (nuevo.montoRecibido || 0) + addARS;
    }

    // Pago 2
    if (parte === 2 && ingreso.dividido && !ingreso.recibido2) {
      nuevo.recibido2 = true;
      let addARS;
      if (typeof ingreso.monto2 === 'number') {
        // Manual: monto2 en moneda original
        addARS = ingreso.moneda === 'USD'
          ? ingreso.monto2 * ingreso.cotizacionAlMomento
          : ingreso.monto2;
      } else {
        // auto fallback
        addARS = importeTotalARS / 2;
      }
      nuevo.montoRecibido = (nuevo.montoRecibido || 0) + addARS;
    }

    await updateDoc(doc(db, "ingresos", ingreso.id), nuevo);
  };

  // Eliminar ingreso
  const eliminarIngreso = async (id) => {
    if (window.confirm("¿Eliminar este ingreso?")) {
      await deleteDoc(doc(db, "ingresos", id));
    }
  };

  // Filtrado por estado de pago
  const ingresosFiltrados = ingresos.filter((i) => {
    const importeTotalARS = i.moneda === "USD" ? i.montoARSConvertido : i.montoARS;
    const recARS = i.montoRecibido || 0;
    if (filtro === "pendientes") return recARS < importeTotalARS;
    if (filtro === "recibidos") return recARS >= importeTotalARS;
    return true;
  });

  // Helper para mostrar importe fijo
  const formatoImporte = (i) => {
    if (i.moneda === "USD") {
      return `\$${formatearMoneda(i.montoARSConvertido)} ARS / u\$d ${i.montoUSD}`;
    }
    return `\$${formatearMoneda(i.montoARS)} ARS / u\$d ${i.montoUSDConvertido}`;
  };

  return (
    <div>
      {/* Totales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Total esperado</p>
          <p className="text-2xl font-bold text-blue-600">
            {`$${formatearMoneda(totalEsperadoARS)} ARS / u$d ${totalEsperadoUSD.toFixed(2)}`}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Total recibido</p>
          <p className="text-2xl font-bold text-green-500">
            {`$${formatearMoneda(totalRecibidoARS)} ARS / u$d ${totalRecibidoUSD.toFixed(2)}`}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Pendiente</p>
          <p
            className={`text-2xl font-bold ${
              totalEsperadoARS - totalRecibidoARS < 0 ? "text-red-500" : "text-yellow-500"
            }`}>
            {`$${formatearMoneda(totalEsperadoARS - totalRecibidoARS)} ARS / u$d ${(totalEsperadoUSD - totalRecibidoUSD).toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <IngresoForm onAgregarIngreso={agregarIngreso} />

      {/* Filtro */}
      <div className="flex gap-4 mt-4 mb-2">
        {['todos','pendientes','recibidos'].map(opt => (
          <label key={opt} className="text-sm flex items-center gap-1">
            <input
              type="radio"
              value={opt}
              checked={filtro===opt}
              onChange={(e)=>setFiltro(e.target.value)}
            />
            {opt.charAt(0).toUpperCase()+opt.slice(1)}
          </label>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <p className="text-center text-gray-500">Cargando…</p>
      ) : (
        <ul className="space-y-3">
          {ingresosFiltrados.map((ing) => {
            const importeTotalARS = ing.moneda==='USD'?ing.montoARSConvertido:ing.montoARS;
            const recARS = ing.montoRecibido||0;
            return (
              <li key={ing.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">{ing.descripcion}</p>
                  <p className="text-sm text-gray-500">Monto total: {formatoImporte(ing)}</p>
                  <p className="text-sm text-gray-500">
                    Recibido: ${formatearMoneda(recARS)} ARS / u$d {(recARS/ing.cotizacionAlMomento).toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {!ing.recibido1 && (
                    <button onClick={()=>togglePago(ing,1)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                      Registrar 1° pago
                    </button>
                  )}
                  {ing.dividido && !ing.recibido2 && (
                    <button onClick={()=>togglePago(ing,2)} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">
                      Registrar 2° pago
                    </button>
                  )}
                  <button onClick={()=>eliminarIngreso(ing.id)} className="text-red-600 border border-red-600 px-3 py-1 rounded text-sm hover:bg-red-50">
                    🗑 Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
