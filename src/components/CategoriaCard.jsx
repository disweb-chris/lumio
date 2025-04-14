import { formatearMoneda } from "../utils/format";

export default function CategoriaCard({ nombre, presupuesto = 0, gastado = 0 }) {
  const saldo = presupuesto - gastado;
  const negativo = saldo < 0;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 w-full sm:w-64 transition ${
        negativo ? "border border-red-500 bg-red-50 dark:bg-red-900/20" : ""
      }`}
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        {nombre}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Presupuesto: ${formatearMoneda(presupuesto)}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Gastado: ${formatearMoneda(gastado)}
      </p>
      <p
        className={`mt-2 font-bold ${
          negativo ? "text-red-600" : "text-green-500"
        }`}
      >
        Saldo: ${formatearMoneda(saldo)}
      </p>
    </div>
  );
}
