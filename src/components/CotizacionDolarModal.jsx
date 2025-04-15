import { useState, useEffect } from "react";
import {
  obtenerCotizacionUSD,
  actualizarCotizacionUSD,
} from "../utils/configuracion";

export default function CotizacionDolarModal() {
  const [cotizacion, setCotizacion] = useState("");
  const [mostrar, setMostrar] = useState(false);
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
    setMostrar(false);
    alert("✅ Cotización actualizada correctamente");
  };

  return (
    <>
      <button
        onClick={() => setMostrar(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 z-50"
      >
        Cotización
      </button>

      {mostrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Editar cotización del dólar
            </h2>
            <input
              type="number"
              value={cotizacion}
              onChange={(e) => setCotizacion(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: 850"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMostrar(false)}
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-black dark:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
