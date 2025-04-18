import { useState, useEffect } from "react";
import dayjs from "dayjs";

export default function FiltroMes({
  items = [],
  campoFecha = "fecha",
  onFiltrar = null,
  onMesChange = null,
}) {
  const hoy = dayjs();
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.format("YYYY-MM"));

  useEffect(() => {
    if (onMesChange) onMesChange(mesSeleccionado);

    if (onFiltrar) {
      if (mesSeleccionado === "todos") {
        onFiltrar(items);
      } else {
        const [año, mes] = mesSeleccionado.split("-");
        const filtrados = items.filter((item) => {
          const rawFecha = item[campoFecha];
          if (!rawFecha) return false;
          const fecha = dayjs(rawFecha.toDate?.() || rawFecha);
          return (
            fecha.year() === parseInt(año) && fecha.month() === parseInt(mes) - 1
          );
        });

        onFiltrar(filtrados);
      }
    }
  }, [mesSeleccionado, items, campoFecha, onFiltrar, onMesChange]);

  const generarOpciones = () => {
    const meses = [];
    const inicio = hoy.subtract(12, "month");
    for (let i = 0; i <= 12; i++) {
      const f = inicio.add(i, "month");
      meses.push(f.format("YYYY-MM"));
    }
    return meses;
  };

  return (
    <div className="mb-2">
      <label className="block text-sm text-gray-300 mb-1">Filtrar por mes:</label>
      <select
        value={mesSeleccionado}
        onChange={(e) => setMesSeleccionado(e.target.value)}
        className="p-2 rounded border bg-gray-800 text-white"
      >
        <option value="todos">Todos los meses</option>
        {generarOpciones()
          .reverse()
          .map((m) => (
            <option key={m} value={m}>
              {dayjs(m).format("MMMM YYYY")}
            </option>
          ))}
      </select>
    </div>
  );
}
