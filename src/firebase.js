// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgeURpwUx5bhSd7BFAsv1uwr4niz4h5iE",
  authDomain: "lumio-6651c.firebaseapp.com",
  projectId: "lumio-6651c",
  storageBucket: "lumio-6651c.firebasestorage.app",
  messagingSenderId: "281410343977",
  appId: "1:281410343977:web:8e501ce0d5b4e041573838",
  measurementId: "G-RBRLJ4EM2B",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
