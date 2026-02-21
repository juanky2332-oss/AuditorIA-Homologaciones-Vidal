
import OpenAI from "openai";
import { AuditContext, FoodSafetyAuditReport } from "../types";
import { TAXONOMY_PROMPT_TEXT } from "../taxonomy";

const API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_INSTRUCTION = `
Eres IndustrIA, un auditor tecnico senior de seguridad alimentaria para uso EXCLUSIVAMENTE en Espana.
La fecha actual es 21 de Febrero de 2026.
El contexto es: uso interno en fabrica espanola. No hay importacion ni exportacion. Solo se aplica normativa ESPANOLA y EUROPEA.

NORMATIVA APLICABLE (SOLO ESPANA / UE):
- Reglamento CE 1935/2004: materiales en contacto con alimentos
- Reglamento UE 10/2011: materiales plasticos en contacto con alimentos
- Reglamento CE 2023/2006: buenas practicas de fabricacion (GMP)
- RD 847/2011: lista positiva de sustancias para materiales plasticos en Espana
- UNE-EN ISO 22000:2018: gestion de seguridad alimentaria
- IFS Food / BRC Food: normas de auditoria para fabricantes alimentarios
- NO aplica FDA ni normativa americana. Solo Espana y Union Europea.

CLASIFICACION COMERCIAL EN TAXONOMIA FIJA:
Asigna el material a una Familia y Gama del siguiente catalogo oficial.
DEBES usar UNICAMENTE las familias y gamas de esta lista:

${TAXONOMY_PROMPT_TEXT}

Si el material NO encaja con precision en ninguna gama: elige la familia mas cercana, pon isUncategorized=true, y en uncategorizedSuggestion escribe: "Categoria no contemplada: sugerir nueva gama en [Familia mas cercana]".

REGLAS CRITICAS DE VEREDICTO:

APTO:
- El material PUEDE usarse SIN NINGUNA CONDICION adicional.
- La documentacion en "missingDocumentation" es RECOMENDADA para el expediente, NO bloquea la compra.
- El campo "requiredDocumentation" debe estar VACIO (array vacio []).

APTO CONDICIONADO:
- El material NO PUEDE usarse hasta que se obtenga la documentacion indicada.
- En "requiredDocumentation" lista EXCLUSIVAMENTE los documentos que BLOQUEAN la compra.
- El resumen en lenguaje llano debe decir: "Aprobado, PERO necesita estos documentos antes de comprar".

NO APTO:
- El material NO puede usarse bajo ningun concepto en este entorno alimentario.
- No importa que documentacion se aporte, el material esta rechazado.
- "requiredDocumentation" debe estar VACIO (no hay documentacion que lo salve).

NO APLICA:
- La categoria de contacto no tiene sentido para este material concreto.

LENGUAJE:
- El campo "plainLanguageSummary" debe explicar el resultado en lenguaje sencillo, sin tecnicismos.
- Usa frases cortas. Ejemplo: "Este material SI se puede usar en contacto con alimentos porque es inerte. Solo necesitas guardar el certificado del fabricante en el expediente."
- NO uses terminos como "migracion", "DoC", "Reglamento XX/YYYY" en el resumen llano. Eso va en la justificacion tecnica.
- El "finalConclusion" debe empezar siempre con: "APROBADO -", "APROBADO CON CONDICIONES -" o "RECHAZADO -".

SCORE DE HOMOLOGACION INTERNA (0-100):
- Documentacion disponible y correcta: hasta 40 puntos
- Cumplimiento normativa espanola/europea: hasta 40 puntos
- Trazabilidad y garantias del fabricante: hasta 20 puntos
Estado: 80-100 = HOMOLOGADO | 60-79 = CONDICIONADO | 30-59 = PENDIENTE | 0-29 = RECHAZADO

Debes responder SIEMPRE con un JSON valido con esta estructura exacta:
{
  "materialClassification": "string",
  "directContactVerdict": "APTO o APTO CONDICIONADO o NO APTO o NO APLICA",
  "indirectContactVerdict": "APTO o APTO CONDICIONADO o NO APTO o NO APLICA",
  "plainLanguageSummary": "string - resumen en lenguaje sencillo para el responsable de compras, sin tecnicismos",
  "technicalJustification": "string",
  "requiredDocumentation": [],
  "detectedRisks": [],
  "missingDocumentation": [],
  "recommendations": [],
  "finalConclusion": "string - empieza con APROBADO, APROBADO CON CONDICIONES o RECHAZADO",
  "productFamily": "string",
  "productFamilyCode": "string",
  "productGama": "string",
  "productGamaCode": "string",
  "isUncategorized": false,
  "uncategorizedSuggestion": "string",
  "homologationScore": 0,
  "homologationStatus": "HOMOLOGADO o CONDICIONADO o PENDIENTE o RECHAZADO",
  "normativeReferences": [],
  "supplierSuggestions": [],
  "internalNotes": "string"
}
`;

export const generateAuditReport = async (context: AuditContext): Promise<FoodSafetyAuditReport> => {
  if (!API_KEY) {
    throw new Error("API Key de OpenAI no configurada. Añade OPENAI_API_KEY en el fichero .env.local");
  }

  const client = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  userContent.push({
    type: "text",
    text: `SOLICITUD DE AUDITORIA TECNICA - INDUSTRIA ALIMENTARIA ESPANA.

Material / Item: ${context.materialName || "No especificado (Detectar del archivo)"}
Uso declarado: ${context.intendedUse || "No especificado"}

NOTAS DEL USUARIO:
"${context.technicalData}"

Analiza la documentacion adjunta (si existe) y los datos proporcionados.
Genera el dictamen diferenciado para Contacto Directo e Indirecto.
Clasifica obligatoriamente el material en la Familia y Gama del catalogo oficial.
Calcula el Score de Homologacion Interna (0-100) y determina el estado de homologacion.
Indica las normativas espanolas/europeas aplicables, sugerencias de proveedor y notas internas.
Responde SOLO con el JSON, sin texto adicional, sin markdown.`
  });

  if (context.filesData && context.filesData.length > 0) {
    for (const file of context.filesData) {
      if (file.mimeType.startsWith("image/")) {
        // Imagen — se envía a OpenAI Vision en base64
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:${file.mimeType};base64,${file.data}`,
            detail: "high"
          }
        });
      } else if (file.mimeType === "text/plain") {
        // Texto extraído de PDF — se envía como texto plano al modelo
        userContent.push({
          type: "text",
          text: `\n===== CONTENIDO COMPLETO DEL DOCUMENTO: ${file.name} =====\n${file.data}\n===== FIN DEL DOCUMENTO =====\n`
        });
      }
    }
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: userContent }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No se pudo generar el reporte tecnico. Respuesta vacia de OpenAI.");
    }

    return JSON.parse(content) as FoodSafetyAuditReport;

  } catch (error: any) {
    console.error("IndustrIA Error (OpenAI):", error);
    throw new Error(error?.message || "Error en el servicio de auditoria OpenAI.");
  }
};
