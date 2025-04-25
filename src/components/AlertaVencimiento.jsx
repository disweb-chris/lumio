// src/components/AlertaVencimiento.jsx
import dayjs from "dayjs";

export default function AlertaVencimiento({ fecha, pagado }) {
  const hoy = dayjs();
  const vencimiento = dayjs(fecha);
  const diff = vencimiento.diff(hoy, "day");
  const formattedDate = vencimiento.format("DD/MM/YYYY");

  let icon = "";
  let texto = "";
  let color = "";
  let title = "";

  if (pagado) {
    icon = "✅";
    texto = "Pagado";
    color = "bg-green-500 text-white";
    title = `Pagado el ${formattedDate}`;
  } else if (diff < 0) {
    icon = "❌";
    texto = "Vencido";
    color = "bg-red-600 text-white";
    title = `Venció el ${formattedDate} (hace ${Math.abs(diff)} días)`;
  } else if (diff <= 3) {
    icon = "⏰";
    texto = "Por vencer";
    color = "bg-yellow-400 text-black";
    title = `Vence el ${formattedDate} (en ${diff} días)`;
  } else {
    icon = "⚪";
    texto = "Pendiente";
    color = "bg-gray-400 text-white";
    title = `Vence el ${formattedDate} (en ${diff} días)`;
  }

  return (
    <abbr
      title={title}
      className={`text-xs px-3 py-1 rounded-full font-bold mb-2 inline-flex items-center ${color}`}
    >
      <span className="mr-1">{icon}</span>
      {texto}
    </abbr>
  );
}
