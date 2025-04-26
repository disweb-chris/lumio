// src/utils/configuracion.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

const CONFIG_DOC_ID = "cotizacion";

export async function obtenerCotizacionUSD() {
  try {
    const ref = doc(db, "config", CONFIG_DOC_ID);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().cotizacionUSD : null;
  } catch (error) {
    console.warn("Error al obtener cotización USD:", error);
    return null;
  }
}

export async function actualizarCotizacionUSD(nuevoValor) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuario no autenticado");
    }
    const uid = user.uid;
    const ref = doc(db, "config", CONFIG_DOC_ID);
    await setDoc(ref, {
      cotizacionUSD: nuevoValor,
      uid,
    });
  } catch (error) {
    console.error("Error al actualizar cotización USD:", error);
    throw error;
  }
}
