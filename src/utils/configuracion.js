// src/utils/configuracion.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";  // ← IMPORTA getAuth

const CONFIG_DOC_ID = "cotizacion";

export async function obtenerCotizacionUSD() {
  const ref = doc(db, "config", CONFIG_DOC_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().cotizacionUSD;
  }
  return null;
}

export async function actualizarCotizacionUSD(nuevoValor) {
  const auth = getAuth();   // ← OBTÉN la instancia de Auth
  const uid = auth.currentUser.uid;
  const ref = doc(db, "config", CONFIG_DOC_ID);
  await setDoc(ref, {
    cotizacionUSD: nuevoValor,
    uid,                    // ← GUARDA el uid para tus reglas
  });
}
