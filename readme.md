# 💸 App de Presupuesto Personal

Aplicación web para gestionar tu presupuesto mensual, desarrollada con **React + Vite**, **Firebase** (Firestore + Auth) y **Tailwind CSS**, con almacenamiento de configuración local (`.env`) y despliegue en **Vercel**.

---

## 📋 Índice

- [✨ Funcionalidades principales](#-funcionalidades-principales)  
- [🧪 Tecnologías usadas](#-tecnologías-usadas)  
- [⚙️ Requisitos previos](#️-requisitos-previos)  
- [🔧 Configuración de variables de entorno](#-configuración-de-variables-de-entorno)  
- [🚀 Instalación y ejecución local](#-instalación-y-ejecución-local)  
- [📦 Despliegue en Vercel](#-despliegue-en-vercel)  
- [📂 Estructura de carpetas](#-estructura-de-carpetas)  
- [🤝 Contribuir](#-contribuir)  
- [📄 Licencia](#-licencia)

---

## ✨ Funcionalidades principales

- 🧾 **Presupuesto por categoría**: Define y edita presupuestos por rubro (alimentación, transporte, ocio, etc.).  
- 💸 **Registro de gastos**: Añade gastos en ARS o USD, con conversión automática.  
- 📈 **Informe visual**: Gráficos de pastel y línea con **Recharts**.  
- 💰 **Gestión de ingresos**: Registra ingresos, marca pagos recibidos (completo, 50/50 o manual).  
- ⏰ **Vencimientos y alertas**: Crea pagos con fecha límite, marca pagado y genera recurrentes.  
- 📋 **Dashboard**: Resumen de dinero disponible, pagos próximos y pendientes.  
- 🔒 **Autenticación**: Registro e inicio de sesión con **Firebase Auth**.  
- 🌙 **Modo oscuro**: Activable automáticamente con Tailwind.

---

## 🧪 Tecnologías usadas

- **Frontend**: React 18 + Vite  
- **Estilos**: Tailwind CSS  
- **Gráficos**: Recharts  
- **Autenticación & BBDD**: Firebase Auth & Firestore  
- **Almacenamiento local**: `.env.local` + localStorage (configuración USD)  
- **Despliegue**: Vercel

---

## ⚙️ Requisitos previos

- Node.js ≥ 18  
- npm o yarn  
- Cuenta de Firebase (Proyecto con Firestore y Auth habilitados)  
- Cuenta de Vercel (para despliegue)

---

## 🔧 Configuración de variables de entorno

1. Copia `.env.local.example` a `.env.local` en la raíz del proyecto.  
2. Edita `.env.local` con tus claves de Firebase:

   ```env
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
   VITE_FIREBASE_PROJECT_ID=tu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=tu_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id
   VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id
