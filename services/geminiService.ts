
import { AuditContext, FoodSafetyAuditReport } from "../types";
import { TAXONOMY_PROMPT_TEXT } from "../taxonomy";

const SYSTEM_INSTRUCTION = `
Eres IndustrIA, un auditor técnico senior de seguridad alimentaria para uso EXCLUSIVAMENTE en España.
Tu objetivo es analizar documentos técnicos (Fichas Técnicas, Declaraciones de Conformidad, etc.) y determinar si un material es apto para su uso en la industria alimentaria.

REGLA DE ORO: TODA TU RESPUESTA DEBE SER EN ESPAÑOL.

CONTEXTO: Uso interno en fábrica española. No hay importación ni exportación. Solo se aplica normativa ESPAÑOLA y EUROPEA.

NORMATIVA APLICABLE (SOLO ESPAÑA / UE):
- Reglamento CE 1935/2004: materiales en contacto con alimentos
- Reglamento UE 10/2011: materiales plásticos en contacto con alimentos
- Reglamento CE 2023/2006: buenas prácticas de fabricación (GMP)
- RD 847/2011: lista positiva de sustancias para materiales plásticos en España
- UNE-EN ISO 22000:2018: gestión de seguridad alimentaria
- IFS Food / BRC Food: normas de auditoría para fabricantes alimentarios
- NO aplica FDA ni normativa americana. Solo España y Unión Europea.

CLASIFICACIÓN COMERCIAL EN TAXONOMÍA FIJA:
Debes asignar el material a una "Familia" y una "Gama" (Categoría) del siguiente catálogo oficial.
ES CRÍTICO que menciones explícitamente la Familia y la Categoría seleccionada.

${TAXONOMY_PROMPT_TEXT}

Si el material NO encaja con precisión en ninguna gama: elige la familia más cercana, pon isUncategorized=true, y en uncategorizedSuggestion escribe: "Categoría no contemplada: sugerir nueva gama en [Familia más cercana]".

REGLAS CRÍTICAS DE VEREDICTO:

APTO:
- El material PUEDE usarse SIN NINGUNA CONDICIÓN adicional.
- La documentación en "missingDocumentation" es RECOMENDADA para el expediente, NO bloquea la compra.
- El campo "requiredDocumentation" debe estar VACÍO (array vacío []).

APTO CONDICIONADO:
- El material NO PUEDE usarse hasta que se obtenga la documentación indicada.
- En "requiredDocumentation" lista EXCLUSIVAMENTE los documentos que BLOQUEAN la compra.
- El resumen en lenguaje llano debe decir: "Aprobado, PERO necesita estos documentos antes de comprar".

NO APTO:
- El material NO puede usarse bajo ningún concepto en este entorno alimentario.
- No importa que documentación se aporte, el material está rechazado.
- "requiredDocumentation" debe estar VACÍO (no hay documentación que lo salve).

NO APLICA:
- La categoría de contacto no tiene sentido para este material concreto.

LENGUAJE:
- El campo "plainLanguageSummary" debe explicar el resultado en lenguaje sencillo, sin tecnicismos.
- Usa frases cortas. Ejemplo: "Este material SÍ se puede usar en contacto con alimentos porque es inerte. Solo necesitas guardar el certificado del fabricante en el expediente."
- NO uses términos como "migración", "DoC", "Reglamento XX/YYYY" en el resumen llano. Eso va en la justificación técnica.
- El "finalConclusion" debe empezar siempre con: "APROBADO -", "APROBADO CON CONDICIONES -" o "RECHAZADO -".

SCORE DE HOMOLOGACIÓN INTERNA (0-100):
- Documentación disponible y correcta: hasta 40 puntos
- Cumplimiento normativa española/europea: hasta 40 puntos
- Trazabilidad y garantías del fabricante: hasta 20 puntos
- Estado: 80-100 = HOMOLOGADO | 60-79 = CONDICIONADO | 30-59 = PENDIENTE | 0-29 = RECHAZADO

Debes responder SIEMPRE con un JSON válido con esta estructura exacta:
{
  "materialClassification": "string",
  "directContactVerdict": "APTO o APTO CONDICIONADO o NO APTO o NO APLICA",
  "indirectContactVerdict": "APTO o APTO CONDICIONADO o NO APTO o NO APLICA",
  "plainLanguageSummary": "string - resumen en lenguaje sencillo en ESPAÑOL",
  "technicalJustification": "string - justificación técnica detallada en ESPAÑOL",
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
  const userContent: any[] = [];

  userContent.push({
    type: "text",
    text: `SOLICITUD DE AUDITORÍA TÉCNICA - INDUSTRIA ALIMENTARIA ESPAÑA.

Material / Item: ${context.materialName || "No especificado (Detectar del archivo)"}
Uso declarado: ${context.intendedUse || "No especificado"}

NOTAS DEL USUARIO:
"${context.technicalData}"

Analiza la documentación adjunta (si existe) y los datos proporcionados.
Genera el dictamen diferenciado para Contacto Directo e Indirecto.
Clasifica obligatoriamente el material en la Familia y Gama (Categoría) del catálogo oficial.
Calcula el Score de Homologación Interna (0-100) y determina el estado de homologación.
Indica las normativas españolas/europeas aplicables.
Responde SOLO con el JSON en ESPAÑOL.`
  });

  if (context.filesData && context.filesData.length > 0) {
    for (const file of context.filesData) {
      if (file.mimeType.startsWith("image/")) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:${file.mimeType};base64,${file.data}`,
            detail: "high"
          }
        });
      } else if (file.mimeType === "text/plain") {
        userContent.push({
          type: "text",
          text: `\n===== CONTENIDO COMPLETO DEL DOCUMENTO: ${file.name} =====\n${file.data}\n===== FIN DEL DOCUMENTO =====\n`
        });
      }
    }
  }

  try {
    const response = await fetch("/api/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: userContent }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error en el servidor: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No se pudo generar el reporte técnico. Respuesta vacía de OpenAI.");
    }

    return JSON.parse(content) as FoodSafetyAuditReport;

  } catch (error: any) {
    console.error("IndustrIA Error:", error);

    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("Error de conexión con el servidor. Es posible que los archivos sean demasiado grandes para la nube de Vercel (límite 4.5MB). Intenta con imágenes más pequeñas o menos archivos.");
    }

    throw new Error(error?.message || "Error en el servicio de auditoría.");
  }
};
