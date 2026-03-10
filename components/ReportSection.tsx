import React from 'react';
import { FoodSafetyAuditReport, AuditResultType, HomologationStatus } from '../types';

interface ReportSectionProps {
    report: FoodSafetyAuditReport;
    materialName?: string;
}

const ReportSection: React.FC<ReportSectionProps> = ({ report, materialName }) => {

    const getVerdictStyle = (result: AuditResultType) => {
        switch (result) {
            case AuditResultType.APTO: return { color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-950/20', icon: '✅', label: 'APTO' };
            case AuditResultType.APTO_CONDICIONADO: return { color: 'text-amber-400', border: 'border-amber-500', bg: 'bg-amber-950/20', icon: '⚠️', label: 'CONDICIONADO' };
            case AuditResultType.NO_APTO: return { color: 'text-red-500', border: 'border-red-600', bg: 'bg-red-950/20', icon: '❌', label: 'NO APTO' };
            case AuditResultType.NO_APLICA: return { color: 'text-slate-400', border: 'border-slate-600', bg: 'bg-slate-800/20', icon: '—', label: 'NO APLICA' };
            default: return { color: 'text-slate-400', border: 'border-slate-600', bg: 'bg-slate-800/20', icon: '—', label: '—' };
        }
    };

    const getHomologationColor = (status: HomologationStatus) => {
        switch (status) {
            case HomologationStatus.HOMOLOGADO: return { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500', bar: 'bg-emerald-500' };
            case HomologationStatus.CONDICIONADO: return { badge: 'bg-amber-500/20 text-amber-400 border-amber-500', bar: 'bg-amber-500' };
            case HomologationStatus.PENDIENTE: return { badge: 'bg-blue-500/20 text-blue-400 border-blue-500', bar: 'bg-blue-500' };
            case HomologationStatus.RECHAZADO: return { badge: 'bg-red-500/20 text-red-400 border-red-600', bar: 'bg-red-500' };
            default: return { badge: 'bg-slate-700 text-slate-400 border-slate-600', bar: 'bg-slate-500' };
        }
    };

    const homoColors = getHomologationColor(report.homologationStatus);
    const directStyle = getVerdictStyle(report.directContactVerdict);
    const indirectStyle = getVerdictStyle(report.indirectContactVerdict);

    // ─── PDF generado programáticamente con jsPDF ────────────────────────────
    const handleDownloadPDF = () => {
        // @ts-ignore
        const { jsPDF } = window.jspdf || {};
        const doc = new (jsPDF || (window as any).jsPDF)({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        const filename = `Certificado_Auditoria_${(materialName || 'Material').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        // --- Official Layout Settings ---
        const pageW = 210;
        const pageH = 297;
        const margin = 20;
        const usableW = pageW - (margin * 2);
        let currY = 30;

        // --- Utilities ---
        const checkPageBreak = (neededHeight: number) => {
            if (currY + neededHeight > pageH - margin - 20) {
                doc.addPage();
                drawBordersAndFooter();
                currY = 30;
                return true;
            }
            return false;
        };

        const drawBordersAndFooter = () => {
            // Main page border (clean and professional)
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.rect(10, 10, pageW - 20, pageH - 20); // Border around page

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.setFont('helvetica', 'normal');
            doc.text('Este documento es un informe de auditoría generado por el sistema IndustrIA para Auditoría Vidal.', margin, pageH - 12);
            const pageCount = doc.internal.getNumberOfPages();
            doc.text(`Página ${pageCount}`, pageW - margin - 15, pageH - 12);
        };

        const addText = (text: string, fontSize = 10, variant: 'normal' | 'bold' | 'italic' = 'normal', color: [number, number, number] = [40, 40, 40], indent = 0) => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', variant);
            doc.setTextColor(...color);

            // Critical: Ensure text is always split to usable width
            const lines = doc.splitTextToSize(text, usableW - indent);
            const lineHeight = fontSize * 0.55;

            lines.forEach((line: string) => {
                checkPageBreak(lineHeight);
                doc.text(line.trim(), margin + indent, currY);
                currY += lineHeight;
            });
            currY += 2.5; // Paragraph spacing
        };

        const addSectionLine = (title: string) => {
            currY += 5;
            checkPageBreak(12);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 58, 138); // Deep professional blue
            doc.text(title.toUpperCase(), margin, currY);
            currY += 2;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, currY, pageW - margin, currY);
            currY += 7;
        };

        // --- Generation Start ---
        drawBordersAndFooter();

        // 1. TOP HEADER (The "Premium" look)
        doc.setFillColor(248, 250, 252); // Very light grey bg for header area
        doc.rect(10, 10, pageW - 20, 40, 'F');

        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('CERTIFICADO TÉCNICO', margin, 27);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Auditoría de Seguridad Alimentaria', margin, 35);

        // Date and Reference on the right
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`REF: ${(materialName || 'S/N').toUpperCase()}`, pageW - margin - 60, 24, { align: 'left' });
        doc.text(`EMITIDO: ${new Date().toLocaleDateString('es-ES')}`, pageW - margin - 60, 29);
        doc.text(`VERSIÓN: IndustrIA v3.2 PRO`, pageW - margin - 60, 34);

        currY = 60;

        // 2. HOMOLOGATION STATUS BOX (Clean)
        const score = report.homologationScore;
        const scoreColor: [number, number, number] = score >= 80 ? [5, 150, 105] : score >= 60 ? [217, 119, 6] : [185, 28, 28];

        doc.setDrawColor(...scoreColor);
        doc.setLineWidth(0.8);
        doc.rect(margin, currY, usableW, 20); // Box for verdict

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...scoreColor);
        doc.text('ESTADO DE HOMOLOGACIÓN:', margin + 5, currY + 12);

        doc.setFontSize(16);
        doc.text(report.homologationStatus.toUpperCase(), margin + 70, currY + 12);

        doc.setFontSize(22);
        doc.text(`${score}/100`, pageW - margin - 10, currY + 13, { align: 'right' });

        currY += 32;

        // 3. SECTIONS
        addSectionLine('Resumen para Dirección');
        addText(report.plainLanguageSummary || 'Informe de auditoría técnica.', 11, 'italic', [71, 85, 105]);

        addSectionLine('Veredictos Alimentarios');
        const drawVerdict = (title: string, verdict: string, x: number) => {
            const vColor: [number, number, number] = verdict === 'APTO' ? [5, 150, 105] : verdict.includes('CONDICIONADO') ? [217, 119, 6] : [185, 28, 28];
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(title, x, currY);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...vColor);
            doc.text(verdict, x, currY + 6);
        };
        drawVerdict('CONTACTO DIRECTO:', report.directContactVerdict, margin);
        drawVerdict('CONTACTO INDIRECTO:', report.indirectContactVerdict, margin + 80);
        currY += 15;

        addSectionLine('Clasificación Corporativa');
        addText(`Familia: ${report.productFamily} (${report.productFamilyCode})`, 10, 'bold', [30, 58, 138]);
        addText(`Categoría (Gama): ${report.productGama} (${report.productGamaCode})`, 10, 'normal');
        if (report.isUncategorized) {
            addText(`Nota: ${report.uncategorizedSuggestion}`, 9, 'italic', [180, 83, 9]);
        }

        if (report.requiredDocumentation && report.requiredDocumentation.length > 0) {
            addSectionLine('Acciones Requeridas (Prioridad Alta)');
            report.requiredDocumentation.forEach(d => addText(`• ${d}`, 10, 'bold', [185, 28, 28], 5));
        }

        addSectionLine('Justificación Técnica y Normativa');
        addText(report.technicalJustification, 10, 'normal', [51, 65, 85]);

        if (report.detectedRisks.length > 0) {
            addSectionLine('Riesgos Identificados');
            report.detectedRisks.forEach(r => addText(`[ALERTA] ${r}`, 9, 'normal', [153, 27, 27], 5));
        }

        if (report.recommendations.length > 0) {
            addSectionLine('Recomendaciones de Mejora');
            report.recommendations.forEach(r => addText(`✓ ${r}`, 9, 'normal', [21, 128, 61], 5));
        }

        if (report.normativeReferences && report.normativeReferences.length > 0) {
            addSectionLine('Marco Normativo');
            addText(report.normativeReferences.join(' | '), 9, 'normal', [100, 116, 139]);
        }

        // Final Conclusion Stamp
        currY += 10;
        checkPageBreak(30);
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currY, usableW, 25, 'F');
        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(0.5);
        doc.rect(margin, currY, usableW, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text('CONCLUSIÓN FINAL DEL AUDITOR:', margin + 5, currY + 8);

        const concLines = doc.splitTextToSize(report.finalConclusion, usableW - 10);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        concLines.forEach((l: string, i: number) => {
            doc.text(l, margin + 5, currY + 15 + (i * 6));
        });

        doc.save(filename);
    };


    // Resumen en lenguaje llano: texto descriptivo del veredicto
    const getPlainVerdictExplanation = (verdict: AuditResultType): { text: string; color: string } => {
        switch (verdict) {
            case AuditResultType.APTO:
                return { text: 'SE PUEDE USAR sin ninguna condición', color: 'text-emerald-400' };
            case AuditResultType.APTO_CONDICIONADO:
                return { text: 'SE PUEDE USAR, pero primero requiere documentación', color: 'text-amber-400' };
            case AuditResultType.NO_APTO:
                return { text: 'NO SE PUEDE USAR en este entorno alimentario', color: 'text-red-400' };
            case AuditResultType.NO_APLICA:
                return { text: 'Esta categoría no aplica para este material', color: 'text-slate-400' };
            default:
                return { text: 'Sin veredicto', color: 'text-slate-400' };
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">

            {/* Botón Descarga */}
            <div className="flex justify-end animate-fade-in">
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Descargar Informe PDF
                </button>
            </div>

            {/* ═══ RESUMEN EN LENGUAJE LLANO (para no técnicos) ═══ */}
            {report.plainLanguageSummary && (
                <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-5 animate-fade-in">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        ¿Qué significa esto? — Resumen para el responsable de compras
                    </h4>
                    <p className="text-slate-200 text-sm leading-relaxed">{report.plainLanguageSummary}</p>
                </div>
            )}

            {/* ═══ BLOQUE DE VEREDICTOS CLAROS ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {/* Contacto Directo */}
                <div className={`rounded-xl p-5 border ${directStyle.border} ${directStyle.bg}`}>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Contacto Directo con Alimento</div>
                    <div className={`text-2xl font-black mb-1 ${directStyle.color}`}>{directStyle.icon} {directStyle.label}</div>
                    <div className={`text-xs ${directStyle.color} opacity-80`}>{getPlainVerdictExplanation(report.directContactVerdict).text}</div>
                </div>
                {/* Contacto Indirecto */}
                <div className={`rounded-xl p-5 border ${indirectStyle.border} ${indirectStyle.bg}`}>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Contacto Indirecto (Entorno Fábrica)</div>
                    <div className={`text-2xl font-black mb-1 ${indirectStyle.color}`}>{indirectStyle.icon} {indirectStyle.label}</div>
                    <div className={`text-xs ${indirectStyle.color} opacity-80`}>{getPlainVerdictExplanation(report.indirectContactVerdict).text}</div>
                </div>
            </div>

            {/* ═══ DOCUMENTACIÓN OBLIGATORIA (bloquea la compra) ═══ */}
            {report.requiredDocumentation && report.requiredDocumentation.length > 0 && (
                <div className="bg-red-950/30 border-2 border-red-500/70 rounded-xl p-5 animate-fade-in">
                    <h4 className="text-sm font-bold text-red-400 uppercase mb-1 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        ⛔ Documentación OBLIGATORIA antes de comprar
                    </h4>
                    <p className="text-red-300 text-xs mb-3">Este material está aprobado CON CONDICIONES. No se puede comprar hasta que el proveedor entregue los siguientes documentos:</p>
                    <ul className="space-y-2">
                        {report.requiredDocumentation.map((doc, i) => (
                            <li key={i} className="flex items-start gap-2 text-red-200 text-sm bg-red-900/20 p-2 rounded border-l-2 border-red-500">
                                <span className="text-red-400 font-bold mt-0.5">⛔</span> {doc}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ═══ INFORME DETALLADO ═══ */}
            <div id="audit-report-content" className="bg-[#0f172a] p-6 rounded-xl animate-fade-in space-y-6 border border-slate-800">

                {/* Cabecera */}
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                    <div>
                        <h4 className="font-bold text-slate-200 text-lg">INFORME TÉCNICO DE AUDITORÍA</h4>
                        <p className="text-xs text-slate-500 font-mono">REF: {materialName || 'S/N'} · {new Date().toLocaleDateString('es-ES')} · IndustrIA v3.2</p>
                    </div>
                    <div className="text-center">
                        <div className={`text-3xl font-black ${homoColors.badge.includes('emerald') ? 'text-emerald-400' : homoColors.badge.includes('amber') ? 'text-amber-400' : homoColors.badge.includes('blue') ? 'text-blue-400' : 'text-red-400'}`}>
                            {report.homologationScore}<span className="text-base font-normal text-slate-500">/100</span>
                        </div>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${homoColors.badge}`}>{report.homologationStatus}</div>
                    </div>
                </div>

                {/* Grid: Taxonomía + Detalles */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Col 1: Clasificación */}
                    <div className="space-y-4">
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                            <div className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Material</div>
                            <div className="text-sm text-white font-semibold">{report.materialClassification}</div>
                        </div>
                        <div className={`bg-slate-800/40 border rounded-xl p-4 ${report.isUncategorized ? 'border-orange-500/60' : 'border-blue-500/30'}`}>
                            <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">Clasificación Comercial</h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="block text-[10px] text-slate-500 font-mono">FAMILIA</span>
                                    <span className="block text-xs text-blue-300 font-bold leading-snug">{report.productFamily}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-slate-500 font-mono">GAMA</span>
                                    <span className="block text-sm text-white font-semibold">{report.productGama}</span>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <span className="bg-blue-900/50 text-blue-300 border border-blue-700 text-[10px] font-mono px-2 py-0.5 rounded">FAM. {report.productFamilyCode}</span>
                                    <span className="bg-slate-700 text-slate-300 border border-slate-600 text-[10px] font-mono px-2 py-0.5 rounded">GAMA {report.productGamaCode}</span>
                                </div>
                            </div>
                            {report.isUncategorized && (
                                <div className="mt-3 bg-orange-900/20 border border-orange-500/50 rounded p-2">
                                    <p className="text-orange-300 text-xs">{report.uncategorizedSuggestion}</p>
                                </div>
                            )}
                        </div>
                        {/* Score bar */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${homoColors.badge}`}>{report.homologationStatus}</span>
                                <span className="text-white font-bold text-sm">{report.homologationScore}/100</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className={`h-2 rounded-full ${homoColors.bar}`} style={{ width: `${report.homologationScore}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Col 2-3: Detalles técnicos */}
                    <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 flex flex-col gap-5">

                        {/* Justificación */}
                        <section>
                            <h5 className="text-xs font-bold text-blue-400 uppercase mb-2">Justificación Técnica</h5>
                            <p className="bg-slate-900/50 p-3 rounded border border-slate-700 leading-relaxed text-slate-300 text-xs font-mono">{report.technicalJustification}</p>
                        </section>

                        {/* Riesgos + Docs obligatorias */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <section>
                                <h5 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Riesgos Detectados
                                </h5>
                                {report.detectedRisks.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">{report.detectedRisks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                                ) : (
                                    <p className="text-slate-500 italic text-xs">No se detectaron riesgos críticos.</p>
                                )}
                            </section>
                            <section>
                                <h5 className="text-xs font-bold text-amber-400 uppercase mb-2 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Docs Recomendadas para el expediente
                                </h5>
                                {report.missingDocumentation.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">{report.missingDocumentation.map((d, i) => <li key={i}>{d}</li>)}</ul>
                                ) : (
                                    <p className="text-slate-500 italic text-xs">Expediente completo.</p>
                                )}
                            </section>
                        </div>

                        {/* Recomendaciones */}
                        {report.recommendations.length > 0 && (
                            <section>
                                <h5 className="text-xs font-bold text-emerald-400 uppercase mb-2">Recomendaciones</h5>
                                <ul className="space-y-1">
                                    {report.recommendations.map((rec, i) => (
                                        <li key={i} className="flex gap-2 text-slate-300 bg-slate-900/30 p-2 rounded border-l-2 border-emerald-500/50 text-xs">
                                            <span className="text-emerald-500 font-bold">✓</span> {rec}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Normativas */}
                        {report.normativeReferences && report.normativeReferences.length > 0 && (
                            <section>
                                <h5 className="text-xs font-bold text-purple-400 uppercase mb-2">Referencias Normativas (España / UE)</h5>
                                <div className="flex flex-wrap gap-2">
                                    {report.normativeReferences.map((ref, i) => (
                                        <span key={i} className="bg-purple-900/30 text-purple-300 border border-purple-700/50 text-xs font-mono px-3 py-1 rounded-full">{ref}</span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Sugerencias proveedor */}
                        {report.supplierSuggestions && report.supplierSuggestions.length > 0 && (
                            <section>
                                <h5 className="text-xs font-bold text-cyan-400 uppercase mb-2">Perfil de Proveedor Recomendado</h5>
                                <ul className="space-y-1">
                                    {report.supplierSuggestions.map((s, i) => (
                                        <li key={i} className="flex gap-2 text-slate-300 bg-slate-900/30 p-2 rounded border-l-2 border-cyan-500/50 text-xs">
                                            <span className="text-cyan-400 font-bold">→</span> {s}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Notas internas */}
                        {report.internalNotes && (
                            <section className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-4">
                                <h5 className="text-xs font-bold text-yellow-400 uppercase mb-2">Notas Internas del Auditor (uso interno)</h5>
                                <p className="text-yellow-200/80 text-xs font-mono leading-relaxed">{report.internalNotes}</p>
                            </section>
                        )}

                        {/* Dictamen Final */}
                        <div className="pt-4 border-t border-slate-700">
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Dictamen Final del Auditor</h5>
                            <p className="text-slate-200 font-medium leading-relaxed bg-blue-900/10 p-4 rounded border border-blue-900/30 text-sm">
                                {report.finalConclusion}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ PLANTILLA COMPACTA PARA PDF (oculta en pantalla) ═══ */}
            <div id="pdf-report-single-page" style={{
                display: 'none',
                fontFamily: 'Arial, sans-serif',
                background: '#0f172a',
                color: '#e2e8f0',
                padding: '16px',
                fontSize: '10px',
                lineHeight: '1.4'
            }}>
                {/* Cabecera PDF */}
                <div style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f1f5f9' }}>INFORME DE AUDITORÍA DE SEGURIDAD ALIMENTARIA</div>
                        <div style={{ color: '#64748b', fontSize: '9px' }}>Material: {materialName || 'S/N'} · Fecha: {new Date().toLocaleDateString('es-ES')} · IndustrIA v3.2 · Uso interno fábrica España</div>
                    </div>
                    <div style={{ textAlign: 'center', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '6px 12px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: report.homologationScore >= 80 ? '#34d399' : report.homologationScore >= 60 ? '#fbbf24' : '#f87171' }}>{report.homologationScore}/100</div>
                        <div style={{ fontSize: '8px', color: '#94a3b8' }}>{report.homologationStatus}</div>
                    </div>
                </div>

                {/* Resumen llano */}
                {report.plainLanguageSummary && (
                    <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '3px', textTransform: 'uppercase' }}>¿Qué significa esto? — Para el responsable de compras</div>
                        <div style={{ color: '#cbd5e1' }}>{report.plainLanguageSummary}</div>
                    </div>
                )}

                {/* Veredictos */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, border: `1px solid ${report.directContactVerdict === AuditResultType.APTO ? '#10b981' : report.directContactVerdict === AuditResultType.APTO_CONDICIONADO ? '#f59e0b' : '#ef4444'}`, borderRadius: '6px', padding: '8px' }}>
                        <div style={{ fontSize: '8px', color: '#94a3b8', marginBottom: '2px' }}>CONTACTO DIRECTO CON ALIMENTO</div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: report.directContactVerdict === AuditResultType.APTO ? '#34d399' : report.directContactVerdict === AuditResultType.APTO_CONDICIONADO ? '#fbbf24' : '#f87171' }}>{report.directContactVerdict}</div>
                    </div>
                    <div style={{ flex: 1, border: `1px solid ${report.indirectContactVerdict === AuditResultType.APTO ? '#10b981' : report.indirectContactVerdict === AuditResultType.APTO_CONDICIONADO ? '#f59e0b' : '#ef4444'}`, borderRadius: '6px', padding: '8px' }}>
                        <div style={{ fontSize: '8px', color: '#94a3b8', marginBottom: '2px' }}>CONTACTO INDIRECTO (ENTORNO FÁBRICA)</div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: report.indirectContactVerdict === AuditResultType.APTO ? '#34d399' : report.indirectContactVerdict === AuditResultType.APTO_CONDICIONADO ? '#fbbf24' : '#f87171' }}>{report.indirectContactVerdict}</div>
                    </div>
                    <div style={{ flex: 1, border: '1px solid #3b82f6', borderRadius: '6px', padding: '8px' }}>
                        <div style={{ fontSize: '8px', color: '#94a3b8', marginBottom: '2px' }}>CLASIFICACIÓN COMERCIAL</div>
                        <div style={{ color: '#93c5fd', fontWeight: 'bold', fontSize: '9px' }}>{report.productFamily}</div>
                        <div style={{ color: '#f1f5f9', fontSize: '10px' }}>{report.productGama}</div>
                    </div>
                </div>

                {/* Docs obligatorias PDF */}
                {report.requiredDocumentation && report.requiredDocumentation.length > 0 && (
                    <div style={{ background: 'rgba(127,29,29,0.3)', border: '2px solid #ef4444', borderRadius: '6px', padding: '8px', marginBottom: '10px' }}>
                        <div style={{ fontWeight: 'bold', color: '#f87171', marginBottom: '4px' }}>⛔ DOCUMENTACIÓN OBLIGATORIA ANTES DE COMPRAR</div>
                        {report.requiredDocumentation.map((d, i) => <div key={i} style={{ color: '#fca5a5', marginLeft: '8px' }}>• {d}</div>)}
                    </div>
                )}

                {/* Justificación técnica */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '3px' }}>Justificación Técnica</div>
                    <div style={{ background: '#1e293b', padding: '6px 8px', borderRadius: '4px', color: '#cbd5e1', fontSize: '9px' }}>{report.technicalJustification}</div>
                </div>

                {/* Riesgos / Docs recomendadas en 2 cols */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#f87171', textTransform: 'uppercase', marginBottom: '3px' }}>Riesgos Detectados</div>
                        {report.detectedRisks.length > 0
                            ? report.detectedRisks.map((r, i) => <div key={i} style={{ color: '#fca5a5', marginLeft: '6px', fontSize: '9px' }}>• {r}</div>)
                            : <div style={{ color: '#475569', fontStyle: 'italic', fontSize: '9px' }}>Sin riesgos críticos</div>
                        }
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '3px' }}>Docs Recomendadas (no bloquean la compra)</div>
                        {report.missingDocumentation.length > 0
                            ? report.missingDocumentation.map((d, i) => <div key={i} style={{ color: '#fde68a', marginLeft: '6px', fontSize: '9px' }}>• {d}</div>)
                            : <div style={{ color: '#475569', fontStyle: 'italic', fontSize: '9px' }}>Expediente completo</div>
                        }
                    </div>
                </div>

                {/* Recomendaciones */}
                {report.recommendations.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#34d399', textTransform: 'uppercase', marginBottom: '3px' }}>Recomendaciones</div>
                        {report.recommendations.map((r, i) => <div key={i} style={{ color: '#a7f3d0', marginLeft: '6px', fontSize: '9px' }}>✓ {r}</div>)}
                    </div>
                )}

                {/* Normativas */}
                {report.normativeReferences && report.normativeReferences.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#c084fc', textTransform: 'uppercase', marginBottom: '3px' }}>Normativa Aplicable (España / UE)</div>
                        <div style={{ color: '#e9d5ff', fontSize: '9px' }}>{report.normativeReferences.join(' · ')}</div>
                    </div>
                )}

                {/* Dictamen final */}
                <div style={{ background: 'rgba(30,64,175,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}>Dictamen Final del Auditor</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 'bold' }}>{report.finalConclusion}</div>
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #334155', marginTop: '10px', paddingTop: '6px', color: '#475569', fontSize: '8px', textAlign: 'center' }}>
                    IndustrIA · Sistema Automatizado de Auditoría de Seguridad Alimentaria · Uso interno · Normativa España / UE
                </div>
            </div>

        </div>
    );
};

export default ReportSection;