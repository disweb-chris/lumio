import { useState, useEffect } from "react";
import IngresoForm from "../components/IngresoForm";
import { guardarEnStorage, obtenerDeStorage } from "../utils/storage";
import { formatearMoneda } from "../utils/format";
import dayjs from "dayjs";

export default function Ingresos() {
  const [ingresos, setIngresos] = useState(() =>
    obtenerDeStorage("ingresos", [])
  );

  useEffect(() => {
    guardarEnStorage("ingresos", ingresos);
  }, [ingresos]);

  const agregarIngreso = (nuevo) => {
    const actualizados = [...ingresos, nuevo];
    setIngresos(actualizados);
    guardarEnStorage("ingresos", actualizados);
  };

  const toggleRecibido = (index) => {
    const actualizados = [...ingresos];
    actualizados[index].recibido = !actualizados[index].recibido;
    setIngresos(actualizados);
    guardarEnStorage("ingresos", actualizados);
  };

  const eliminarIngreso = (index) => {
    const confirmado = window.confirm("¿Eliminar este ingreso?");
    if (!confirmado) return;

    const actualizados = [...ingresos];
    actualizados.splice(index, 1);
    setIngresos(actualizados);
    guardarEnStorage("ingresos", actualizados);
  };

  const totalEsperado = ingresos.reduce((acc, i) => acc + i.monto, 0);
  const totalRecibido = ingresos
    .filter((i) => i.recibido)
    .reduce((acc, i) => acc + i.monto, 0);
  const pendiente = totalEsperado - totalRecibido;

  return (
    <div>
      {/* RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Total esperado
          </p>
          <p className="text-2xl font-bold text-blue-400">
            ${formatearMoneda(totalEsperado)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Total recibido
          </p>
          <p className="text-2xl font-bold text-green-500">
            ${formatearMoneda(totalRecibido)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Pendiente de cobro
          </p>
          <p className="text-2xl font-bold text-yellow-400">
            ${formatearMoneda(pendiente)}
          </p>
        </div>
      </div>

      {/* FORMULARIO */}
      <IngresoForm onAgregarIngreso={agregarIngreso} />

      {/* LISTADO */}
      <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800 dark:text-white">
        Lista de ingresos
      </h3>
      <ul className="space-y-3">
        {ingresos.map((ingreso, i) => (
          <li
            key={i}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="text-lg font-semibold">{ingreso.descripcion}</p>
              <p className="text-sm text-gray-500">
                {dayjs(ingreso.fecha).format("YYYY-MM-DD")}
              </p>
              <p className="text-sm">
                Monto: ${formatearMoneda(ingreso.monto)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                onClick={() => toggleRecibido(i)}
                className={`text-sm px-3 py-1 rounded font-semibold ${
                  ingreso.recibido
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {ingreso.recibido ? "Recibido" : "Marcar recibido"}
              </button>
              <button
                onClick={() => eliminarIngreso(i)}
                className="text-sm px-2 py-1 rounded bg-white text-red-600 hover:bg-gray-200 border"
                title="Eliminar ingreso"
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
