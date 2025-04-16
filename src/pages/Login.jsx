import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Iniciar sesión
        </h2>

        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        <input
          type="email"
          placeholder="Correo"
          className="w-full mb-3 p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full mb-4 p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Ingresar
        </button>

        <p className="mt-4 text-sm text-gray-500 dark:text-gray-300 text-center">
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="text-blue-600 dark:text-blue-400">
            Registrate
          </Link>
        </p>
      </form>
    </div>
  );
}
    