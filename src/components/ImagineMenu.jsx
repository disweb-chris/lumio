// src/components/ImagineMenu.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ImagineMenu() {
  const [open, setOpen] = useState(false);

  return (
    <li
      className="relative"
      onMouseLeave={() => setOpen(false)}   // cierra al salir con el mouse
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
      >
        Imagine ▾
      </button>

      {open && (
        <ul className="absolute left-0 top-full -mt-3 bg-white dark:bg-gray-800 shadow-md rounded z-50 min-w-[10rem]">
          <li>
            <Link
              to="/colaboradores"
              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Colaboradores
            </Link>
          </li>
          <li>
    <Link 
      to="/proyectos" 
      className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
    > 
      Proyectos 
    </Link> 
  </li>
          {/* Aquí podrás añadir más items de este módulo */}
        </ul>
      )}
    </li>
  );
}
