import React, { useState, useCallback } from 'react';
import { extractContractDetails } from '../services/geminiService';
import { Expense, ProfileData } from '../types';
import { Spinner } from './Spinner';

interface ContractUploaderProps {
  onContractExtracted: (data: { expenses: Expense[], email: string | null, providerInfo: Omit<ProfileData, 'rib'> | null }) => void;
  setProcessingFile: (file: File | null) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onFileSelect: (file: File | null) => void;
}

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 text-gray-400">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

export const ContractUploader: React.FC<ContractUploaderProps> = ({ onContractExtracted, setProcessingFile, addNotification, onFileSelect }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      onFileSelect(null);
      return;
    }
    const file = files[0];
    onFileSelect(file);

    setIsProcessing(true);
    setProcessingFile(file);

    try {
        const { predefinedExpenses, recipientEmail, providerInfo } = await extractContractDetails(file);
        
        const newExpenses: Expense[] = predefinedExpenses.map(data => ({
            ...data,
            id: crypto.randomUUID(),
            file: file,
            date: new Date().toISOString().split('T')[0], // Use today's date for contract fees
        }));

        onContractExtracted({ expenses: newExpenses, email: recipientEmail, providerInfo });
        
    } catch (err) {
        const message = err instanceof Error ? err.message : "Une erreur est survenue lors de l'analyse du contrat.";
        addNotification(message, 'error');
        console.error(err);
    } finally {
        setIsProcessing(false);
        setProcessingFile(null);
    }
  }, [onContractExtracted, setProcessingFile, addNotification, onFileSelect]);
  
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

  return (
    <div>
      <label
        htmlFor="contract-upload"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`mt-2 flex justify-center rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <div className="text-center">
          <UploadIcon />
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <p className="pl-1">Glissez-déposez un fichier ou <span className="font-semibold text-blue-600">cliquez pour choisir</span></p>
          </div>
          <p className="text-xs leading-5 text-gray-500">PDF, PNG, JPG jusqu'à 10Mo</p>
          <input 
            id="contract-upload" 
            name="contract-upload" 
            type="file" 
            className="sr-only" 
            accept=".pdf,.png,.jpg,.jpeg" 
            onChange={(e) => handleFileChange(e.target.files)}
            disabled={isProcessing}
          />
        </div>
      </label>
      {isProcessing && (
        <div className="mt-4 flex items-center text-sm text-blue-600">
          <Spinner />
          <span className="ml-2">Analyse du contrat en cours...</span>
        </div>
      )}
    </div>
  );
};