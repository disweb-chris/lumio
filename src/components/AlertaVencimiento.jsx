import dayjs from "dayjs";

export default function AlertaVencimiento({ fecha, pagado }) {
  const hoy = dayjs();
  const vencimiento = dayjs(fecha);
  const diff = vencimiento.diff(hoy, "day");

  let texto = "";
  let color = "";

  if (pagado) {
    texto = "Pagado";
    color = "bg-green-500 text-white";
  } else if (diff < 0) {
    texto = "Vencido";
    color = "bg-red-600 text-white";
  } else if (diff <= 3) {
    texto = "Por vencer";
    color = "bg-yellow-400 text-black";
  } else {
    texto = "Pendiente";
    color = "bg-gray-400 text-white";
  }

  return (
    <div className={`text-xs px-3 py-1 rounded-full font-bold mb-2 inline-block ${color}`}>
      {texto}
    </div>
  );
}
