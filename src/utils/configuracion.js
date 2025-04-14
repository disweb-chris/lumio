// utils/configuracion.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const CONFIG_DOC_ID = "cotizacion"; // será config/cotizacion

export async function obtenerCotizacionUSD() {
  const ref = doc(db, "config", CONFIG_DOC_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().cotizacionUSD;
  }
  return null;
}

export async function actualizarCotizacionUSD(nuevoValor) {
  const ref = doc(db, "config", CONFIG_DOC_ID);
  await setDoc(ref, { cotizacionUSD: nuevoValor });
}
