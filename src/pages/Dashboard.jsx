import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import CategoriaCard from "../components/CategoriaCard";
import { formatearMoneda } from "../utils/format";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import CotizacionDolarModal from "../components/CotizacionDolarModal";
import FiltroMes from "../components/FiltroMes";
import dayjs from "dayjs";

export default function Dashboard() {
  /* ───────── estados ───────── */
  const [categorias, setCategorias] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [vencimientos, setVencimientos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);

  /* filtro mes/año */
  const hoy = dayjs();
  const [mesSeleccionado, setMesSeleccionado] = useState(
    hoy.format("YYYY-MM")
  );

  /* loading flags para mostrar spinner */
  const [loaded, setLoaded] = useState({
    cat: false,
    gas: false,
    ing: false,
    ven: false,
  });

  /* ───────── listeners Firestore ───────── */
  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, "categorias"), (s) => {
      setCategorias(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoaded((prev) => ({ ...prev, cat: true }));
    });

    const unsubGas = onSnapshot(collection(db, "gastos"), (s) => {
      setGastos(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoaded((prev) => ({ ...prev, gas: true }));
    });

    const unsubIng = onSnapshot(collection(db, "ingresos"), (s) => {
      setIngresos(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoaded((prev) => ({ ...prev, ing: true }));
    });

    const unsubVen = onSnapshot(collection(db, "vencimientos"), (s) => {
      setVencimientos(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoaded((prev) => ({ ...prev, ven: true }));
    });

    obtenerCotizacionUSD().then((v) => v && setCotizacionUSD(v));

    return () => {
      unsubCat();
      unsubGas();
      unsubIng();
      unsubVen();
    };
  }, []);

  /* helper spinner */
  const cargando =
    !loaded.cat || !loaded.gas || !loaded.ing || !loaded.ven || !cotizacionUSD;

  /* ───────── aplicar filtro mes ───────── */
  const filtraPorMes = (docs, campo = "fecha") =>
    docs.filter((d) => {
      const fecha = dayjs(
        d[campo]?.toDate ? d[campo].toDate() : d[campo]
      ).format("YYYY-MM");
      return fecha === mesSeleccionado;
    });

  const gastosFiltrados = filtraPorMes(gastos);
  const ingresosFiltrados = filtraPorMes(ingresos, "fecha1");
  const vencimientosFiltrados = filtraPorMes(vencimientos);

  /* ───────── cálculos (idénticos pero con arrays filtrados) ───────── */

  const totalIngresos = ingresosFiltrados
    .filter((i) => i.montoRecibido || i.recibido1 || i.recibido2)
    .reduce((acc, i) => acc + (i.montoRecibido || 0), 0);

  const totalGastosNoTarj = gastosFiltrados.reduce((acc, g) => {
    const esTarjeta = g.metodoPago?.toLowerCase().includes("tarjeta");
    return esTarjeta ? acc : acc + g.monto;
  }, 0);

  const totalTarjeta = gastosFiltrados.reduce((acc, g) => {
    const esTarjeta = g.metodoPago?.toLowerCase().includes("tarjeta");
    return esTarjeta ? acc + g.monto : acc;
  }, 0);

  const dineroDisponible = totalIngresos - totalGastosNoTarj;

  /* pendientes */
  const ingresosPendientes = ingresosFiltrados.filter(
    (i) => (i.montoRecibido || 0) < (i.montoTotal || 0) * (i.moneda === "USD" ? cotizacionUSD : 1)
  );
  const totalPendiente = ingresosPendientes.reduce(
    (acc, i) => acc + ((i.montoTotal || 0) * (i.moneda === "USD" ? cotizacionUSD : 1) - (i.montoRecibido || 0)),
    0
  );

  const vencPendientes = vencimientosFiltrados.filter((v) => !v.pagado);
  const totalVencPendientes = vencPendientes.reduce(
    (acc, v) => acc + v.monto,
    0
  );

  /* vencimientos por vencer en ≤ 3 días */
  const proximosVencimientos = vencPendientes.filter((v) => {
    const diff = dayjs(
      v.fecha?.toDate ? v.fecha.toDate() : v.fecha
    ).diff(dayjs(), "day");
    return diff >= 0 && diff <= 3;
  });

  /* gastos por categoría (para tarjetas de categorías) */
  const gastosPorCategoria = gastosFiltrados.reduce((acc, g) => {
    const key = g.categoria;
    if (!acc[key]) acc[key] = 0;
    acc[key] += g.monto;
    return acc;
  }, {});

  /* mapping tarjeta → icono */
  const tarjetaIcon = {
    "Naranja X": "🟠",
    "Visa Santander": "🔵",
    "Amex Santander": "🟣",
    "Ualá Emma": "🟡",
    "Ualá Chris": "🟢",
  };

  /* helper currency */
  const mostrarARSyUSD = (m) =>
    `${formatearMoneda(m)} ARS / u$d ${(m / cotizacionUSD).toFixed(2)}`;

  /* ───────── render ───────── */
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Cargando datos…
      </div>
    );
  }

  return (
    <div>
      {/* selector mes */}
      <FiltroMes
        items={gastos}
        onMesChange={setMesSeleccionado}
        onFiltrar={() => {}}
      />

      {/* alerta vencimiento */}
      {proximosVencimientos.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
          ⚠️ Tienes {proximosVencimientos.length} pago(s) por vencer en los
          próximos días.
        </div>
      )}

      {/* dinero disponible */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center mb-6">
        <p className="text-gray-500 dark:text-gray-300 text-sm">
          Dinero disponible
        </p>
        <p
          className={`text-3xl font-bold ${
            dineroDisponible < 0 ? "text-red-500" : "text-green-500"
          }`}
        >
          {mostrarARSyUSD(dineroDisponible)}
        </p>
        <div className="text-sm text-purple-700 dark:text-purple-300 mt-2 flex items-center justify-center gap-2">
          💳{" "}
          <span className="font-medium">{mostrarARSyUSD(totalTarjeta)}</span>
        </div>
      </div>

      {/* indicadores pendientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Ingresos pendientes
          </p>
          <p className="text-xl font-bold text-yellow-400">
            {mostrarARSyUSD(totalPendiente)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {ingresosPendientes.length} ingreso(s)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Vencimientos pendientes
          </p>
          <p className="text-xl font-bold text-red-500">
            {mostrarARSyUSD(totalVencPendientes)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {vencPendientes.length} vencimiento(s)
          </p>
        </div>
      </div>

      {/* tarjetas de categorías */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mt-6">
        {categorias.map((cat) => (
          <CategoriaCard
            key={cat.id}
            nombre={
              tarjetaIcon[cat.nombre]
                ? `${tarjetaIcon[cat.nombre]} ${cat.nombre}`
                : cat.nombre
            }
            presupuesto={cat.presupuesto}
            gastado={gastosPorCategoria[cat.nombre] || 0}
          />
        ))}
      </div>

      {/* botón/modal cotización */}
      <CotizacionDolarModal />
    </div>
  );
}
