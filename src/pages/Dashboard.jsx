import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import CategoriaCard from "../components/CategoriaCard";
import { formatearMoneda } from "../utils/format";
import dayjs from "dayjs";

export default function Dashboard() {
  const [categorias, setCategorias] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [vencimientos, setVencimientos] = useState([]);

  useEffect(() => {
    const unsubCategorias = onSnapshot(collection(db, "categorias"), (snap) =>
      setCategorias(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    const unsubGastos = onSnapshot(collection(db, "gastos"), (snap) =>
      setGastos(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    const unsubIngresos = onSnapshot(collection(db, "ingresos"), (snap) =>
      setIngresos(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    const unsubVencimientos = onSnapshot(collection(db, "vencimientos"), (snap) =>
      setVencimientos(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    return () => {
      unsubCategorias();
      unsubGastos();
      unsubIngresos();
      unsubVencimientos();
    };
  }, []);

  const totalIngresos = ingresos
    .filter((i) => i.recibido)
    .reduce((acc, i) => acc + i.monto, 0);

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  const dineroDisponible = totalIngresos - totalGastos;

  const ingresosPendientes = ingresos.filter((i) => !i.recibido);
  const totalPendiente = ingresosPendientes.reduce((acc, i) => acc + i.monto, 0);

  const vencimientosPendientes = vencimientos.filter((v) => !v.pagado);
  const totalVencimientosPendientes = vencimientosPendientes.reduce(
    (acc, v) => acc + v.monto,
    0
  );

  const proximosVencimientos = vencimientos.filter((v) => {
    const hoy = dayjs();
    const fechaVenc = dayjs(v.fecha?.toDate ? v.fecha.toDate() : v.fecha);
    return !v.pagado && fechaVenc.diff(hoy, "day") <= 3 && fechaVenc.diff(hoy, "day") >= 0;
  });

  const acciones = [
    ...gastos.map((g) => ({ tipo: "Gasto", descripcion: g.descripcion, fecha: g.fecha })),
    ...ingresos
      .filter((i) => i.recibido)
      .map((i) => ({ tipo: "Ingreso", descripcion: i.descripcion, fecha: i.fecha })),
    ...vencimientos
      .filter((v) => v.pagado)
      .map((v) => ({ tipo: "Pago", descripcion: v.descripcion, fecha: v.fecha })),
  ];

  const recientes = acciones
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  return (
    <div>
      {proximosVencimientos.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
          ⚠️ Tienes {proximosVencimientos.length} pago(s) por vencer en los próximos días.
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center mb-6">
        <p className="text-gray-500 dark:text-gray-300 text-sm">Dinero disponible</p>
        <p
          className={`text-3xl font-bold ${
            dineroDisponible < 0 ? "text-red-500" : "text-green-500"
          }`}
        >
          ${formatearMoneda(dineroDisponible)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">Ingresos pendientes</p>
          <p className="text-xl font-bold text-yellow-400">
            ${formatearMoneda(totalPendiente)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {ingresosPendientes.length} ingreso(s)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">Vencimientos pendientes</p>
          <p className="text-xl font-bold text-red-500">
            ${formatearMoneda(totalVencimientosPendientes)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {vencimientosPendientes.length} vencimiento(s)
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">Actividad reciente</h3>
        <ul className="space-y-2">
          {recientes.map((item, i) => (
            <li key={i} className="text-sm text-gray-700 dark:text-gray-200">
              <span className="font-bold">{item.tipo}:</span> {item.descripcion} –{" "}
              {new Date(item.fecha?.toDate ? item.fecha.toDate() : item.fecha).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mt-6">
        {categorias.map((cat) => (
          <CategoriaCard key={cat.id} {...cat} />
        ))}
      </div>
    </div>
  );
}
