import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RibData } from '../types';
import { extractRibDetails } from '../services/geminiService';
import { Spinner } from './Spinner';

interface RibManagerProps {
  onRibChange: (data: RibData | null) => void;
  initialData: RibData | null;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onFileSelect: (file: File | null) => void;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-10 w-10 text-gray-400">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  );

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
        <circle cx="12" cy="13" r="3"></circle>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
        <path d="M20 6 9 17l-5-5"></path>
    </svg>
);

export const RibManager: React.FC<RibManagerProps> = ({ onRibChange, initialData, addNotification, onFileSelect }) => {
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setIban(initialData.iban);
      setBic(initialData.bic);
    } else {
      // Clear fields if profile is cleared
      setIban('');
      setBic('');
    }
  }, [initialData]);

  useEffect(() => {
    const isValid = iban.trim().length > 14 && bic.trim().length > 7;
    if (isValid) {
      onRibChange({ iban, bic });
      if (!isSaved) {
        addNotification('RIB enregistré avec succès.', 'success');
      }
      setIsSaved(true);
    } else {
      onRibChange(null);
      setIsSaved(false);
    }
  }, [iban, bic, onRibChange, addNotification, isSaved]);

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    onFileSelect(file);

    setIsProcessing(true);
    setIban('');
    setBic('');
    
    try {
        const extractedData = await extractRibDetails(file);
        setIban(extractedData.iban.replace(/\s+/g, ''));
        setBic(extractedData.bic.replace(/\s+/g, ''));
        addNotification("IBAN et BIC extraits. Veuillez vérifier les informations.", 'info');
    } catch (err) {
        const message = err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
        addNotification(message, 'error');
        console.error(err);
        onFileSelect(null); // Clear the file if processing fails
    } finally {
        setIsProcessing(false);
    }
  }, [addNotification, onFileSelect]);
  
  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  }

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
  }

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files);
  }

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setIban(value);
    setIsSaved(false);
  };
  
  const handleBicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setBic(value);
    setIsSaved(false);
  };

  return (
    <div className="space-y-6">
        {/* Uploader section */}
        <div>
             <label
                htmlFor="rib-file-upload"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`mt-2 flex justify-center rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
              >
                <div className="text-center">
                  <UploadIcon />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                     <p className="pl-1">Glissez-déposez votre RIB ou <span className="font-semibold text-blue-600">cliquez pour choisir</span></p>
                  </div>
                  <p className="text-xs leading-5 text-gray-500">PDF, PNG, JPG</p>
                  <input 
                    id="rib-file-upload" 
                    name="rib-file-upload" 
                    type="file" 
                    className="sr-only" 
                    accept=".pdf,.png,.jpg,.jpeg" 
                    onChange={(e) => handleFileChange(e.target.files)}
                    disabled={isProcessing}
                  />
                </div>
              </label>

              <div className="my-4 flex items-center justify-center">
                 <div className="w-full border-t border-gray-200"></div>
                 <span className="flex-shrink-0 px-2 text-sm text-gray-500">OU</span>
                 <div className="w-full border-t border-gray-200"></div>
              </div>
              
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                <CameraIcon />
                Prendre une photo du RIB
              </button>
              <input 
                ref={photoInputRef}
                type="file" 
                className="sr-only" 
                accept="image/*" 
                capture="environment"
                onChange={(e) => handleFileChange(e.target.files)}
                disabled={isProcessing}
              />
        </div>
        
        {isProcessing && (
          <div className="flex items-center text-sm text-blue-600">
            <Spinner />
            <span className="ml-2">Analyse du RIB en cours...</span>
          </div>
        )}

        {/* Manual Input/Verification section */}
         <div className="relative pt-4">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
                <span className="bg-white px-3 text-base font-medium text-gray-700">Vérifiez ou saisissez vos informations</span>
            </div>
         </div>

        <div className="space-y-4 md:space-y-0 md:flex md:space-x-4">
          <div className="flex-1">
            <label htmlFor="iban" className="block text-sm font-medium leading-6 text-gray-900">
              IBAN
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="iban"
                id="iban"
                value={iban}
                onChange={handleIbanChange}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="FR76..."
                maxLength={34}
              />
            </div>
          </div>
          <div className="flex-1">
            <label htmlFor="bic" className="block text-sm font-medium leading-6 text-gray-900">
              BIC (SWIFT)
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="bic"
                id="bic"
                value={bic}
                onChange={handleBicChange}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="SOGEFRPP"
                maxLength={11}
              />
            </div>
          </div>
           {isSaved && (
            <div className="flex items-center justify-center md:pt-7">
                <CheckIcon />
                <span className="ml-2 text-sm text-green-600">Enregistré</span>
            </div>
           )}
        </div>
    </div>
  );
};