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
import { obtenerDeStorage } from "../utils/storage";
import dayjs from "dayjs";
import FiltroMes from "../components/FiltroMes";
import { formatearMoneda } from "../utils/format";

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
  const [gastosFiltrados, setGastosFiltrados] = useState([]);

  useEffect(() => {
    const data = obtenerDeStorage("gastos", []);
    setGastos(data);
  }, []);

  // 👉 Agrupar gastos por categoría (filtro activo)
  const gastosPorCategoria = gastosFiltrados.reduce((acc, gasto) => {
    if (!acc[gasto.categoria]) {
      acc[gasto.categoria] = 0;
    }
    acc[gasto.categoria] += gasto.monto;
    return acc;
  }, {});

  const data = Object.entries(gastosPorCategoria).map(([nombre, monto]) => ({
    name: nombre,
    value: monto,
  }));

  const total = data.reduce((acc, d) => acc + d.value, 0);

  // 👉 Agrupar todos los gastos por mes para gráfico de líneas
  const gastosPorMes = gastos.reduce((acc, gasto) => {
    const mes = dayjs(gasto.fecha).format("YYYY-MM");
    acc[mes] = (acc[mes] || 0) + gasto.monto;
    return acc;
  }, {});

  const dataLineChart = Object.entries(gastosPorMes).map(([mes, total]) => ({
    mes: dayjs(mes + "-01").format("MMM YYYY"),
    total,
  }));

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Informe de gastos
      </h2>

      {/* Filtro por mes */}
      <FiltroMes items={gastos} onFiltrar={setGastosFiltrados} />

      {/* Gráfico de torta */}
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
              <Tooltip
                formatter={(value) =>
                  `$${value.toLocaleString("es-AR")}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de líneas */}
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
              <Tooltip formatter={(value) => `$${formatearMoneda(value)}`} />
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

      {/* Tabla resumen */}
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
                  <td className="px-4 py-2">${formatearMoneda(item.value)}</td>
                  <td className="px-4 py-2">
                    {((item.value / total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
