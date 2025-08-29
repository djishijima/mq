import React, { useState, useCallback, useRef, useEffect } from 'react';
import { extractInvoiceDetails, InvoiceData } from '../services/geminiService';
import { Upload, Loader, ScanLine, X, CheckCircle } from './Icons';

type FileStatus = 'pending' | 'loading' | 'done' | 'error';
interface OCRFile {
    file: File;
    preview: string;
    status: FileStatus;
    data: InvoiceData | null;
    error: string | null;
}

interface InvoiceOCRProps {
    onSaveExpenses: (data: InvoiceData) => void;
    isDemoMode: boolean;
}

const EditableInvoiceForm: React.FC<{
    data: InvoiceData;
    index: number;
    onDataChange: (index: number, field: keyof InvoiceData, value: string | number) => void;
}> = ({ data, index, onDataChange }) => {
    const vendorInputRef = useRef<HTMLInputElement>(null);
    const inputClass = "w-full bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md border border-slate-300 dark:border-slate-600";

    useEffect(() => {
        // Automatically focus the first input when the form is rendered
        vendorInputRef.current?.focus();
    }, []);

    return (
        <div className="space-y-3">
            <input
                ref={vendorInputRef}
                type="text"
                value={data.vendorName}
                onChange={(e) => onDataChange(index, 'vendorName', e.target.value)}
                placeholder="発行元"
                className={inputClass}
            />
            <input
                type="date"
                value={data.invoiceDate}
                onChange={(e) => onDataChange(index, 'invoiceDate', e.target.value)}
                placeholder="発行日"
                className={inputClass}
            />
            <input
                type="number"
                value={data.totalAmount}
                onChange={(e) => onDataChange(index, 'totalAmount', parseFloat(e.target.value) || 0)}
                placeholder="合計金額"
                className={inputClass}
            />
            <textarea
                value={data.description}
                onChange={(e) => onDataChange(index, 'description', e.target.value)}
                placeholder="内容"
                rows={2}
                className={inputClass}
            ></textarea>
        </div>
    );
};


const InvoiceOCR: React.FC<InvoiceOCRProps> = ({ onSaveExpenses, isDemoMode }) => {
  const [files, setFiles] = useState<OCRFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      const newFiles: OCRFile[] = Array.from(selectedFiles).map(file => {
        if (acceptedTypes.includes(file.type)) {
          return {
            file,
            preview: URL.createObjectURL(file),
            status: 'pending',
            data: null,
            error: null,
          };
        }
        return {
          file,
          preview: URL.createObjectURL(file),
          status: 'error',
          data: null,
          error: '非対応のファイル形式です。PNG, JPG, WEBP形式のみがサポートされています。',
        };
      });
      setFiles(newFiles);
    }
  };

  const analyzeFile = useCallback(async (ocrFile: OCRFile, index: number): Promise<void> => {
    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                } else {
                    reject(new Error("File reading failed"));
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };
    
    try {
        const base64String = await readFileAsBase64(ocrFile.file);
        const data = await extractInvoiceDetails(base64String, ocrFile.file.type);
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'done', data, error: null } : f));
    } catch (err: any) {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error', error: err.message || "Analysis failed" } : f));
    }
  }, []);

  const handleAnalyzeAll = async () => {
    setIsAnalyzing(true);
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'loading' } : f));
    await Promise.all(files.map((file, index) => {
        if(file.status === 'pending' || file.status === 'loading') {
            return analyzeFile(file, index);
        }
        return Promise.resolve();
    }));
    setIsAnalyzing(false);
  };
  
  const handleDataChange = (index: number, field: keyof InvoiceData, value: string | number) => {
      setFiles(prev => prev.map((f, i) => {
          if (i === index && f.data) {
              const newData = { ...f.data, [field]: value };
              return { ...f, data: newData };
          }
          return f;
      }));
  };

  const handleSaveAll = () => {
      const successfulExpenses = files.filter(f => f.status === 'done' && f.data);
      if(successfulExpenses.length === 0) {
          alert('保存できる経費データがありません。');
          return;
      }
      successfulExpenses.forEach(f => onSaveExpenses(f.data!));
      setFiles(prev => prev.filter(f => f.status !== 'done')); // Clear only saved files
  };
  
  const clearFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const StatusIndicator: React.FC<{status: FileStatus}> = ({status}) => {
      if (status === 'pending') return <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">保留中</span>;
      if (status === 'loading') return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      if (status === 'done') return <CheckCircle className="w-5 h-5 text-green-500" />;
      if (status === 'error') return <X className="w-5 h-5 text-red-500" />;
      return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-white">請求書OCRによる一括経費入力</h3>
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">請求書ファイル（複数選択可）</label>
        <div className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600 dark:text-slate-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>ファイルを選択</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" multiple />
                    </label>
                    <p className="pl-1">またはドラッグ＆ドロップ</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, WEBP</p>
            </div>
        </div>
      </div>
      
      {files.length > 0 && (
        <div>
            <div className="flex justify-end gap-4 mb-4">
                <button onClick={handleAnalyzeAll} disabled={isAnalyzing || files.every(f => f.status !== 'pending') || isDemoMode}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                  <ScanLine className="w-5 h-5"/>
                  <span>すべて解析</span>
                </button>
                <button onClick={handleSaveAll} disabled={isAnalyzing || files.every(f => f.status !== 'done') || isDemoMode}
                   className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                  <CheckCircle className="w-5 h-5"/>
                   <span>完了分をすべて保存</span>
                </button>
            </div>

            <div className="space-y-6">
            {files.map((ocrFile, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="relative">
                  <img src={ocrFile.preview} alt={`Preview ${index}`} className="w-full h-auto max-h-64 object-contain rounded-md" />
                  <button onClick={() => clearFile(index)} className="absolute top-2 right-2 p-1.5 bg-white/70 backdrop-blur-sm rounded-full text-slate-800 hover:bg-white shadow-lg">
                    <X className="w-4 h-4"/>
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-slate-800 dark:text-white">抽出結果 #{index + 1}</h4>
                    <StatusIndicator status={ocrFile.status} />
                  </div>
                   {ocrFile.error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/40 p-2 rounded-md">{ocrFile.error}</p>}
                   {ocrFile.data && (
                       <EditableInvoiceForm 
                         data={ocrFile.data}
                         index={index}
                         onDataChange={handleDataChange}
                       />
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceOCR;