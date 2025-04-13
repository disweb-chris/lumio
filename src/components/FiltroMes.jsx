// components/FiltroMes.jsx
import { useEffect, useState } from "react";
import dayjs from "dayjs";

export default function FiltroMes({ items, onFiltrar }) {
  const [meses, setMeses] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  useEffect(() => {
    const mesesUnicos = Array.from(
      new Set(items.map((item) => dayjs(item.fecha).format("YYYY-MM")))
    ).sort().reverse();
    setMeses(mesesUnicos);
  }, [items]);

  useEffect(() => {
    const filtrados = items.filter((item) =>
      mesSeleccionado ? item.fecha.startsWith(mesSeleccionado) : true
    );
    onFiltrar(filtrados);
  }, [mesSeleccionado, items, onFiltrar]);

  return (
    <div className="mb-4">
      <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Filtrar por mes:</label>
      <select
        value={mesSeleccionado}
        onChange={(e) => setMesSeleccionado(e.target.value)}
        className="p-2 border rounded dark:bg-gray-700 dark:text-white"
      >
        <option value="">Todos los meses</option>
        {meses.map((mes) => (
          <option key={mes} value={mes}>
            {dayjs(mes + "-01").format("MMMM YYYY")}
          </option>
        ))}
      </select>
    </div>
  );
}
