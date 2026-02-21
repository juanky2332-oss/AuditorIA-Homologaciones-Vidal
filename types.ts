
export enum AuditResultType {
  APTO = 'APTO',
  APTO_CONDICIONADO = 'APTO CONDICIONADO',
  NO_APTO = 'NO APTO',
  NO_APLICA = 'NO APLICA'
}

export enum MaterialContactType {
  DIRECTO = 'DIRECTO',
  INDIRECTO = 'INDIRECTO',
  AMBOS = 'DIRECTO E INDIRECTO',
  SIN_CONTACTO = 'SIN CONTACTO'
}

export enum HomologationStatus {
  HOMOLOGADO = 'HOMOLOGADO',
  CONDICIONADO = 'CONDICIONADO',
  PENDIENTE = 'PENDIENTE',
  RECHAZADO = 'RECHAZADO'
}

export interface FoodSafetyAuditReport {
  // --- Clasificación de Seguridad Alimentaria ---
  materialClassification: string;
  directContactVerdict: AuditResultType;
  indirectContactVerdict: AuditResultType;
  plainLanguageSummary: string;       // Resumen en lenguaje sencillo para no técnicos
  technicalJustification: string;
  requiredDocumentation: string[];    // Docs OBLIGATORIOS que bloquean la compra (solo si APTO CONDICIONADO)
  detectedRisks: string[];
  missingDocumentation: string[];     // Docs recomendados (no bloquean la compra)
  recommendations: string[];
  finalConclusion: string;

  // --- Clasificación Comercial / Taxonomía ---
  productFamily: string;
  productFamilyCode: string;
  productGama: string;
  productGamaCode: string;
  isUncategorized: boolean;
  uncategorizedSuggestion: string;

  // --- Datos Internos de Homologación ---
  homologationScore: number;
  homologationStatus: HomologationStatus;
  normativeReferences: string[];
  supplierSuggestions: string[];
  internalNotes: string;
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 string
}

export interface AuditContext {
  materialName?: string;
  intendedUse: string;
  technicalData: string;
  filesData?: FileData[];
}
