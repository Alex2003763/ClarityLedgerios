
import React, { useState, useCallback, ChangeEvent, useEffect, DragEvent } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { OCRResult, recognizeImage, terminateWorker, enhanceOcrWithAI, AIExtractionResult } from '../../services/ocrService';
import { addTransaction } from '../../services/transactionService';
import { Transaction, TransactionType } from '../../types';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
// Input is not directly used for fields on this page anymore, but TransactionForm uses it.
// import Input from '../ui/Input'; 
import TransactionForm from '../transactions/TransactionForm';
import Modal from '../ui/Modal';

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-camera ${className || "w-8 h-8"}`}></i>
);
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-upload ${className || "w-5 h-5"}`}></i>
);
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-check-circle ${className || "w-5 h-5"}`}></i>
);
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.624L16.5 21.75l-.398-1.126a3.375 3.375 0 00-2.455-2.456L12.75 18l1.126-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.126a3.375 3.375 0 002.456 2.456L20.25 18l-1.126.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);
const WandMagicSparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
    </svg>
);

type OCRMethod = 'tesseract' | 'ai';

interface BillScanPageProps {
  onNavigateToTransactions: () => void;
}

const BillScanPage: React.FC<BillScanPageProps> = ({ onNavigateToTransactions }) => {
  const { t, language, selectedCurrencySymbol } = useAppContext();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [ocrMethod, setOcrMethod] = useState<OCRMethod>('tesseract');
  
  const [tesseractOcrResult, setTesseractOcrResult] = useState<OCRResult | null>(null);
  const [aiExtractionResult, setAiExtractionResult] = useState<AIExtractionResult | null>(null);
  
  const [isLoadingTesseract, setIsLoadingTesseract] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const [errorTesseract, setErrorTesseract] = useState<string | null>(null);
  const [errorAI, setErrorAI] = useState<string | null>(null);
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionInitialData, setTransactionInitialData] = useState<Partial<Omit<Transaction, 'id' | 'userId'>>>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    return () => {
      terminateWorker();
    };
  }, []);
  
  const resetStateForNewFile = () => {
    setTesseractOcrResult(null);
    setAiExtractionResult(null);
    setErrorTesseract(null);
    setErrorAI(null);
    setProgress(0);
    setStatus('');
  };

  const processFile = (file: File | null) => {
    resetStateForNewFile();
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      try {
        const objectURL = URL.createObjectURL(file);
        setPreviewUrl(objectURL);
      } catch (error) {
        console.error("Error creating object URL:", error);
        setErrorTesseract(t('billScanPage.errorOcrFailed', { message: `Could not create preview: ${(error as Error).message}` }));
        setSelectedImage(null); 
        setPreviewUrl(null);
      }
    } else {
      setSelectedImage(null);
      setPreviewUrl(null);
      if (file) { 
          setErrorTesseract(t('billScanPage.errorOcrFailed', { message: 'Invalid file type. Please upload an image.'}));
      }
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0] || null);
  };

  const handleDragEvents = (e: DragEvent<HTMLDivElement>, type: 'enter' | 'leave' | 'over' | 'drop') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'enter' || type === 'over') {
        setIsDraggingOver(true);
    } else if (type === 'leave') {
        setIsDraggingOver(false);
    } else if (type === 'drop') {
        setIsDraggingOver(false);
        const file = e.dataTransfer.files?.[0];
        processFile(file || null);
    }
  };

  const handleTesseractExtraction = useCallback(async () => {
    if (!selectedImage) {
      setErrorTesseract(t('billScanPage.errorNoImageSelected'));
      return;
    }
    setIsLoadingTesseract(true);
    setErrorTesseract(null);
    setErrorAI(null); // Clear previous AI errors if any
    setTesseractOcrResult(null);
    setAiExtractionResult(null); // Clear previous AI results
    setProgress(0);
    setStatus(t('billScanPage.statusInitializing'));

    try {
      // Language prop removed from recognizeImage call, OCR service handles combined languages
      const result = await recognizeImage(selectedImage, (p, s) => {
        setProgress(p);
        setStatus(s);
      });
      setTesseractOcrResult(result);
      setStatus(t('billScanPage.statusDone'));
    } catch (err) {
      console.error(err);
      setErrorTesseract(t('billScanPage.errorOcrFailed', { message: (err as Error).message || 'Unknown error' }));
      setStatus(t('billScanPage.statusError'));
    } finally {
      setIsLoadingTesseract(false);
    }
  }, [selectedImage, t]); // Language removed from dependencies as it's not directly used here

  const handleAiEnhanceAfterTesseract = async () => {
    if (!tesseractOcrResult?.text && !selectedImage) {
      setErrorAI(t('billScanPage.errorNoDataForAI'));
      return;
    }
    setIsLoadingAI(true);
    setErrorAI(null);
    setAiExtractionResult(null); // Clear previous AI results if re-enhancing

    try {
      // Pass Tesseract text and the original image for potentially better AI results
      const aiResult = await enhanceOcrWithAI(tesseractOcrResult?.text || "", selectedImage || undefined, language);
      if (aiResult.error) {
        setErrorAI(aiResult.error);
      } else {
        setAiExtractionResult(aiResult);
      }
    } catch (err) {
      console.error("AI Enhancement error:", err);
      setErrorAI(t('billScanPage.errorAIFailed', { message: (err as Error).message || 'Unknown error' }));
    } finally {
      setIsLoadingAI(false);
    }
  };
  
  const handleDirectAIExtraction = async () => {
    if (!selectedImage) {
      setErrorAI(t('billScanPage.errorNoImageSelected'));
      return;
    }
    setIsLoadingAI(true);
    setErrorAI(null);
    setErrorTesseract(null); // Clear previous Tesseract errors
    setAiExtractionResult(null);
    setTesseractOcrResult(null); // Clear Tesseract results as we are going direct to AI
    setStatus(t('billScanPage.aiProcessing'));


    try {
      // For direct AI OCR, rawOcrText can be empty or a placeholder if the model primarily uses the image.
      const aiResult = await enhanceOcrWithAI("", selectedImage, language); 
      if (aiResult.error) {
        setErrorAI(aiResult.error);
         setStatus(t('billScanPage.statusError'));
      } else {
        setAiExtractionResult(aiResult);
        setStatus(t('billScanPage.statusDone'));
      }
    } catch (err) {
      console.error("Direct AI OCR error:", err);
      setErrorAI(t('billScanPage.errorAIFailed', { message: (err as Error).message || 'Unknown error' }));
      setStatus(t('billScanPage.statusError'));
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleMainExtraction = () => {
    if (ocrMethod === 'tesseract') {
      handleTesseractExtraction();
    } else {
      handleDirectAIExtraction();
    }
  };
  
  const openTransactionModal = () => {
    let descriptionText = selectedImage?.name ? t('billScanPage.defaultDescription', {fileName: selectedImage.name}) : t('billScanPage.billSuffix');
    let amountVal: number | undefined = undefined;
    let dateVal: string | undefined = new Date().toISOString().split('T')[0];
    let categoryVal: string | undefined = '';
    
    // Prioritize AI results if available and no error
    if (aiExtractionResult && !aiExtractionResult.error) {
        if (aiExtractionResult.vendor) {
            descriptionText = `${aiExtractionResult.vendor} - ${t('billScanPage.billSuffix')}`;
        }
        amountVal = aiExtractionResult.amount ?? undefined;
        dateVal = aiExtractionResult.date ?? dateVal;
        categoryVal = aiExtractionResult.category ?? '';
    } 
    // Fallback to Tesseract results if AI failed or not used
    else if (tesseractOcrResult) {
        if (tesseractOcrResult.suggestedCategory) {
            descriptionText = `${tesseractOcrResult.suggestedCategory} ${t('billScanPage.billSuffix')} - ${selectedImage?.name || 'bill'}`;
        }
        amountVal = tesseractOcrResult.amount ?? undefined;
        dateVal = tesseractOcrResult.date ?? dateVal;
        categoryVal = tesseractOcrResult.suggestedCategory ?? '';
    }

    const initialTxData: Partial<Omit<Transaction, 'id' | 'userId'>> = {
      description: descriptionText,
      amount: amountVal,
      date: dateVal,
      category: categoryVal,
      type: TransactionType.EXPENSE,
    };
    setTransactionInitialData(initialTxData);
    setIsTransactionModalOpen(true);
  };

  const handleAddTransactionFromModal = useCallback((transactionData: Omit<Transaction, 'id' | 'userId'>) => {
    addTransaction(transactionData);
    setIsTransactionModalOpen(false);
    setSelectedImage(null);
    setPreviewUrl(null);
    resetStateForNewFile(); // Clear all results
    setStatus(t('billScanPage.transactionAddedSuccess')); 
  }, [t]);
  
  const isLoading = isLoadingTesseract || isLoadingAI;
  const currentError = errorAI || errorTesseract; // Prioritize AI error display


  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-primary-light flex items-center justify-center">
          <CameraIcon className="w-8 h-8 sm:w-10 sm:h-10 mr-3 text-primary dark:text-primary-light" />
          {t('billScanPage.title')}
        </h1>
        <p className="text-grayText mt-2">{t('billScanPage.description')}</p>
      </header>

      {currentError && (
        <div className="bg-red-100 dark:bg-red-900/[0.4] border border-red-300 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">{errorAI ? t('billScanPage.aiErrorTitle') : t('billScanPage.errorTitle')} </strong>
          <span className="block sm:inline">{currentError}</span>
        </div>
      )}
      {status === t('billScanPage.transactionAddedSuccess') && !currentError && (
        <div className="bg-green-100 dark:bg-green-900/[0.4] border border-green-300 dark:border-green-600 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">{t('billScanPage.successTitle')} </strong>
            <span className="block sm:inline">{status}</span>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <section className="fintrack-card">
          <h2 className="fintrack-section-title flex items-center">
            <UploadIcon className="mr-2 opacity-70" /> {t('billScanPage.uploadTitle')}
          </h2>
          {/* OCR Method Selection */}
           <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('billScanPage.extractionMethodTitle', {defaultValue: 'Extraction Method'})}
            </label>
            <div className="flex space-x-2 rounded-md p-1 bg-gray-100 dark:bg-slate-700">
                {(['tesseract', 'ai'] as OCRMethod[]).map(method => (
                    <Button
                        key={method}
                        onClick={() => setOcrMethod(method)}
                        variant={ocrMethod === method ? 'primary' : 'ghost'}
                        size="sm"
                        className={`w-full transition-all duration-200 ${ocrMethod === method ? 'shadow-md' : 'hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                        aria-pressed={ocrMethod === method}
                    >
                        {method === 'tesseract' ? t('billScanPage.methodStandardOCR', {defaultValue: 'Standard OCR'}) : t('billScanPage.methodAIOCR', {defaultValue: 'AI OCR'})}
                    </Button>
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {ocrMethod === 'tesseract' 
                    ? t('billScanPage.methodStandardOCRDescription', {defaultValue: 'Fast, local processing using Tesseract.js.'}) 
                    : t('billScanPage.methodAIOCRDescription', {defaultValue: 'Slower, cloud-based AI for higher accuracy. Requires API key.'})}
            </p>
          </div>

          <div 
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDraggingOver ? 'border-primary dark:border-primaryLight scale-105' : 'border-gray-300 dark:border-darkBorder'} border-dashed rounded-md transition-all duration-200`}
            onDragEnter={(e) => handleDragEvents(e, 'enter')}
            onDragOver={(e) => handleDragEvents(e, 'over')}
            onDragLeave={(e) => handleDragEvents(e, 'leave')}
            onDrop={(e) => handleDragEvents(e, 'drop')}
          >
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white dark:bg-darkSurface rounded-md font-medium text-primary dark:text-primaryLight hover:text-primaryDark dark:hover:text-sky-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:focus-within:ring-offset-darkSurface focus-within:ring-primary"
                >
                  <span>{t('billScanPage.uploadLabel')}</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                </label>
                <p className="pl-1">{t('billScanPage.dragAndDrop')}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('billScanPage.fileTypes')}</p>
            </div>
          </div>

          {previewUrl && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">{t('billScanPage.previewTitle')}</h3>
              <img src={previewUrl} alt={t('billScanPage.imagePreviewAlt')} className="rounded-lg shadow-md max-h-60 w-auto mx-auto border border-gray-200 dark:border-darkBorder" />
            </div>
          )}

          {selectedImage && (
            <Button
              onClick={handleMainExtraction}
              isLoading={isLoadingTesseract || isLoadingAI}
              disabled={isLoadingTesseract || isLoadingAI}
              variant="primary"
              className="w-full mt-6"
              leftIcon={(isLoadingTesseract || isLoadingAI) ? undefined : <CheckCircleIcon />}
            >
              {(isLoadingTesseract || isLoadingAI) 
                ? t('billScanPage.processingButton') 
                : (ocrMethod === 'ai' 
                    ? t('billScanPage.processButtonAI', {defaultValue: 'Extract with AI'}) 
                    : t('billScanPage.processButton'))
              }
            </Button>
          )}
        </section>

        <section className="fintrack-card">
            <h2 className="fintrack-section-title flex items-center">
                <SparklesIcon className="mr-2 opacity-70 text-accent dark:text-sky-400 w-5 h-5" />
                {t('billScanPage.resultsTitle')}
            </h2>
          {(isLoadingTesseract || isLoadingAI) && (
            <div className="text-center py-4">
              <Spinner size="lg" />
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                {isLoadingAI ? (status || t('billScanPage.aiProcessing')) : `${status} (${progress}%)`}
              </p>
              {isLoadingTesseract && <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
              </div>}
            </div>
          )}
          
          {!isLoadingTesseract && !isLoadingAI && (tesseractOcrResult || (aiExtractionResult && !aiExtractionResult.error)) && (
            <div className="space-y-4 animate-fadeIn">
              {/* AI Enhanced Results */}
              {aiExtractionResult && !aiExtractionResult.error && (
                <div className="p-4 border border-dashed border-primary dark:border-primaryLight rounded-lg bg-primary/5 dark:bg-primaryLight/10">
                  <h3 className="text-lg font-semibold text-primary dark:text-primaryLight mb-2 flex items-center">
                    <WandMagicSparklesIcon className="w-5 h-5 mr-2" />
                     {ocrMethod === 'ai' ? t('billScanPage.aiDirectResultsTitle', {defaultValue: 'AI OCR Results'}) : t('billScanPage.aiEnhancedResultsTitle')}
                  </h3>
                  <InfoItem label={t('billScanPage.extractedVendor')} value={aiExtractionResult.vendor} />
                  <InfoItem label={t('billScanPage.extractedAmount')} value={aiExtractionResult.amount} currency={aiExtractionResult.currency || selectedCurrencySymbol} />
                  <InfoItem label={t('billScanPage.extractedDate')} value={aiExtractionResult.date} />
                  <InfoItem label={t('billScanPage.suggestedCategory')} value={aiExtractionResult.category} highlight />
                  <InfoItem label={t('billScanPage.extractedCurrency')} value={aiExtractionResult.currency} />
                </div>
              )}
              
              {/* Tesseract OCR Results (shown if Tesseract was run and AI not, or AI failed after Tesseract) */}
              {tesseractOcrResult && (ocrMethod === 'tesseract' || (ocrMethod === 'ai' && errorAI)) && (!aiExtractionResult || aiExtractionResult.error) && (
                <div className={`${(aiExtractionResult?.error && ocrMethod === 'tesseract') ? 'mt-4 pt-4 border-t border-gray-200 dark:border-darkBorder' : ''}`}>
                  <h3 className="text-md font-medium text-lighttext dark:text-darktext mb-1">
                    { (aiExtractionResult?.error && ocrMethod === 'tesseract')
                      ? t('billScanPage.tesseractResultsFallbackTitle') 
                      : t('billScanPage.tesseractResultsTitle')
                    }
                  </h3>
                  <InfoItem label={t('billScanPage.extractedAmount')} value={tesseractOcrResult.amount} currency={selectedCurrencySymbol} />
                  <InfoItem label={t('billScanPage.extractedDate')} value={tesseractOcrResult.date} />
                  <InfoItem label={t('billScanPage.suggestedCategory')} value={tesseractOcrResult.suggestedCategory} highlight />
                </div>
              )}
              
              {/* Enhance with AI button (if Tesseract was run and AI hasn't been run successfully yet) */}
              {ocrMethod === 'tesseract' && tesseractOcrResult && (!aiExtractionResult || aiExtractionResult.error) && (
                <Button
                  onClick={handleAiEnhanceAfterTesseract}
                  isLoading={isLoadingAI}
                  disabled={isLoadingTesseract || isLoadingAI}
                  variant="secondary"
                  className="w-full mt-4"
                  leftIcon={<WandMagicSparklesIcon />}
                >
                  {t('billScanPage.enhanceWithAIButton', {defaultValue: 'Enhance with AI'})}
                </Button>
              )}

              <Button
                  onClick={openTransactionModal}
                  variant="primary"
                  className="w-full mt-4"
                  disabled={isLoadingTesseract || isLoadingAI || (!tesseractOcrResult && !aiExtractionResult)}
                >
                  {t('billScanPage.createTransactionButton')}
              </Button>
              
              {tesseractOcrResult?.text && (ocrMethod === 'tesseract' || (ocrMethod === 'ai' && errorAI && tesseractOcrResult)) && ( // Show Tesseract full text if it was run
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-darkBorder">
                      <h3 className="text-md font-medium text-lighttext dark:text-darktext mb-1">{t('billScanPage.fullText')}</h3>
                      <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-md max-h-60 overflow-auto custom-scrollbar whitespace-pre-wrap break-all">
                        {tesseractOcrResult.text || t('billScanPage.noTextExtracted')}
                      </pre>
                  </div>
              )}
               {aiExtractionResult?.rawResponse && (ocrMethod === 'ai' && !aiExtractionResult.error) && ( // Show AI raw response for direct AI
                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-darkBorder">
                        <h3 className="text-md font-medium text-lighttext dark:text-darktext mb-1">AI Raw Response:</h3>
                        <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-md max-h-60 overflow-auto custom-scrollbar whitespace-pre-wrap break-all">
                            {aiExtractionResult.rawResponse}
                        </pre>
                    </div>
                )}
            </div>
          )}
          {!isLoadingTesseract && !isLoadingAI && !tesseractOcrResult && !aiExtractionResult && !currentError && status !== t('billScanPage.transactionAddedSuccess') && (
            <p className="text-center text-grayText dark:text-gray-500 py-10">{t('billScanPage.noResultsYet')}</p>
          )}
        </section>
      </div>

      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={t('billScanPage.transactionModalTitle')}
        size="md"
      >
        <TransactionForm 
          onSubmit={handleAddTransactionFromModal} 
          initialData={transactionInitialData}
        />
      </Modal>
    </div>
  );
};

interface InfoItemProps {
    label: string;
    value?: string | number | null;
    currency?: string;
    highlight?: boolean;
}
const InfoItem: React.FC<InfoItemProps> = ({label, value, currency, highlight}) => {
    const { t } = useAppContext();
    const displayValue = value !== null && value !== undefined && String(value).trim() !== '' ? String(value) : t('billScanPage.notFound');
    const valueClass = (value === null || value === undefined || String(value).trim() === '')
        ? 'text-grayText italic'
        : (highlight ? 'text-primary dark:text-primaryLight font-semibold' : 'text-lighttext dark:text-darktext');

    return (
        <div className="mb-1.5">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label} </span>
            <span className={`text-sm ${valueClass}`}>
                {currency && (typeof value === 'number') ? `${currency}${value.toFixed(2)}` : displayValue}
            </span>
        </div>
    );
}

export default BillScanPage;
