import { useState, useCallback, useRef } from 'react';
import { API_BASE, IS_DEMO } from '../lib/api';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { useCasesStore } from '../store/casesStore';

import { useAuthStore } from '../store/authStore';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<{ file: File; status: 'uploading' | 'success' | 'error' }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fetchCases, fetchKPIs } = useCasesStore();
  const { accessToken } = useAuthStore();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const newFiles = Array.from(e.dataTransfer.files).map(f => ({
      file: f,
      status: 'success' as const
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({
        file: f,
        status: 'success' as const
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const commitToRegistry = async () => {
    if (files.length === 0) return;
    if (IS_DEMO) {
      toast.info('Upload needs the backend. Run JudicAI locally to ingest your own CSV.');
      return;
    }
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', files[0].file);

    try {
      const response = await fetch(`${API_BASE}/cases/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      toast.success(`Successfully ingested ${data.count} records into the registry.`);
      setFiles([]);
      await fetchCases();
      await fetchKPIs();
    } catch (err: any) {
      toast.error(err.message || 'Intake failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col gap-2 border-b border-outline-variant/10 pb-8">
        <h1 className="text-5xl font-serif font-bold tracking-tight text-primary">Document Intake</h1>
        <p className="text-on-surface/40 font-sans font-medium uppercase tracking-[0.2em] text-[10px] font-black">
          Upload a CSV of case records; the Intake agent cleans and validates it
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Upload Zone */}
        <div className="space-y-8">
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              " judicial-card h-[450px] border-2 border-dashed flex flex-col items-center justify-center p-12 transition-all duration-500 group relative overflow-hidden cursor-pointer",
              isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-outline-variant/20 hover:border-primary/30"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept=".csv"
            />
            {isDragging && (
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            )}
            
            <div className="relative space-y-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-surface-container-low rounded-sm flex items-center justify-center group-hover:bg-primary transition-all duration-500 shadow-sm ring-1 ring-outline-variant/5">
                <Upload className="w-10 h-10 text-primary group-hover:text-secondary-fixed transition-colors" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-bold text-primary">Drop a CSV file</h3>
                <p className="text-sm font-sans text-on-surface/40 max-w-[280px] leading-relaxed">
                  <span className="font-bold text-primary">CSV</span> only, with the columns used in <span className="font-mono">data/supreme_court_100.csv</span>.
                </p>
              </div>
              
              <div className="pt-4">
                <button className="bg-primary text-secondary-fixed px-10 py-3 rounded-sm shadow-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#000050] transition-all">
                  Choose CSV
                </button>
              </div>
            </div>
            
          </div>

        </div>

        {/* Validation Feedback */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-serif text-2xl font-bold text-primary underline underline-offset-8 decoration-primary/10">Intake Queue</h3>
            <span className="text-[10px] font-sans font-black text-on-surface/30 uppercase tracking-widest">{files.length} Items Loaded</span>
          </div>
          
          <div className="space-y-4">
            {files.length === 0 ? (
              <div className="judicial-card p-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <FileSpreadsheet className="w-12 h-12 text-on-surface/20" />
                <p className="text-[11px] font-sans font-black uppercase tracking-widest text-on-surface/30">No documents in queue</p>
              </div>
            ) : (
              files.map((f, i) => (
                <div key={i} className="judicial-card p-5 flex items-center gap-5 group hover:bg-surface-container-low transition-colors">
                  <div className={clsx(
                    "w-12 h-12 flex items-center justify-center rounded-sm text-white bg-primary"
                  )}>
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-base font-bold text-primary truncate leading-tight group-hover:text-secondary transition-colors">{f.file.name}</h4>
                    <div className="flex items-center gap-3 text-[9px] font-sans font-black text-on-surface/40 uppercase tracking-tighter">
                      <span>{(f.file.size / 1024).toFixed(1)} KB</span>
                      <span className="text-on-surface/10">•</span>
                      <span className="text-primary/60">Validated & Ready</span>
                    </div>
                  </div>
                  
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                  
                  <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="p-1 hover:bg-surface-container-high rounded-sm transition-colors text-on-surface/20 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {files.length > 0 && (
            <div className="pt-4 animate-fade-in">
              <button 
                onClick={commitToRegistry}
                disabled={isUploading}
                className="bg-primary text-secondary-fixed w-full py-4 text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 rounded-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Committing Ingestion...
                  </>
                ) : (
                  <>
                    Commit to Registry
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
