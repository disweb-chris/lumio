import { useState, useEffect } from "react";
import VencimientoForm from "../components/VencimientoForm";
import { guardarEnStorage, obtenerDeStorage } from "../utils/storage";
import { formatearMoneda } from "../utils/format";
import AlertaVencimiento from "../components/AlertaVencimiento";

export default function Vencimientos() {
  const [vencimientos, setVencimientos] = useState(() =>
    obtenerDeStorage("vencimientos", [])
  );

  const [gastos, setGastos] = useState(() => obtenerDeStorage("gastos", []));

  const agregarVencimiento = (nuevo) => {
    const actualizados = [...vencimientos, nuevo];
    setVencimientos(actualizados);
    guardarEnStorage("vencimientos", actualizados);
  };

  const togglePagado = (index) => {
    const actualizado = [...vencimientos];
    const vencimiento = actualizado[index];
    vencimiento.pagado = !vencimiento.pagado;
    setVencimientos(actualizado);
    guardarEnStorage("vencimientos", actualizado);

    const gastosGuardados = [...gastos];

    const gastoRelacionado = {
      categoria: "Vencimientos",
      descripcion: `Pago de ${vencimiento.descripcion}`,
      monto: vencimiento.monto,
    };

    if (vencimiento.pagado) {
      // Solo agregar si no existe un gasto igual (por descripción + monto)
      const yaExiste = gastosGuardados.some(
        (g) =>
          g.descripcion === gastoRelacionado.descripcion &&
          g.monto === gastoRelacionado.monto
      );

      if (!yaExiste) {
        const nuevoGasto = {
          ...gastoRelacionado,
          fecha: new Date().toISOString(),
        };
        const nuevosGastos = [...gastosGuardados, nuevoGasto];
        setGastos(nuevosGastos);
        guardarEnStorage("gastos", nuevosGastos);
      }
    } else {
      // Si se desmarca como pagado, eliminar gasto relacionado
      const filtrados = gastosGuardados.filter(
        (g) =>
          !(
            g.descripcion === gastoRelacionado.descripcion &&
            g.monto === gastoRelacionado.monto
          )
      );
      setGastos(filtrados);
      guardarEnStorage("gastos", filtrados);
    }
  };

  const eliminarVencimiento = (index) => {
    const confirmado = window.confirm("¿Eliminar este vencimiento?");
    if (!confirmado) return;

    const actualizado = [...vencimientos];
    const vencimiento = actualizado[index];
    actualizado.splice(index, 1);
    setVencimientos(actualizado);
    guardarEnStorage("vencimientos", actualizado);

    // Si estaba marcado como pagado, también eliminamos el gasto generado
    if (vencimiento.pagado) {
      const nuevosGastos = gastos.filter(
        (g) =>
          !(
            g.descripcion === `Pago de ${vencimiento.descripcion}` &&
            g.monto === vencimiento.monto
          )
      );
      setGastos(nuevosGastos);
      guardarEnStorage("gastos", nuevosGastos);
    }
  };

  return (
    <div>
      <VencimientoForm onAgregar={agregarVencimiento} />

      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Pagos con vencimiento
      </h3>

      <ul className="space-y-2">
        {vencimientos.map((item, i) => (
          <li
            key={i}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="text-lg">{item.descripcion}</p>
              <p className="text-sm text-gray-500">Fecha: {item.fecha}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Monto: ${formatearMoneda(item.monto)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <AlertaVencimiento fecha={item.fecha} pagado={item.pagado} />
              <button
                onClick={() => togglePagado(i)}
                className="text-sm px-3 py-1 rounded bg-blue-600 text-white"
              >
                {item.pagado ? "Desmarcar" : "Marcar pagado"}
              </button>
              <button
                onClick={() => eliminarVencimiento(i)}
                className="text-sm px-2 py-1 rounded bg-white text-red-600 hover:bg-gray-200 border "
                title="Eliminar vencimiento"
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
