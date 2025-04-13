import { useState, useEffect } from "react";
import { obtenerDeStorage, guardarEnStorage } from "../utils/storage";
import { formatearMoneda } from "../utils/format";
import dayjs from "dayjs";
import FiltroMes from "../components/FiltroMes";
import GastoForm from "../components/GastoForm";

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [gastosFiltrados, setGastosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState(() =>
    obtenerDeStorage("categorias", [])
  );

  useEffect(() => {
    const data = obtenerDeStorage("gastos", []);
    setGastos(data.reverse());
  }, []);

  const agregarGasto = (categoria, monto, descripcion, fecha) => {
    const nuevoGasto = { categoria, monto, descripcion, fecha };
    const actualizados = [...gastos, nuevoGasto].reverse();
    setGastos(actualizados.reverse());
    guardarEnStorage("gastos", actualizados.reverse());
  };

  const eliminarGasto = (indexRevertido) => {
    const confirmado = window.confirm(
      "¿Estás seguro de que querés eliminar este gasto?"
    );
    if (!confirmado) return;

    const indexOriginal = gastos.length - 1 - indexRevertido;
    const nuevos = [...gastos];
    nuevos.splice(indexOriginal, 1);
    setGastos([...nuevos].reverse());
    guardarEnStorage("gastos", nuevos);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Historial de gastos
      </h2>

      <GastoForm categorias={categorias} onAgregarGasto={agregarGasto} />

      <FiltroMes items={gastos} onFiltrar={setGastosFiltrados} />

      {gastosFiltrados.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          No hay gastos para este mes.
        </p>
      ) : (
        <ul className="space-y-3">
          {gastosFiltrados.map((gasto, i) => (
            <li
              key={i}
              className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-semibold">
                  {gasto.descripcion || "Gasto"}
                </p>
                <p className="text-sm text-gray-500">
                  {gasto.categoria} – {dayjs(gasto.fecha).format("DD/MM/YYYY")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xl font-bold text-red-500">
                  - ${formatearMoneda(gasto.monto)}
                </p>
                <button
                  onClick={() => eliminarGasto(i)}
                  className="text-sm px-2 py-1 rounded bg-white text-red-600 hover:bg-gray-200 border"
                  title="Eliminar gasto"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
