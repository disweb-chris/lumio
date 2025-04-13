import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Presupuestos from './pages/Presupuestos';
import Gastos from './pages/Gastos';
import Ingresos from "./pages/Ingresos";
import Vencimientos from "./pages/Vencimientos";
import Informe from "./pages/Informe";


function App() {
  return (
    <div className="dark">
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white p-4">
          <nav className="mb-4 space-x-4">
            <Link to="/" className="text-blue-600 dark:text-blue-400">Dashboard</Link>
            <Link to="/presupuestos" className="text-blue-600 dark:text-blue-400">Presupuestos</Link>
            <Link to="/gastos" className="text-blue-600 dark:text-blue-400">Gastos</Link>
            <Link to="/ingresos" className="text-blue-600 dark:text-blue-400">Ingresos</Link>
            <Link to="/vencimientos" className="text-blue-600 dark:text-blue-400">Vencimientos</Link>
            <Link to="/informe" className="text-blue-600 dark:text-blue-400">Informe</Link>

          </nav>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/presupuestos" element={<Presupuestos />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/ingresos" element={<Ingresos />} />
            <Route path="/vencimientos" element={<Vencimientos />} />
            <Route path="/informe" element={<Informe />} />

          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
