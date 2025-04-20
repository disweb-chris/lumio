// src/pages/Informe.jsx
import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import dayjs from "dayjs";
import FiltroMes from "../components/FiltroMes";
import { formatearMoneda } from "../utils/format";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import { useAuth } from "../context/AuthContext";

const COLORS = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
  "#8B5CF6",
];

export default function Informe() {
  const { user } = useAuth();
  const uid = user.uid;

  const [gastos, setGastos] = useState([]);
  const [vencimientos, setVencimientos] = useState([]);
  const [gastosFiltrados, setGastosFiltrados] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);

  useEffect(() => {
    // Sólo los gastos de este usuario
    const qGastos = query(
      collection(db, "gastos"),
      where("uid", "==", uid)
    );
    const unsubG = onSnapshot(qGastos, (snap) => {
      setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Sólo los vencimientos de este usuario
    const qVenc = query(
      collection(db, "vencimientos"),
      where("uid", "==", uid)
    );
    const unsubV = onSnapshot(qVenc, (snap) => {
      setVencimientos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));

    return () => {
      unsubG();
      unsubV();
    };
  }, [uid]);

  const mostrarARSyUSD = (monto) => {
    const enUSD = (monto / cotizacionUSD).toFixed(2);
    return `${formatearMoneda(monto)} ARS / u$d ${enUSD}`;
  };

  // Total de consumo con tarjeta para el mes filtrado
  const totalTarjeta = gastosFiltrados.reduce((acc, g) => {
    return g.metodoPago?.toLowerCase().includes("tarjeta")
      ? acc + g.monto
      : acc;
  }, 0);

  // Vencimientos filtrados para el mismo mes que los gastos filtrados
  const vencimientosFiltrados = vencimientos.filter((v) => {
    if (!v.pagado || !v.fecha || gastosFiltrados.length === 0) return false;
    const mesRef = dayjs(
      gastosFiltrados[0].fecha?.toDate?.() || gastosFiltrados[0].fecha
    ).format("YYYY-MM");
    const mesV = dayjs(v.fecha?.toDate?.() || v.fecha).format("YYYY-MM");
    return mesV === mesRef;
  });

  // Agrupar gastos y vencimientos por categoría
  const gastosPorCategoria = {};
  gastosFiltrados.forEach((g) => {
    if (!g.categoria) return;
    gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] || 0) + g.monto;
  });
  vencimientosFiltrados.forEach((v) => {
    if (!v.categoria) return;
    gastosPorCategoria[v.categoria] = (gastosPorCategoria[v.categoria] || 0) + v.monto;
  });

  const dataPie = Object.entries(gastosPorCategoria).map(([name, value]) => ({
    name,
    value,
  }));
  const totalPie = dataPie.reduce((sum, d) => sum + d.value, 0);

  // Evolución mensual de todos los gastos
  const gastosPorMes = gastos.reduce((acc, gasto) => {
    const mes = dayjs(
      gasto.fecha?.toDate?.() || gasto.fecha
    ).format("YYYY-MM");
    acc[mes] = (acc[mes] || 0) + gasto.monto;
    return acc;
  }, {});
  const dataLine = Object.entries(gastosPorMes).map(([mes, total]) => ({
    mes: dayjs(mes + "-01").format("MMM YYYY"),
    total,
  }));

  // Consumo por método de pago
  const consumoPorMetodo = gastos.reduce((acc, g) => {
    const m = g.metodoPago || "Sin especificar";
    acc[m] = (acc[m] || 0) + g.monto;
    return acc;
  }, {});
  // Desglose por tarjeta
  const desglosePorTarjeta = {};
  gastos.forEach((g) => {
    if (g.metodoPago?.startsWith("Tarjeta:")) {
      const t = g.metodoPago.split(":")[1].trim();
      desglosePorTarjeta[t] = desglosePorTarjeta[t] || {};
      desglosePorTarjeta[t][g.categoria || "Sin categoría"] =
        (desglosePorTarjeta[t][g.categoria] || 0) + g.monto;
    }
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Informe de gastos
      </h2>

      <FiltroMes items={gastos} onFiltrar={setGastosFiltrados} />

      {gastosFiltrados.length > 0 && (
        <div className="text-sm text-purple-700 dark:text-purple-300 mb-4">
          💳 Consumo con tarjeta este mes:{" "}
          <span className="font-medium">{mostrarARSyUSD(totalTarjeta)}</span>
        </div>
      )}

      {totalPie === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          No hay gastos registrados para este mes.
        </p>
      ) : (
        <div className="w-full h-96">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={dataPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {dataPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => mostrarARSyUSD(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {dataLine.length > 0 && (
        <div className="w-full h-80 mt-12">
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
            Evolución mensual
          </h3>
          <ResponsiveContainer>
            <LineChart data={dataLine}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => mostrarARSyUSD(v)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4F46E5"
                name="Gastos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {dataPie.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
            Resumen por categoría
          </h3>
          <table className="w-full table-auto text-left bg-white dark:bg-gray-800 rounded overflow-hidden">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2">Monto</th>
                <th className="px-4 py-2">% del total</th>
              </tr>
            </thead>
            <tbody>
              {dataPie.map((item, i) => (
                <tr key={i} className="border-t border-gray-300 dark:border-gray-600">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{mostrarARSyUSD(item.value)}</td>
                  <td className="px-4 py-2">{((item.value / totalPie) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
          Tarjeta de crédito – Consumo por método de pago
        </h3>
        <ul className="space-y-1 mb-6">
          {Object.entries(consumoPorMetodo).map(([metodo, monto], i) => (
            <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
              {metodo}: {mostrarARSyUSD(monto)}
            </li>
          ))}
        </ul>

        {Object.entries(desglosePorTarjeta).map(([tarjeta, cats], i) => (
          <div key={i} className="mb-6">
            <h4 className="text-lg font-bold text-purple-700 dark:text-purple-300">
              💳 {tarjeta}
            </h4>
            <ul className="pl-4 mt-1 list-disc text-sm text-gray-700 dark:text-gray-300">
              {Object.entries(cats).map(([cat, monto], j) => (
                <li key={j}>
                  {cat}: {mostrarARSyUSD(monto)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
