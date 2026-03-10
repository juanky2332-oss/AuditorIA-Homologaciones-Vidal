import React, { useState, useRef, useCallback } from 'react';
import { AuditContext, FileData } from '../types';

// ── Importamos el worker con ?url (convenio Vite) — evita problemas de CORS y workers ──
// @ts-ignore
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/**
 * Extrae todo el texto de un PDF usando pdfjs-dist.
 * Carga la librería dinámicamente para mayor compatibilidad.
 */
const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) pageTexts.push(`[PÁGINA ${i}]\n${text}`);
  }

  return pageTexts.join('\n\n');
};

interface InputSectionProps {
  onAnalyze: (context: AuditContext) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading }) => {
  const [materialName, setMaterialName] = useState('');
  const [intendedUse, setIntendedUse] = useState('');
  const [technicalData, setTechnicalData] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const valid = Array.from(e.dataTransfer.files).filter(
        (f: File) => f.type === 'application/pdf' || f.type.startsWith('image/')
      );
      if (valid.length > 0) setFiles(prev => [...prev, ...valid]);
      else alert('Formato no soportado. Use PDF o Imagen.');
    }
  }, []);

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es más grande que el máximo
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Comprimir a JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            name: file.name,
            mimeType: 'image/jpeg',
            data: dataUrl.split(',')[1]
          });
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim() && files.length === 0) return;

    setIsParsing(true);
    const filesData: FileData[] = [];

    let totalEstimatedSize = 0;

    for (const file of files) {
      try {
        if (file.type === 'application/pdf') {
          setParseStatus(`Extrayendo texto de: ${file.name}...`);
          const text = await extractTextFromPdf(file);

          if (text && text.trim().length > 20) {
            const entry = { name: file.name, mimeType: 'text/plain', data: text };
            totalEstimatedSize += text.length;
            filesData.push(entry);
          } else {
            const entry = {
              name: file.name,
              mimeType: 'text/plain',
              data: `[DOCUMENTO: ${file.name}]\nEste PDF es un documento escaneado sin capa de texto. Analiza basándote en el nombre del archivo y los datos introducidos manualmente.`
            };
            totalEstimatedSize += entry.data.length;
            filesData.push(entry);
          }
        } else if (file.type.startsWith('image/')) {
          setParseStatus(`Comprimiendo imagen: ${file.name}...`);
          // Compresion agresiva para asegurar que pase por Vercel
          const fd = await compressImage(file, 1024, 0.6);
          totalEstimatedSize += fd.data.length;
          filesData.push(fd);
        }
      } catch (err) {
        console.error(`Error procesando ${file.name}:`, err);
        filesData.push({
          name: file.name,
          mimeType: 'text/plain',
          data: `[DOCUMENTO ADJUNTO: ${file.name}]\nError en extracción. Analizar vía nombre.`
        });
      }
    }

    // Vercel limit is 4.5MB. Base64 is ~33% larger than original.
    // 4.5MB / 1.33 = ~3.3MB limit for strings. Let's be safe at 3MB.
    const LIMIT = 3 * 1024 * 1024;
    if (totalEstimatedSize > LIMIT) {
      alert(`Los archivos son demasiado grandes (${(totalEstimatedSize / 1024 / 1024).toFixed(1)} MB). Por favor, sube menos archivos o imágenes más pequeñas.`);
      setIsParsing(false);
      setParseStatus('');
      return;
    }

    setIsParsing(false);
    setParseStatus('');

    onAnalyze({
      materialName: materialName.trim() || undefined,
      intendedUse: intendedUse || 'No especificado (analizar contexto)',
      technicalData: technicalData || '',
      filesData: filesData.length > 0 ? filesData : undefined
    });
  };

  const isButtonDisabled = (!materialName.trim() && files.length === 0) || isLoading || isParsing;

  return (
    <div className="glass-panel rounded-2xl p-1 animate-fade-in neon-border-focus transition-all duration-300">
      <div className="bg-slate-900/50 rounded-xl p-6 md:p-8">

        <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-3">
            <span className="text-blue-400 font-mono text-xl">01.</span>
            DATOS DE ENTRADA
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Material / Ref (Opcional si hay archivo)</label>
              <input
                type="text"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Ej. Banda Modular S-200"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Uso Previsto</label>
              <input
                type="text"
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Ej. Transporte de producto terminado"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
              Documentación (Ficha Técnica / Certificado)
            </label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 group ${isDragging
                ? 'border-blue-400 bg-blue-900/10'
                : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
                }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,image/*" className="hidden" multiple />
              <svg
                className={`w-10 h-10 mb-3 transition-transform duration-300 ${isDragging ? 'scale-110 text-blue-400' : 'text-slate-500 group-hover:text-blue-400'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-slate-300">Arrastre archivos PDF o Imágenes aquí</p>
              <p className="text-xs text-slate-500 mt-2 font-mono">o haga click para seleccionar</p>
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-1 gap-2 mt-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-blue-300">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={file.type === 'application/pdf' ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>
                        {file.type === 'application/pdf' ? 'PDF' : 'IMG'}
                      </span>
                      <span className="truncate">{file.name}</span>
                      <span className="text-slate-500">({(file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                      className="text-slate-500 hover:text-red-400 ml-4 font-bold px-2 py-1 rounded hover:bg-slate-700"
                    >
                      ELIMINAR
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Observaciones Técnicas Adicionales</label>
            <textarea
              value={technicalData}
              onChange={(e) => setTechnicalData(e.target.value)}
              rows={2}
              className="w-full bg-slate-800/50 border border-slate-600 rounded px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              placeholder="Detalles extra..."
            />
          </div>

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`w-full py-4 rounded-lg font-bold tracking-widest text-sm uppercase transition-all duration-300 shadow-lg ${isButtonDisabled
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
              : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/50 hover:shadow-blue-500/20'
              }`}
          >
            {isParsing ? `⏳ ${parseStatus || 'PROCESANDO DOCUMENTOS...'}` : 'INICIAR AUDITORÍA TÉCNICA'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputSection;