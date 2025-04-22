// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import CategoriaCard from "../components/CategoriaCard";
import { formatearMoneda } from "../utils/format";
import { obtenerCotizacionUSD } from "../utils/configuracion";
import CotizacionDolarModal from "../components/CotizacionDolarModal";
import FiltroMes from "../components/FiltroMes";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const uid = user.uid;

  // Theme toggle
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Estados
  const [categorias, setCategorias] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [vencimientos, setVencimientos] = useState([]);
  const [cotizacionUSD, setCotizacionUSD] = useState(1);
  const [mesSeleccionado, setMesSeleccionado] = useState(dayjs().format("YYYY-MM"));
  const [loaded, setLoaded] = useState({ cat: false, gas: false, ing: false, ven: false });
  const loadedAll = Object.values(loaded).every(v => v);

  // Bootstrap presupuestos
  useEffect(() => {
    if (!uid) return;
    const mes = dayjs().format("YYYY-MM");
    getDocs(query(collection(db, "presupuestos"), where("uid", "==", uid), where("mes", "==", mes)))
      .then(snap => {
        if (snap.empty) {
          getDocs(query(collection(db, "categorias"), where("uid", "==", uid))).then(cats => {
            cats.forEach(docCat => {
              const data = docCat.data();
              addDoc(collection(db, "presupuestos"), {
                uid,
                categoriaId: docCat.id,
                nombre: data.nombre,
                mes,
                presupuestoARS: data.presupuestoARS,
                presupuestoUSD: data.presupuestoUSD,
                cotizacionAlMomento: data.cotizacionAlMomento,
              });
            });
          });
        }
      });
  }, [uid]);

  // Mantener mes actual
  useEffect(() => {
    setMesSeleccionado(dayjs().format("YYYY-MM"));
    const id = setInterval(() => setMesSeleccionado(dayjs().format("YYYY-MM")), 60000);
    return () => clearInterval(id);
  }, []);

  // Suscripciones
  useEffect(() => {
    if (!uid) return;
    const unsubC = onSnapshot(query(collection(db, "categorias"), where("uid", "==", uid)), snap => {
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoaded(p => ({ ...p, cat: true }));
    });
    const unsubG = onSnapshot(query(collection(db, "gastos"), where("uid", "==", uid)), snap => {
      setGastos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoaded(p => ({ ...p, gas: true }));
    });
    const unsubI = onSnapshot(query(collection(db, "ingresos"), where("uid", "==", uid)), snap => {
      setIngresos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoaded(p => ({ ...p, ing: true }));
    });
    const unsubV = onSnapshot(query(collection(db, "vencimientos"), where("uid", "==", uid)), snap => {
      setVencimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoaded(p => ({ ...p, ven: true }));
    });
    obtenerCotizacionUSD().then(v => v && setCotizacionUSD(v));
    return () => { unsubC(); unsubG(); unsubI(); unsubV(); };
  }, [uid]);

  // Últimos movimientos
  const ultimosMov = useMemo(() => {
    const valARS = it => it.montoARS ?? it.montoARSConvertido ?? 0;
    const valUSD = it => {
      if (it.montoUSD != null) return it.montoUSD;
      if (it.montoARSConvertido != null && it.cotizacionAlMomento) return +(it.montoARSConvertido / it.cotizacionAlMomento).toFixed(2);
      return +(valARS(it) / cotizacionUSD).toFixed(2);
    };
    let arr = [];
    gastos.forEach(g => arr.push({ tipo: 'Gasto', desc: g.descripcion, fecha: g.fecha?.toDate ? g.fecha.toDate() : g.fecha, montoARS: valARS(g), montoUSD: valUSD(g) }));
    ingresos.forEach(i => arr.push({ tipo: 'Ingreso', desc: i.descripcion, fecha: i.fecha1?.toDate ? i.fecha1.toDate() : i.fecha1, montoARS: i.montoRecibido || 0, montoUSD: +((i.montoRecibido||0)/(i.cotizacionAlMomento||cotizacionUSD)).toFixed(2) }));
    vencimientos.forEach(v => arr.push({ tipo: 'Vencimiento', desc: v.descripcion, fecha: v.fecha?.toDate ? v.fecha.toDate() : v.fecha, montoARS: valARS(v), montoUSD: valUSD(v) }));
    return arr.sort((a,b)=>b.fecha - a.fecha).slice(0,5);
  }, [gastos, ingresos, vencimientos, cotizacionUSD]);

  // Spinner
  if (!loadedAll) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );

  // Filtrar mes
  const filtra = (arr, campo='fecha') => arr.filter(x => dayjs(x[campo]?.toDate ? x[campo].toDate() : x[campo]).format('YYYY-MM') === mesSeleccionado);
  const gastosFiltrados = filtra(gastos);
  const ingresosFiltrados = filtra(ingresos,'fecha1');
  const vencimientosFiltrados = filtra(vencimientos);

  // Cálculos
  const sumArr = (arr, fn) => arr.reduce((s,x) => s + fn(x), 0);
  const totalIngresosARS = sumArr(ingresosFiltrados, i => i.montoRecibido || 0);
  const totalGastosNoTarjARS = sumArr(gastosFiltrados.filter(g => !g.metodoPago.toLowerCase().includes('tarjeta')), g => g.montoARS ?? g.montoARSConvertido ?? 0);
  const totalTarjetaARS = sumArr(gastosFiltrados.filter(g => g.metodoPago.toLowerCase().includes('tarjeta')), g => g.montoARS ?? g.montoARSConvertido ?? 0);
  const totalIngresosUSD = sumArr(ingresosFiltrados, i => (i.montoRecibido || 0) / (i.cotizacionAlMomento || cotizacionUSD));
  const totalGastosNoTarjUSD = sumArr(gastosFiltrados.filter(g => !g.metodoPago.toLowerCase().includes('tarjeta')), x => (x.montoUSD != null ? x.montoUSD : (x.montoARSConvertido ?? 0) / (x.cotizacionAlMomento || cotizacionUSD)));
  const totalTarjetaUSD = sumArr(gastosFiltrados.filter(g => g.metodoPago.toLowerCase().includes('tarjeta')), x => (x.montoUSD != null ? x.montoUSD : (x.montoARSConvertido ?? 0) / (x.cotizacionAlMomento || cotizacionUSD)));
  const dineroDispARS = totalIngresosARS - totalGastosNoTarjARS;
  const dineroDispUSD = totalIngresosUSD - totalGastosNoTarjUSD;

  const ingresosPend = ingresosFiltrados.filter(i => (i.montoRecibido || 0) < ((i.moneda==='USD'?i.montoUSD*i.cotizacionAlMomento:i.montoARS)||0));
  const totalPendARS = sumArr(ingresosPend, i => ((i.moneda==='USD'?i.montoUSD*i.cotizacionAlMomento:i.montoARS)-(i.montoRecibido||0)));
  const totalPendUSD = sumArr(ingresosPend, i => (i.montoRecibido||0)/(i.cotizacionAlMomento||cotizacionUSD));

  const venPend = vencimientosFiltrados.filter(v => !v.pagado);
  const totalVenARS = sumArr(venPend, v => v.montoARS ?? v.montoARSConvertido ?? 0);
  const totalVenUSD = sumArr(venPend, v => (v.montoUSD != null ? v.montoUSD : (v.montoARSConvertido ?? 0) / (v.cotizacionAlMomento || cotizacionUSD)));
  const proximos = venPend.filter(v => {
    const diff = dayjs(v.fecha?.toDate ? v.fecha.toDate() : v.fecha).diff(dayjs(), 'day');
    return diff>=0 && diff<=3;
  });

  return (
    <div className="p-4 relative">
      <button onClick={() => setTheme(theme==='dark'?'light':'dark')} className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 p-2 rounded-full shadow-lg">
        {theme==='dark'?'🌞':'🌙'}
      </button>

      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5}}>
        <FiltroMes items={gastos} onMesChange={setMesSeleccionado} onFiltrar={()=>{}} />

        {proximos.length>0 && (
          <motion.div layout className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
            ⚠️ Tienes {proximos.length} pago(s) por vencer.
          </motion.div>
        )}

        <motion.div layout className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center mb-6 hover:shadow-xl transition-shadow">
          <p className="text-gray-500 text-sm">Dinero disponible</p>
          <p className={`text-3xl font-bold ${dineroDispARS<0?'text-red-500':'text-green-500'}`}>{formatearMoneda(dineroDispARS)} ARS / u$d {dineroDispUSD.toFixed(2)}</p>
          <div className="text-sm text-purple-700 mt-2">💳 {formatearMoneda(totalTarjetaARS)} ARS / u$d {totalTarjetaUSD.toFixed(2)}</div>
        </motion.div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">Ingresos pendientes</p>
            <p className="text-xl font-bold text-yellow-400">{formatearMoneda(totalPendARS)} ARS / u$d {totalPendUSD.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{ingresosPend.length} ingreso(s)</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow text-center hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">Vencimientos pendientes</p>
            <p className="text-xl font-bold text-red-500">{formatearMoneda(totalVenARS)} ARS / u$d {totalVenUSD.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{venPend.length} vencimiento(s)</p>
          </div>
        </motion.div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {categorias.map(cat => {
            const gastado = gastosFiltrados
              .filter(g => g.categoria === cat.nombre)
              .reduce((sum, g) => sum + (g.montoARS ?? g.montoARSConvertido ?? 0), 0);
            const porcentaje = cat.presupuestoARS > 0 ? Math.min((gastado / cat.presupuestoARS) * 100, 100) : 0;
            return (
              <motion.div key={cat.id} whileHover={{scale:1.03}} transition={{type:'spring',stiffness:300}}>
                <div className="w-full sm:w-64">
                  <CategoriaCard nombre={cat.nombre} presupuesto={cat.presupuestoARS} gastado={gastado} />
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`${porcentaje>100?'bg-red-500':'bg-green-500'} h-full`} style={{width:`${porcentaje}%`}} title={`${porcentaje.toFixed(0)}% gastado`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Últimos movimientos</h3>
          <ul className="space-y-2">
            <AnimatePresence>
              {ultimosMov.map((m, i) => {
                let badgeClass = "bg-gray-200 text-gray-800";
                if (m.tipo === "Gasto") badgeClass = "bg-red-500 text-white";
                if (m.tipo === "Ingreso") badgeClass = "bg-green-500 text-white";
                if (m.tipo === "Vencimiento") badgeClass = "bg-yellow-400 text-black";
                return (
                  <motion.li
                    key={i}
                    initial={{opacity:0,y:10}}
                    animate={{opacity:1,y:0}}
                    exit={{opacity:0,y:-10}}
                    transition={{duration:0.3,delay:i*0.05}}
                    className="flex justify-between bg-white dark:bg-gray-800 p-3 rounded shadow hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    <div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-2 ${badgeClass}`}>{m.tipo}</span>
                      {m.desc}
                    </div>
                    <div className="text-right">
                      <div>{dayjs(m.fecha).format("DD/MM/YYYY")}</div>
                      <div className="text-sm text-gray-500">{formatearMoneda(m.montoARS)} ARS / u$d {m.montoUSD.toFixed(2)}</div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>

        <CotizacionDolarModal />
      </motion.div>
    </div>
  );
}
