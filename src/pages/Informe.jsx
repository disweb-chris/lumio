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
import { useAuth } from "../context/AuthContext";
import { esPagoConTarjeta } from "../utils/pago";

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
  const [cotizacionUSD, setCotizacionUSD] = useState(1);
  const [mes, setMes] = useState(dayjs().format("YYYY-MM"));

  useEffect(() => {
    const qG = query(collection(db, "gastos"), where("uid", "==", uid));
    const unsubG = onSnapshot(qG, (snap) => {
      setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qV = query(collection(db, "vencimientos"), where("uid", "==", uid));
    const unsubV = onSnapshot(qV, (snap) => {
      setVencimientos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    import("../utils/configuracion").then((mod) => {
      mod.obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));
    });

    return () => {
      unsubG();
      unsubV();
    };
  }, [uid]);

  // Recuperar montos fijos
  const valorARS = (item) => item.montoARSConvertido ?? item.montoARS ?? 0;
  const valorUSD = (item) => {
    if (item.montoUSD != null) return item.montoUSD;
    if (item.montoUSDConvertido != null) return item.montoUSDConvertido;
    if (item.cotizacionAlMomento) {
      const ars = valorARS(item);
      return +(ars / item.cotizacionAlMomento).toFixed(2);
    }
    return +((valorARS(item) / cotizacionUSD).toFixed(2));
  };
  const mostrarFixed = (ars, usd) =>
    `${formatearMoneda(ars)} ARS / u$d ${usd.toFixed(2)}`;

  // Filtrar por mes
  const filtrarPorMes = (arr) =>
    arr.filter(
      (x) =>
        dayjs(x.fecha?.toDate ? x.fecha.toDate() : x.fecha).format("YYYY-MM") ===
        mes
    );
  const gastosMes = filtrarPorMes(gastos);
  const vencPagadosMes = filtrarPorMes(vencimientos).filter((v) => v.pagado);

  // Datos para el pie
  const dataPorCat = {};
  gastosMes.forEach((g) => {
    if (!g.categoria) return;
    dataPorCat[g.categoria] = (dataPorCat[g.categoria] || 0) + valorARS(g);
  });
  vencPagadosMes.forEach((v) => {
    if (!v.categoria) return;
    dataPorCat[v.categoria] = (dataPorCat[v.categoria] || 0) + valorARS(v);
  });
  const dataPie = Object.entries(dataPorCat).map(([name, value]) => ({ name, value }));
  const totalPie = dataPie.reduce((sum, d) => sum + d.value, 0);

  // Evolución mensual
  const gastosPorMesObj = {};
  gastos.forEach((g) => {
    const m = dayjs(g.fecha?.toDate ? g.fecha.toDate() : g.fecha).format("YYYY-MM");
    gastosPorMesObj[m] = (gastosPorMesObj[m] || 0) + valorARS(g);
  });
  const dataLine = Object.entries(gastosPorMesObj).map(([m, v]) => ({
    mes: dayjs(m + "-01").format("MMM YYYY"),
    total: v,
  }));

  // Consumo con tarjeta (incluye Mercado Pago)
  const totalTarjetaARS = gastosMes
    .filter((g) => esPagoConTarjeta(g.metodoPago))
    .reduce((sum, g) => sum + valorARS(g), 0);
  const totalTarjetaUSD = gastosMes
    .filter((g) => esPagoConTarjeta(g.metodoPago))
    .reduce((sum, g) => sum + valorUSD(g), 0);

  // Consumo por método
  const consumoMetodoARS = {};
  const consumoMetodoUSD = {};
  gastosMes.forEach((g) => {
    const m = g.metodoPago || "Sin especificar";
    consumoMetodoARS[m] = (consumoMetodoARS[m] || 0) + valorARS(g);
    consumoMetodoUSD[m] = (consumoMetodoUSD[m] || 0) + valorUSD(g);
  });

  // Desglose por tarjeta
  const desgloseTarARS = {};
  const desgloseTarUSD = {};
  gastosMes.forEach((g) => {
    if (!esPagoConTarjeta(g.metodoPago)) return;
    const t = g.metodoPago.replace(/^Tarjeta:?\s*/i, "").trim();
    desgloseTarARS[t] = desgloseTarARS[t] || {};
    desgloseTarARS[t][g.categoria || "Sin categoría"] =
      (desgloseTarARS[t][g.categoria] || 0) + valorARS(g);
    desgloseTarUSD[t] = desgloseTarUSD[t] || {};
    desgloseTarUSD[t][g.categoria || "Sin categoría"] =
      (desgloseTarUSD[t][g.categoria] || 0) + valorUSD(g);
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Informe de gastos
      </h2>

      <FiltroMes items={gastos} onFiltrar={() => {}} onMesChange={setMes} />

      {gastosMes.length > 0 && (
        <div className="text-sm text-purple-700 dark:text-purple-300 mb-4">
          💳 Consumo con tarjeta este mes:{" "}
          {mostrarFixed(totalTarjetaARS, totalTarjetaUSD)}
        </div>
      )}

      {totalPie === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          No hay gastos o vencimientos pagados para este mes.
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
              <Tooltip
                formatter={(v) =>
                  mostrarFixed(v, +(v / cotizacionUSD).toFixed(2))
                }
              />
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
              <Tooltip
                formatter={(v) =>
                  mostrarFixed(v, +(v / cotizacionUSD).toFixed(2))
                }
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#4F46E5" name="Gastos" />
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
                <th className="px-4 py-2">Monto ARS</th>
                <th className="px-4 py-2">Monto USD</th>
                <th className="px-4 py-2">% del total</th>
              </tr>
            </thead>
            <tbody>
              {dataPie.map((item, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-300 dark:border-gray-600"
                >
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{formatearMoneda(item.value)}</td>
                  <td className="px-4 py-2">
                    {valorUSD({ montoARSConvertido: item.value, cotizacionAlMomento: cotizacionUSD }).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    {((item.value / totalPie) * 100).toFixed(1)}%
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
        <ul className="space-y-1 mb-6 text-gray-700 dark:text-gray-300">
          {Object.entries(consumoMetodoARS).map(([metodo]) => (
            <li key={metodo}>
              {metodo}: {mostrarFixed(consumoMetodoARS[metodo], consumoMetodoUSD[metodo])}
            </li>
          ))}
        </ul>

        {Object.entries(desgloseTarARS).map(([tarjeta, cats]) => (
          <div key={tarjeta} className="mb-6">
            <h4 className="text-lg font-bold text-purple-700 dark:text-purple-300">
              💳 {tarjeta}
            </h4>
            <ul className="pl-4 mt-1 list-disc text-sm text-gray-700 dark:text-gray-300">
              {Object.entries(cats).map(([cat, monto]) => (
                <li key={cat}>
                  {cat}: {mostrarFixed(monto, desgloseTarUSD[tarjeta][cat] || 0)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
