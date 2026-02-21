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
        // jsPDF está incluido en la librería html2pdf que se carga en index.html
        // @ts-ignore
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) {
            // Fallback: intentar con window.jsPDF directo
            // @ts-ignore
            if (!window.jsPDF) {
                alert("Error: librería PDF no disponible. Refresque la página.");
                return;
            }
        }

        // @ts-ignore
        const doc = new (jsPDF || window.jsPDF)({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        const filename = `Auditoria_${(materialName || 'Material').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        const pageW = 210;
        const marginL = 12;
        const marginR = 12;
        const usableW = pageW - marginL - marginR;
        let y = 15;

        const addLine = (text: string, size = 10, bold = false, color: [number, number, number] = [30, 30, 30]) => {
            doc.setFontSize(size);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setTextColor(...color);
            const lines = doc.splitTextToSize(text, usableW);
            lines.forEach((line: string) => {
                if (y > 280) { doc.addPage(); y = 15; }
                doc.text(line, marginL, y);
                y += size * 0.45;
            });
            y += 2;
        };

        const addSectionHeader = (title: string, r: number, g: number, b: number) => {
            if (y > 270) { doc.addPage(); y = 15; }
            doc.setFillColor(r, g, b);
            doc.rect(marginL, y - 4, usableW, 7, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(title.toUpperCase(), marginL + 2, y);
            y += 7;
            doc.setTextColor(30, 30, 30);
        };

        const addDivider = () => {
            doc.setDrawColor(200, 200, 200);
            doc.line(marginL, y, pageW - marginR, y);
            y += 4;
        };

        // ── CABECERA ──
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 297, 'F');

        doc.setFillColor(30, 41, 59);
        doc.rect(marginL, y - 5, usableW, 22, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(241, 245, 249);
        doc.text('INFORME TECNICO DE AUDITORIA', marginL + 3, y + 3);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Material: ${materialName || 'S/N'}   |   Fecha: ${new Date().toLocaleDateString('es-ES')}   |   IndustrIA v3.2`, marginL + 3, y + 9);
        doc.text('Normativa aplicable: Reglamento CE 1935/2004 | UE 10/2011 | ISO 22000 | Solo Espana / UE', marginL + 3, y + 14);
        y += 25;

        // Score de homologación
        const scoreColor: [number, number, number] = report.homologationScore >= 80 ? [52, 211, 153] : report.homologationScore >= 60 ? [251, 191, 36] : [248, 113, 113];
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...scoreColor);
        doc.text(`${report.homologationScore}/100`, pageW - marginR - 25, 22);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(report.homologationStatus, pageW - marginR - 23, 28);

        // ── RESUMEN EN LENGUAJE LLANO ──
        if (report.plainLanguageSummary) {
            doc.setFillColor(30, 41, 59);
            doc.rect(marginL, y - 3, usableW, 3, 'F');
            addSectionHeader('Resumen para el responsable de compras', 30, 64, 175);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(220, 230, 240);
            const summaryLines = doc.splitTextToSize(report.plainLanguageSummary, usableW);
            summaryLines.forEach((l: string) => { doc.text(l, marginL, y); y += 5; });
            y += 4;
        }

        // ── VEREDICTOS ──
        addSectionHeader('Veredictos de Seguridad Alimentaria', 15, 23, 42);

        const verdictColors: Record<string, [number, number, number]> = {
            'APTO': [52, 211, 153],
            'APTO CONDICIONADO': [251, 191, 36],
            'NO APTO': [248, 113, 113],
            'NO APLICA': [148, 163, 184]
        };

        const dColor = verdictColors[report.directContactVerdict] || [148, 163, 184];
        const iColor = verdictColors[report.indirectContactVerdict] || [148, 163, 184];

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(148, 163, 184);
        doc.text('CONTACTO DIRECTO CON ALIMENTO:', marginL, y);
        doc.setTextColor(...dColor);
        doc.text(report.directContactVerdict, marginL + 70, y);
        y += 6;

        doc.setTextColor(148, 163, 184);
        doc.text('CONTACTO INDIRECTO (ENTORNO FABRICA):', marginL, y);
        doc.setTextColor(...iColor);
        doc.text(report.indirectContactVerdict, marginL + 70, y);
        y += 6;

        doc.setTextColor(148, 163, 184);
        doc.text('CLASIFICACION COMERCIAL:', marginL, y);
        doc.setTextColor(147, 197, 253);
        doc.text(`${report.productGama} (${report.productFamilyCode})`, marginL + 70, y);
        y += 8;

        // ── DOCUMENTACIÓN OBLIGATORIA (solo si CONDICIONADO) ──
        if (report.requiredDocumentation && report.requiredDocumentation.length > 0) {
            addSectionHeader('DOCUMENTACION OBLIGATORIA ANTES DE COMPRAR', 127, 29, 29);
            doc.setFontSize(9);
            report.requiredDocumentation.forEach((d) => {
                doc.setTextColor(252, 165, 165);
                const ls = doc.splitTextToSize(`• ${d}`, usableW - 4);
                ls.forEach((l: string) => { if (y > 280) { doc.addPage(); y = 15; } doc.text(l, marginL + 2, y); y += 5; });
            });
            y += 3;
        }

        // ── JUSTIFICACIÓN TÉCNICA ──
        addSectionHeader('Justificacion Tecnica', 30, 58, 138);
        doc.setFontSize(9);
        doc.setTextColor(200, 215, 235);
        const justLines = doc.splitTextToSize(report.technicalJustification, usableW - 4);
        justLines.forEach((l: string) => { if (y > 280) { doc.addPage(); y = 15; } doc.text(l, marginL + 2, y); y += 5; });
        y += 3;

        // ── RIESGOS ──
        if (report.detectedRisks && report.detectedRisks.length > 0) {
            addSectionHeader('Riesgos Detectados', 127, 29, 29);
            doc.setFontSize(9);
            report.detectedRisks.forEach((r) => {
                doc.setTextColor(252, 165, 165);
                const ls = doc.splitTextToSize(`• ${r}`, usableW - 4);
                ls.forEach((l: string) => { if (y > 280) { doc.addPage(); y = 15; } doc.text(l, marginL + 2, y); y += 5; });
            });
            y += 3;
        }

        // ── DOCS RECOMENDADAS ──
        if (report.missingDocumentation && report.missingDocumentation.length > 0) {
            addSectionHeader('Documentacion Recomendada para el Expediente', 120, 80, 0);
            doc.setFontSize(9);
            report.missingDocumentation.forEach((d) => {
                doc.setTextColor(253, 230, 138);
                const ls = doc.splitTextToSize(`• ${d}`, usableW - 4);
                ls.forEach((l: string) => { if (y > 280) { doc.addPage(); y = 15; } doc.text(l, marginL + 2, y); y += 5; });
            });
            y += 3;
        }

        // ── RECOMENDACIONES ──
        if (report.recommendations && report.recommendations.length > 0) {
            addSectionHeader('Recomendaciones', 6, 78, 59);
            doc.setFontSize(9);
            report.recommendations.forEach((r) => {
                doc.setTextColor(167, 243, 208);
                const ls = doc.splitTextToSize(`✓ ${r}`, usableW - 4);
                ls.forEach((l: string) => { if (y > 280) { doc.addPage(); y = 15; } doc.text(l, marginL + 2, y); y += 5; });
            });
            y += 3;
        }

        // ── NORMATIVAS ──
        if (report.normativeReferences && report.normativeReferences.length > 0) {
            addSectionHeader('Normativa Aplicable (Espana / UE)', 64, 30, 138);
            doc.setFontSize(9);
            doc.setTextColor(216, 180, 254);
            const normText = report.normativeReferences.join('  ·  ');
            const normLines = doc.splitTextToSize(normText, usableW - 4);
            normLines.forEach((l: string) => { if (y > 280) { doc.addPage(); y = 15; } doc.text(l, marginL + 2, y); y += 5; });
            y += 3;
        }

        // ── DICTAMEN FINAL ──
        addSectionHeader('Dictamen Final del Auditor', 23, 37, 84);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(241, 245, 249);
        const finalLines = doc.splitTextToSize(report.finalConclusion, usableW - 4);
        finalLines.forEach((l: string) => { if (y > 280) { doc.addPage(); y = 15; } doc.text(l, marginL + 2, y); y += 6; });

        // ── FOOTER ──
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('IndustrIA · Sistema de Auditoria de Seguridad Alimentaria · Uso interno · Normativa Espana / UE', marginL, 290);
            doc.text(`Pagina ${i} de ${totalPages}`, pageW - marginR - 20, 290);
        }

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