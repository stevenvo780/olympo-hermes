export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  variedad: string | null;
  precio: string;
  precio_mostrar: string;
  precioanterior: string;
  precioanterior_mostrar: string;
  descuento: number;
  categoria: string;
  subcategoria: string;
  ocultar: string;
  stock: string;
  codigo: string;
  minimo: number;
  maximo: number;
  step: number;
  imagen: string;
  imagen_tamano: string;
  imagenes: string[];
  tiene_precios_diferentes: boolean;
  se_puede_pedir: boolean;
  cantidad: number;
  adicionales: number;
  aclaracion: string;
}

export interface OrderData {
  productos: string;
  additional_info: string;
  ultima_actualizacion: number;
  preguntas: string;
  precio_final: number;
  precio_solo_articulos: number;
  cantidad_articulos_final: number;
  precio_extras_final: number;
  precio_final_sin_impuestos: number;
  impuestos: number;
  precio_adicionales_final: number;
  cantidad_productos_final: number;
  whatsapp: string;
}

export interface Pregunta {
  pregunta: string;
  respuesta: string;
}

export interface Order {
  productos: Product[];
  additional_info: string;
  ultima_actualizacion: number;
  preguntas: Pregunta[];
  precio_final: number;
  precio_solo_articulos: number;
  cantidad_articulos_final: number;
  precio_extras_final: number;
  precio_final_sin_impuestos: number;
  impuestos: number;
  precio_adicionales_final: number;
  cantidad_productos_final: number;
  whatsapp: string;
}

export interface OrderBody {
  order: Order;
}

export interface ProductQuantities {
  [productName: string]: {
    [clientDocument: string]: number;
  };
}

export interface TotalProductsPerClient {
  [clientDocument: string]: number;
}
