// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import CategoriaCard from "../components/CategoriaCard";
import { formatearMoneda } from "../utils/format";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import CotizacionDolarModal from "../components/CotizacionDolarModal";
import FiltroMes from "../components/FiltroMes";
import dayjs from "dayjs";

export default function Dashboard() {
  const { user } = useAuth();
  const uid = user.uid;

  const [categorias, setCategorias] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [vencimientos, setVencimientos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);
  const hoy = dayjs();
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.format("YYYY-MM"));
  const [loaded, setLoaded] = useState({ cat: false, gas: false, ing: false, ven: false });

  // Últimos movimientos
  const ultimosMov = useMemo(() => {
    const valorARS = item => item.montoARS ?? item.montoARSConvertido ?? 0;
    const valorUSD = item => {
      if (item.montoUSD != null) return item.montoUSD;
      if (item.montoARSConvertido != null && item.cotizacionAlMomento) {
        return +(item.montoARSConvertido / item.cotizacionAlMomento).toFixed(2);
      }
      return +(valorARS(item) / cotizacionUSD).toFixed(2);
    };
    const movs = [];
    gastos.forEach(g => movs.push({ tipo: "Gasto", desc: g.descripcion, fecha: g.fecha?.toDate ? g.fecha.toDate() : g.fecha, montoARS: valorARS(g), montoUSD: valorUSD(g) }));
    ingresos.forEach(i => {
      const arsRec = i.montoRecibido || 0;
      const usdRec = i.cotizacionAlMomento ? +(arsRec / i.cotizacionAlMomento).toFixed(2) : +(arsRec / cotizacionUSD).toFixed(2);
      movs.push({ tipo: "Ingreso", desc: i.descripcion, fecha: i.fecha1?.toDate ? i.fecha1.toDate() : i.fecha1, montoARS: arsRec, montoUSD: usdRec });
    });
    vencimientos.forEach(v => movs.push({ tipo: "Vencimiento", desc: v.descripcion, fecha: v.fecha?.toDate ? v.fecha.toDate() : v.fecha, montoARS: valorARS(v), montoUSD: valorUSD(v) }));
    return movs.sort((a, b) => b.fecha - a.fecha).slice(0, 5);
  }, [gastos, ingresos, vencimientos, cotizacionUSD]);

  // Conexiones Firestore
  useEffect(() => {
    const unsubCat = onSnapshot(query(collection(db, "categorias"), where("uid", "==", uid)), snap => { setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoaded(p => ({ ...p, cat: true })); });
    const unsubGas = onSnapshot(query(collection(db, "gastos"), where("uid", "==", uid)), snap => { setGastos(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoaded(p => ({ ...p, gas: true })); });
    const unsubIng = onSnapshot(query(collection(db, "ingresos"), where("uid", "==", uid)), snap => { setIngresos(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoaded(p => ({ ...p, ing: true })); });
    const unsubVen = onSnapshot(query(collection(db, "vencimientos"), where("uid", "==", uid)), snap => { setVencimientos(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoaded(p => ({ ...p, ven: true })); });
    obtenerCotizacionUSD().then(v => v && setCotizacionUSD(v));
    return () => { unsubCat(); unsubGas(); unsubIng(); unsubVen(); };
  }, [uid]);

  if (!loaded.cat || !loaded.gas || !loaded.ing || !loaded.ven) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Cargando datos…</div>;
  }

  // Filtrar por mes
  const filtraPorMes = (arr, campo = "fecha") => arr.filter(d => dayjs(d[campo]?.toDate ? d[campo].toDate() : d[campo]).format("YYYY-MM") === mesSeleccionado);
  const gastosFiltrados = filtraPorMes(gastos);
  const ingresosFiltrados = filtraPorMes(ingresos, "fecha1");
  const vencimientosFiltrados = filtraPorMes(vencimientos);

  // Cálculos auxiliares
  const sumar = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  const esTarjeta = g => g.metodoPago?.toLowerCase().includes("tarjeta");
  const valorARS = item => item.montoARS ?? item.montoARSConvertido ?? 0;
  const valorUSD = item => item.montoUSD ?? (item.montoARSConvertido && item.cotizacionAlMomento ? +(item.montoARSConvertido / item.cotizacionAlMomento).toFixed(2) : +(valorARS(item) / cotizacionUSD).toFixed(2));

  const totalIngresosARS = sumar(ingresosFiltrados, i => i.montoRecibido || 0);
  const totalGastosNoTarjARS = sumar(gastosFiltrados.filter(g => !esTarjeta(g)), valorARS);
  const totalTarjetaARS = sumar(gastosFiltrados.filter(esTarjeta), valorARS);
  const totalIngresosUSD = sumar(ingresosFiltrados, i => (i.montoRecibido || 0) / (i.cotizacionAlMomento || cotizacionUSD));
  const totalGastosNoTarjUSD = sumar(gastosFiltrados.filter(g => !esTarjeta(g)), valorUSD);
  const totalTarjetaUSD = sumar(gastosFiltrados.filter(esTarjeta), valorUSD);

  const dineroDispARS = totalIngresosARS - totalGastosNoTarjARS;
  const dineroDispUSD = totalIngresosUSD - totalGastosNoTarjUSD;

  const ingresosPend = ingresosFiltrados.filter(i => (i.montoRecibido || 0) < ((i.moneda === 'USD' ? i.montoUSD * i.cotizacionAlMomento : i.montoARS ) || 0));
  const totalPendARS = sumar(ingresosPend, i => ((i.moneda==='USD'?i.montoUSD * i.cotizacionAlMomento:i.montoARS) - (i.montoRecibido||0)));
  const totalPendUSD = sumar(ingresosPend, i => ((i.montoRecibido||0)/(i.cotizacionAlMomento||cotizacionUSD)));

  const venPend = vencimientosFiltrados.filter(v => !v.pagado);
  const totalVenARS = sumar(venPend, valorARS);
  const totalVenUSD = sumar(venPend, valorUSD);
  const proximos = venPend.filter(v => { const diff = dayjs(v.fecha?.toDate? v.fecha.toDate():v.fecha).diff(hoy, 'day'); return diff>=0 && diff<=3 });

  return (
    <div>
      <FiltroMes items={gastos} onMesChange={setMesSeleccionado} onFiltrar={() => {}} />
      {proximos.length>0 && <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">⚠️ Tienes {proximos.length} pago(s) por vencer.</div>}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center mb-6">
        <p className="text-gray-500 text-sm">Dinero disponible</p>
        <p className={`text-3xl font-bold ${dineroDispARS<0?'text-red-500':'text-green-500'}`}>{formatearMoneda(dineroDispARS)} ARS / u$d {dineroDispUSD.toFixed(2)}</p>
        <div className="text-sm text-purple-700 mt-2">💳 {formatearMoneda(totalTarjetaARS)} ARS / u$d {totalTarjetaUSD.toFixed(2)}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Ingresos pendientes</p>
          <p className="text-xl font-bold text-yellow-400">{formatearMoneda(totalPendARS)} ARS / u$d {totalPendUSD.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{ingresosPend.length} ingreso(s)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Vencimientos pendientes</p>
          <p className="text-xl font-bold text-red-500">{formatearMoneda(totalVenARS)} ARS / u$d {totalVenUSD.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{venPend.length} vencimiento(s)</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mt-6">
        {categorias.map(cat => (
          <CategoriaCard
            key={cat.id}
            nombre={cat.nombre}
            presupuesto={cat.presupuestoARS}
            gastado={sumar(gastosFiltrados.filter(g=>g.categoria===cat.nombre), valorARS)}
          />
        ))}
      </div>

      {/* Últimos movimientos */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Últimos movimientos</h3>
        <ul className="space-y-2">
          {ultimosMov.map((m,i)=>{
            let badgeClass="bg-gray-200 text-gray-800";
            if(m.tipo==="Gasto") badgeClass="bg-red-500 text-white";
            if(m.tipo==="Ingreso") badgeClass="bg-green-500 text-white";
            if(m.tipo==="Vencimiento") badgeClass="bg-yellow-400 text-black";
            return (
              <li key={i} className="flex justify-between bg-white dark:bg-gray-800 p-3 rounded shadow">
                <div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-2 ${badgeClass}`}>{m.tipo}</span>
                  {m.desc}
                </div>
                <div className="text-right">
                  <div>{dayjs(m.fecha).format("DD/MM/YYYY")}</div>
                  <div className="text-sm text-gray-500">{formatearMoneda(m.montoARS)} ARS / u$d {m.montoUSD.toFixed(2)}</div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <CotizacionDolarModal />
    </div>
  );
}
