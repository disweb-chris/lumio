export const guardarEnStorage = (clave, valor) => {
    localStorage.setItem(clave, JSON.stringify(valor));
  };
  
  export const obtenerDeStorage = (clave, valorInicial) => {
    const guardado = localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : valorInicial;
  };
  