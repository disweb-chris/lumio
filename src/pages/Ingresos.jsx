import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatearMoneda } from "../utils/format";
import IngresoForm from "../components/IngresoForm";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import dayjs from "dayjs";

export default function Ingresos() {
  const [ingresos, setIngresos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);

  /* filtro + estado de carga */
  const [filtro, setFiltro] = useState("todos"); // todos | pendientes | recibidos
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "ingresos"), orderBy("fecha1", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setIngresos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCargando(false);
    });

    obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));
    return () => unsub();
  }, []);

  /* helpers */
  const mostrarARSyUSD = (monto, moneda = "ARS") => {
    const num = parseFloat(monto || 0);
    if (isNaN(num)) return "—";
    if (moneda === "USD") {
      const ars = cotizacionUSD > 0 ? num * cotizacionUSD : 0;
      return `u$d ${num.toFixed(2)} / $${formatearMoneda(ars)} ARS`;
    }
    const usd = cotizacionUSD > 0 ? num / cotizacionUSD : 0;
    return `$${formatearMoneda(num)} ARS / u$d ${usd.toFixed(2)}`;
  };

  /* altas */
  const agregarIngreso = async (nuevo) => {
    await addDoc(collection(db, "ingresos"), {
      ...nuevo,
      fecha1: Timestamp.fromDate(new Date(nuevo.fecha1)),
      fecha2: nuevo.fecha2 ? Timestamp.fromDate(new Date(nuevo.fecha2)) : null,
    });
  };

  /* registrar pagos */
  const togglePago = async (ingreso, parte) => {
    const cotiz = await obtenerCotizacionUSD();
    const getEnARS = (m, mon) => (mon === "USD" ? m * cotiz : m);

    const nuevo = { ...ingreso };

    if (parte === 1 && !ingreso.recibido1) {
      nuevo.recibido1 = true;
      nuevo.montoRecibido =
        (nuevo.montoRecibido || 0) +
        getEnARS(ingreso.monto1 ?? ingreso.montoTotal, ingreso.moneda);
    }

    if (parte === 2 && !ingreso.recibido2) {
      nuevo.recibido2 = true;
      nuevo.montoRecibido =
        (nuevo.montoRecibido || 0) +
        getEnARS(ingreso.monto2 ?? ingreso.montoTotal / 2, ingreso.moneda);
    }

    if (!ingreso.dividido && parte === 1 && !ingreso.recibido1) {
      nuevo.recibido1 = true;
      nuevo.montoRecibido = getEnARS(ingreso.montoTotal, ingreso.moneda);
    }

    await updateDoc(doc(db, "ingresos", ingreso.id), nuevo);
  };

  const eliminarIngreso = async (id) => {
    if (window.confirm("¿Eliminar este ingreso?"))
      await deleteDoc(doc(db, "ingresos", id));
  };

  /* totales globales (no dependen del filtro) */
  const totalEsperado = ingresos.reduce((acc, i) => {
    const m = i.montoTotal || 0;
    return acc + (i.moneda === "USD" ? m * cotizacionUSD : m);
  }, 0);
  const totalRecibido = ingresos.reduce(
    (acc, i) => acc + (i.montoRecibido || 0),
    0
  );
  const pendiente = totalEsperado - totalRecibido;

  /* FILTRADO v3 – pendiente vs recibido por comparación de montos */
  const ingresosFiltrados = ingresos.filter((i) => {
    const totalARS =
      i.moneda === "USD" ? i.montoTotal * cotizacionUSD : i.montoTotal;
    const recibidoARS = i.montoRecibido || 0;

    const estaRecibido = recibidoARS >= totalARS;

    if (filtro === "pendientes") return !estaRecibido;
    if (filtro === "recibidos") return estaRecibido;
    return true; // todos
  });

  /* UI */
  return (
    <div>
      {/* Totales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { t: "Total esperado", v: totalEsperado, c: "text-blue-400" },
          { t: "Total recibido", v: totalRecibido, c: "text-green-500" },
          { t: "Pendiente de cobro", v: pendiente, c: "text-yellow-400" },
        ].map((box, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center"
          >
            <p className="text-sm text-gray-500 dark:text-gray-300">{box.t}</p>
            <p className={`text-lg font-bold ${box.c}`}>
              {mostrarARSyUSD(box.v, "ARS")}
            </p>
          </div>
        ))}
      </div>

      {/* Formulario alta */}
      <IngresoForm
        onAgregarIngreso={agregarIngreso}
        cotizacionUSD={cotizacionUSD}
      />

      {/* Selector filtro */}
      <div className="flex gap-4 mt-4 mb-2">
        {["todos", "pendientes", "recibidos"].map((opt) => (
          <label key={opt} className="text-sm flex items-center gap-1">
            <input
              type="radio"
              value={opt}
              checked={filtro === opt}
              onChange={(e) => setFiltro(e.target.value)}
            />
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </label>
        ))}
      </div>

      {cargando ? (
        <p className="text-center text-gray-500">Cargando…</p>
      ) : (
        <>
          <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-white">
            Lista de ingresos
          </h3>

          <ul className="space-y-3">
            {ingresosFiltrados.map((ingreso) => (
              <li
                key={ingreso.id}
                className="p-4 bg-white dark:bg-gray-800 rounded shadow"
              >
                <div className="flex justify-between flex-wrap">
                  {/* --- Info izquierda --- */}
                  <div>
                    <p className="text-lg font-semibold">
                      {ingreso.descripcion}
                    </p>

                    <p className="text-sm text-gray-500">
                      Monto total:{" "}
                      {mostrarARSyUSD(ingreso.montoTotal, ingreso.moneda)}
                    </p>

                    <p className="text-sm text-gray-500">
                      Recibido:{" "}
                      {mostrarARSyUSD(ingreso.montoRecibido || 0, "ARS")}
                    </p>

                    {ingreso.dividido && (
                      <>
                        <p className="text-sm text-gray-400 mt-2">
                          <strong>1º pago:</strong>{" "}
                          {mostrarARSyUSD(
                            ingreso.monto1 || ingreso.montoTotal / 2,
                            ingreso.moneda
                          )}{" "}
                          – {dayjs(ingreso.fecha1.toDate()).format("DD/MM/YYYY")}{" "}
                          – {ingreso.recibido1 ? "✅" : "❌"}
                        </p>
                        <p className="text-sm text-gray-400">
                          <strong>2º pago:</strong>{" "}
                          {mostrarARSyUSD(
                            ingreso.monto2 || ingreso.montoTotal / 2,
                            ingreso.moneda
                          )}{" "}
                          –{" "}
                          {ingreso.fecha2
                            ? dayjs(ingreso.fecha2.toDate()).format(
                                "DD/MM/YYYY"
                              )
                            : "Sin fecha"}{" "}
                          – {ingreso.recibido2 ? "✅" : "❌"}
                        </p>
                      </>
                    )}
                  </div>

                  {/* --- Acciones derecha --- */}
                  <div className="flex flex-col gap-2 items-end mt-4 sm:mt-0">
                    {!ingreso.recibido1 && (
                      <button
                        onClick={() => togglePago(ingreso, 1)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Registrar 1° pago
                      </button>
                    )}
                    {ingreso.dividido && !ingreso.recibido2 && (
                      <button
                        onClick={() => togglePago(ingreso, 2)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Registrar 2° pago
                      </button>
                    )}
                    <button
                      onClick={() => eliminarIngreso(ingreso.id)}
                      className="text-red-600 border border-red-600 px-3 py-1 rounded text-sm hover:bg-red-50"
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
