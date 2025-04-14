import { useEffect, useState } from "react";
import {
  obtenerCotizacionUSD,
  actualizarCotizacionUSD,
} from "../utils/configuracion";

export default function CotizacionDolar() {
  const [cotizacion, setCotizacion] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerCotizacionUSD().then((valor) => {
      if (valor) setCotizacion(valor);
    });
  }, []);

  const handleGuardar = async () => {
    const valorNum = parseFloat(cotizacion);
    if (isNaN(valorNum) || valorNum <= 0) {
      alert("Ingrese una cotización válida.");
      return;
    }

    setGuardando(true);
    await actualizarCotizacionUSD(valorNum);
    setGuardando(false);
    alert("✅ Cotización actualizada correctamente");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mt-6">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
        Cotización del dólar
      </h3>
      <div className="flex items-center gap-4">
        <input
          type="number"
          value={cotizacion}
          onChange={(e) => setCotizacion(e.target.value)}
          className="border rounded px-3 py-1 dark:bg-gray-700 dark:text-white"
          placeholder="Cotización USD"
        />
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
