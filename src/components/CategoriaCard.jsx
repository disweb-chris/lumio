import { formatearMoneda } from "../utils/format";

export default function CategoriaCard({ nombre, presupuesto, gastado }) {
  const saldo = presupuesto - gastado;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 w-full sm:w-64">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{nombre}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Presupuesto: ${formatearMoneda(presupuesto)}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Gastado: ${formatearMoneda(gastado)}
      </p>
      <p className={`mt-2 font-bold ${saldo < 0 ? 'text-red-500' : 'text-green-400'}`}>
        Saldo: ${formatearMoneda(saldo)}
      </p>
    </div>
  );
}
