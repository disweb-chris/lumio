import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Presupuestos from "./pages/Presupuestos";
import Gastos from "./pages/Gastos";
import Ingresos from "./pages/Ingresos";
import Vencimientos from "./pages/Vencimientos";
import Informe from "./pages/Informe";

function App() {
  return (
    <div className="dark">
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white p-4">
        <nav className="mb-6 overflow-x-auto border-b border-gray-300 dark:border-gray-700">
  <ul className="flex flex-wrap sm:flex-nowrap gap-4 whitespace-nowrap py-3 px-2">
    <li>
      <Link to="/" className="text-blue-600 dark:text-blue-400">
        Dashboard
      </Link>
    </li>
    <li>
      <Link to="/presupuestos" className="text-blue-600 dark:text-blue-400">
        Presupuestos
      </Link>
    </li>
    <li>
      <Link to="/gastos" className="text-blue-600 dark:text-blue-400">
        Gastos
      </Link>
    </li>
    <li>
      <Link to="/ingresos" className="text-blue-600 dark:text-blue-400">
        Ingresos
      </Link>
    </li>
    <li>
      <Link to="/vencimientos" className="text-blue-600 dark:text-blue-400">
        Vencimientos
      </Link>
    </li>
    <li>
      <Link to="/informe" className="text-blue-600 dark:text-blue-400">
        Informe
      </Link>
    </li>
  </ul>
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
