import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ReportSection from './components/ReportSection';
import { AuditContext, FoodSafetyAuditReport } from './types';
import { generateAuditReport } from './services/geminiService';

const App: React.FC = () => {
  const [auditReport, setAuditReport] = useState<FoodSafetyAuditReport | null>(null);
  const [context, setContext] = useState<AuditContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Scanning State
  const [scanProgress, setScanProgress] = useState(0);
  const [scanText, setScanText] = useState("INICIANDO...");

  // Progress Bar Simulation Logic
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setScanProgress(0);
      const steps = [
        "PROCESANDO DOCUMENTOS...",
        "ANALIZANDO TEXTO TÉCNICO...",
        "CLASIFICANDO FAMILIA DE PRODUCTO...",
        "VERIFICANDO NORMATIVA VIGENTE...",
        "CALCULANDO SCORE DE HOMOLOGACIÓN...",
        "VALIDANDO COMPATIBILIDAD...",
        "GENERANDO INFORME TÉCNICO..."
      ];

      let stepIndex = 0;
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 90) return prev; // Hold at 90% until API finishes
          return prev + 1; // Slow increment
        });

        // Update text based on progress roughly
        if (scanProgress % 20 === 0) {
          setScanText(steps[stepIndex % steps.length]);
          stepIndex++;
        }
      }, 50);
    } else {
      setScanProgress(100);
    }
    return () => clearInterval(interval);
  }, [isLoading, scanProgress]);

  const handleAnalyze = async (ctx: AuditContext) => {
    setIsLoading(true);
    setContext(ctx);
    setAuditReport(null);

    try {
      const report = await generateAuditReport(ctx);
      setAuditReport(report);
    } catch (err: any) {
      alert("Error en el servicio de auditoría: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center relative">

        {!auditReport && !isLoading && (
          <div className="text-center max-w-4xl mb-12 space-y-4 animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              Validación Técnica & Seguridad Alimentaria
            </h2>
            <p className="text-slate-400 text-lg font-light max-w-2xl mx-auto">
              Auditoría experta de materiales según ISO 22000, IFS, BRC y Reg. 1935/2004.
            </p>
          </div>
        )}

        {/* Input Form */}
        {!auditReport && !isLoading && (
          <div className="w-full max-w-3xl">
            <InputSection onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>
        )}

        {/* Loading / Scanning State */}
        {isLoading && (
          <div className="w-full max-w-2xl mt-8 animate-fade-in">
            <div className="flex justify-between text-xs font-mono text-blue-400 mb-2">
              <span className="animate-pulse">{scanText}</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden border border-slate-700">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-300 shadow-[0_0_10px_#3b82f6]"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && auditReport && context && (
          <div className="w-full mt-8 animate-fade-in">
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setAuditReport(null)}
                className="text-slate-400 hover:text-white text-xs font-mono border border-slate-700 px-6 py-2 rounded hover:border-blue-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                NUEVA CONSULTA
              </button>
            </div>
            <ReportSection report={auditReport} materialName={context.materialName} />
          </div>
        )}

      </main>

      <footer className="text-center py-6 text-slate-600 text-[10px] font-mono border-t border-slate-800/50 mt-auto">
        <p>IndustrIA SYSTEM v3.0 // SECURE AUDIT PROTOCOL</p>
      </footer>
    </div>
  );
};

export default App;