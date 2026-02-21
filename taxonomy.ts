
export interface ProductGama {
  code: string;
  name: string;
}

export interface ProductFamily {
  code: string;
  name: string;
  fullName: string;
  gamas: ProductGama[];
}

export const PRODUCT_TAXONOMY: ProductFamily[] = [
  {
    code: "01",
    name: "ELECTRICIDAD DE POTENCIA Y DISTRIBUCIÓN",
    fullName: "FAMILIA 01: ELECTRICIDAD DE POTENCIA Y DISTRIBUCIÓN",
    gamas: [
      { code: "1.1", name: "Protecciones Magnetotérmicas" },
      { code: "1.2", name: "Cajas y Cuadros Eléctricos" },
      { code: "1.3", name: "Canalización y Conducción" },
      { code: "1.4", name: "Bases y Clavijas Industriales" },
      { code: "1.5", name: "Transformadores y Fuentes" },
      { code: "1.6", name: "Conductores y Cables de Potencia" },
    ],
  },
  {
    code: "02",
    name: "AUTOMATIZACIÓN, CONTROL Y SEGURIDAD",
    fullName: "FAMILIA 02: AUTOMATIZACIÓN, CONTROL Y SEGURIDAD",
    gamas: [
      { code: "2.1", name: "Autómatas y Control (PLC/HMI)" },
      { code: "2.2", name: "Sensores de Proximidad y Posición" },
      { code: "2.3", name: "Fotocélulas y Sistemas Ópticos" },
      { code: "2.4", name: "Aparamenta de Mando" },
      { code: "2.5", name: "Seguridad Industrial Técnica" },
      { code: "2.6", name: "Regulación de Velocidad" },
    ],
  },
  {
    code: "03",
    name: "MECÁNICA Y TRANSMISIÓN DE POTENCIA",
    fullName: "FAMILIA 03: MECÁNICA Y TRANSMISIÓN DE POTENCIA",
    gamas: [
      { code: "3.1", name: "Rodamientos y Unidades de Soporte" },
      { code: "3.2", name: "Correas y Poleas" },
      { code: "3.3", name: "Cadenas, Piñones y Discos" },
      { code: "3.4", name: "Elementos de Eje y Unión" },
      { code: "3.5", name: "Guiado y Movimiento Lineal" },
      { code: "3.6", name: "Motores y Reductores" },
    ],
  },
  {
    code: "04",
    name: "NEUMÁTICA, VACÍO E HIDRÁULICA",
    fullName: "FAMILIA 04: NEUMÁTICA, VACÍO E HIDRÁULICA",
    gamas: [
      { code: "4.1", name: "Cilindros y Actuadores" },
      { code: "4.2", name: "Válvulas y Terminales de Válvulas" },
      { code: "4.3", name: "Tratamiento del Aire (FRL)" },
      { code: "4.4", name: "Racorería y Conectores" },
      { code: "4.5", name: "Tubería y Manguera Técnica" },
      { code: "4.6", name: "Sistemas de Vacío" },
    ],
  },
  {
    code: "05",
    name: "ESTANQUEIDAD Y FLUIDOS DE PROCESO",
    fullName: "FAMILIA 05: ESTANQUEIDAD Y FLUIDOS DE PROCESO",
    gamas: [
      { code: "5.1", name: "Válvulas de Proceso" },
      { code: "5.2", name: "Juntas e Intercambiadores" },
      { code: "5.3", name: "Cierres Mecánicos y Retenes" },
      { code: "5.4", name: "Accesorios Inoxidables Alimentarios" },
      { code: "5.5", name: "Bombas de Trasiego" },
    ],
  },
  {
    code: "06",
    name: "MANUTENCIÓN Y RUEDAS (TIPO GAYNER)",
    fullName: "FAMILIA 06: MANUTENCIÓN Y RUEDAS (TIPO GAYNER)",
    gamas: [
      { code: "6.1", name: "Ruedas Industriales de Carga" },
      { code: "6.2", name: "Soportes para Ruedas" },
      { code: "6.3", name: "Transporte de Carga (Transpaletas)" },
      { code: "6.4", name: "Elementos de Elevación y Eslingado" },
    ],
  },
  {
    code: "07",
    name: "FERRETERÍA TÉCNICA Y FIJACIONES",
    fullName: "FAMILIA 07: FERRETERÍA TÉCNICA Y FIJACIONES",
    gamas: [
      { code: "7.1", name: "Tornillería Inoxidable (A2/A4)" },
      { code: "7.2", name: "Tuercas, Arandelas y Pasadores" },
      { code: "7.3", name: "Anclajes y Fijación Química" },
      { code: "7.4", name: "Herrajes de Máquina" },
    ],
  },
  {
    code: "08",
    name: "LUBRICACIÓN Y QUÍMICOS (MRO)",
    fullName: "FAMILIA 08: LUBRICACIÓN Y QUÍMICOS (MRO)",
    gamas: [
      { code: "8.0", name: "Lubricantes Grado Alimentario (H1)" },
      { code: "8.1", name: "Lubricantes Industriales Generales" },
      { code: "8.2", name: "Adhesivos y Selladores" },
      { code: "8.3", name: "Aerosoles Técnicos" },
      { code: "8.4", name: "Productos de Limpieza Industrial" },
    ],
  },
  {
    code: "09",
    name: "HERRAMIENTAS Y EQUIPO DE MEDIDA",
    fullName: "FAMILIA 09: HERRAMIENTAS Y EQUIPO DE MEDIDA",
    gamas: [
      { code: "9.1", name: "Herramienta Manual Mecánica" },
      { code: "9.2", name: "Herramienta Eléctrica y Batería" },
      { code: "9.3", name: "Equipos de Medida y Prueba" },
      { code: "9.4", name: "Consumibles de Corte (Brocas/Discos)" },
    ],
  },
  {
    code: "10",
    name: "REPUESTOS ESPECÍFICOS DE MARCA (OEM)",
    fullName: "FAMILIA 10: REPUESTOS ESPECÍFICOS DE MARCA (OEM)",
    gamas: [
      { code: "10.1", name: "Repuestos Codificación (inkjet/termotransferencia)" },
      { code: "10.2", name: "Repuestos Envasado (flow-pack / envolvedoras)" },
      { code: "10.3", name: "Repuestos de Final de Línea (paletizado / robots)" },
    ],
  },
  {
    code: "11",
    name: "MOBILIARIO TÉCNICO Y ORDENACIÓN",
    fullName: "FAMILIA 11: MOBILIARIO TÉCNICO Y ORDENACIÓN",
    gamas: [
      { code: "11.1", name: "Bancos de Trabajo y Paneles" },
      { code: "11.2", name: "Almacenaje y Estanterías" },
      { code: "11.3", name: "Carros de Herramientas" },
    ],
  },
  {
    code: "12",
    name: "INSTRUMENTACIÓN Y CONTROL DE TEMPERATURA",
    fullName: "FAMILIA 12: INSTRUMENTACIÓN Y CONTROL DE TEMPERATURA",
    gamas: [
      { code: "12.1", name: "Resistencias Calefactoras" },
      { code: "12.2", name: "Sondas de Temperatura" },
      { code: "12.3", name: "Reguladores y Termostatos" },
    ],
  },
];

// Genera el texto de la taxonomía para el prompt de la IA
export const TAXONOMY_PROMPT_TEXT = PRODUCT_TAXONOMY.map(family =>
  `${family.fullName}\n` +
  family.gamas.map(g => `  - ${g.code} ${g.name}`).join('\n')
).join('\n\n');
