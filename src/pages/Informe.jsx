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
import { collection, onSnapshot } from "firebase/firestore";
import dayjs from "dayjs";
import FiltroMes from "../components/FiltroMes";
import { formatearMoneda } from "../utils/format";
import { obtenerCotizacionUSD } from "../utils/configuracion";

const COLORS = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
  "#8B5CF6",
];

export default function Informe() {
  const [gastos, setGastos] = useState([]);
  const [vencimientos, setVencimientos] = useState([]);
  const [gastosFiltrados, setGastosFiltrados] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);

  useEffect(() => {
    const unsubGastos = onSnapshot(collection(db, "gastos"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGastos(data);
    });

    const unsubVenc = onSnapshot(collection(db, "vencimientos"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVencimientos(data);
    });

    obtenerCotizacionUSD().then((valor) => {
      if (valor) setCotizacionUSD(valor);
    });

    return () => {
      unsubGastos();
      unsubVenc();
    };
  }, []);

  const mostrarARSyUSD = (monto) => {
    const enUSD = (monto / cotizacionUSD).toFixed(2);
    return `${formatearMoneda(monto)} ARS / u$d ${enUSD}`;
  };

  const totalTarjeta = gastosFiltrados.reduce((acc, g) => {
    const esTarjeta = g.metodoPago?.toLowerCase().includes("tarjeta");
    return esTarjeta ? acc + g.monto : acc;
  }, 0);

  const vencimientosFiltrados = vencimientos.filter((v) => {
    if (!v.pagado || !v.fecha) return false;
    if (!gastosFiltrados.length) return false;
    const mesReferencia = dayjs(
      gastosFiltrados[0].fecha?.toDate?.() || gastosFiltrados[0].fecha
    ).format("YYYY-MM");
    const mesVenc = dayjs(v.fecha?.toDate?.() || v.fecha).format("YYYY-MM");
    return mesVenc === mesReferencia;
  });

  const gastosPorCategoria = {};

  gastosFiltrados.forEach((g) => {
    if (!g.categoria) return;
    gastosPorCategoria[g.categoria] =
      (gastosPorCategoria[g.categoria] || 0) + g.monto;
  });

  vencimientosFiltrados.forEach((v) => {
    if (!v.categoria) return;
    gastosPorCategoria[v.categoria] =
      (gastosPorCategoria[v.categoria] || 0) + v.monto;
  });

  const data = Object.entries(gastosPorCategoria).map(([name, value]) => ({
    name,
    value,
  }));

  const total = data.reduce((acc, d) => acc + d.value, 0);

  const gastosPorMes = gastos.reduce((acc, gasto) => {
    const mes = dayjs(
      gasto.fecha?.toDate ? gasto.fecha.toDate() : gasto.fecha
    ).format("YYYY-MM");
    acc[mes] = (acc[mes] || 0) + gasto.monto;
    return acc;
  }, {});

  const dataLineChart = Object.entries(gastosPorMes).map(([mes, total]) => ({
    mes: dayjs(mes + "-01").format("MMM YYYY"),
    total,
  }));

  const consumoPorMetodo = gastos.reduce((acc, gasto) => {
    const metodo = gasto.metodoPago || "Sin especificar";
    if (!acc[metodo]) acc[metodo] = 0;
    acc[metodo] += gasto.monto;
    return acc;
  }, {});

  const desglosePorTarjeta = {};

  gastos.forEach((gasto) => {
    const metodo = gasto.metodoPago || "";
    if (metodo.startsWith("Tarjeta:")) {
      const tarjeta = metodo.split(":")[1].trim();
      if (!desglosePorTarjeta[tarjeta]) desglosePorTarjeta[tarjeta] = {};
      const cat = gasto.categoria || "Sin categoría";
      if (!desglosePorTarjeta[tarjeta][cat])
        desglosePorTarjeta[tarjeta][cat] = 0;
      desglosePorTarjeta[tarjeta][cat] += gasto.monto;
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

      {total === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          No hay gastos registrados para este mes.
        </p>
      ) : (
        <div className="w-full h-96">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => mostrarARSyUSD(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {dataLineChart.length > 0 && (
        <div className="w-full h-80 mt-12">
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
            Evolución mensual
          </h3>
          <ResponsiveContainer>
            <LineChart data={dataLineChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => mostrarARSyUSD(value)} />
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

      {data.length > 0 && (
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
              {data.map((item, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-300 dark:border-gray-600"
                >
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{mostrarARSyUSD(item.value)}</td>
                  <td className="px-4 py-2">
                    {((item.value / total) * 100).toFixed(1)}%
                  </td>
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

        {Object.entries(desglosePorTarjeta).map(([tarjeta, categorias], i) => (
          <div key={i} className="mb-6">
            <h4 className="text-lg font-bold text-purple-700 dark:text-purple-300">
              💳 {tarjeta}
            </h4>
            <ul className="pl-4 mt-1 list-disc text-sm text-gray-700 dark:text-gray-300">
              {Object.entries(categorias).map(([categoria, monto], j) => (
                <li key={j}>
                  {categoria}: {mostrarARSyUSD(monto)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
