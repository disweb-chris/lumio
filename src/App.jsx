// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Presupuestos from "./pages/Presupuestos";
import Gastos from "./pages/Gastos";
import Ingresos from "./pages/Ingresos";
import Vencimientos from "./pages/Vencimientos";
import Informe from "./pages/Informe";
import Colaboradores from "./pages/Colaboradores";
import ImagineMenu from "./components/ImagineMenu";
import Proyectos from "./pages/Proyectos";
import ProyectoDetalle from "./pages/ProyectoDetalle";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user } = useAuth();

  // clase común para cada <li>
  const navItemClass =
    "px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700";

  return (
    <div>
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white p-4">
          {user && (
            <nav className="mb-6 overflow-visible border-b border-gray-300 dark:border-gray-700">
              <ul className="flex flex-wrap sm:flex-nowrap gap-4 whitespace-nowrap py-3 px-2">
                <li className={navItemClass}>
                  <Link to="/" className="text-blue-600 dark:text-blue-400">
                    Dashboard
                  </Link>
                </li>
                <li className={navItemClass}>
                  <Link
                    to="/presupuestos"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    Presupuestos
                  </Link>
                </li>
                <li className={navItemClass}>
                  <Link
                    to="/gastos"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    Gastos
                  </Link>
                </li>
                <li className={navItemClass}>
                  <Link
                    to="/ingresos"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    Ingresos
                  </Link>
                </li>
                <li className={navItemClass}>
                  <Link
                    to="/vencimientos"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    Vencimientos
                  </Link>
                </li>
                <li className={navItemClass}>
                  <Link
                    to="/informe"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    Informe
                  </Link>
                </li>
                {/* Submenu “Imagine” */}
                <ImagineMenu />
              </ul>
            </nav>
          )}

          <Routes>
            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyectos"
              element={
                <ProtectedRoute>
                  <Proyectos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyectos/:id"
              element={
                <ProtectedRoute>
                  <ProyectoDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/colaboradores"
              element={
                <ProtectedRoute>
                  <Colaboradores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/presupuestos"
              element={
                <ProtectedRoute>
                  <Presupuestos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gastos"
              element={
                <ProtectedRoute>
                  <Gastos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ingresos"
              element={
                <ProtectedRoute>
                  <Ingresos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vencimientos"
              element={
                <ProtectedRoute>
                  <Vencimientos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/informe"
              element={
                <ProtectedRoute>
                  <Informe />
                </ProtectedRoute>
              }
            />

            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </div>
  );
}

export default App;
