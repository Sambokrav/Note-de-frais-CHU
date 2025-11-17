import React, { useState, useEffect } from 'react';
import { ReportType } from '../types';

interface ActionPanelProps {
  totalAmount: number;
  onGenerate: (type: ReportType, recipientEmail: string) => void;
  isReady: boolean;
  onAttemptGenerate: () => void;
  initialEmail?: string;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

export const ActionPanel: React.FC<ActionPanelProps> = ({ totalAmount, onGenerate, isReady, onAttemptGenerate, initialEmail }) => {
  const [showModal, setShowModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  useEffect(() => {
    if (initialEmail) {
        setRecipientEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleGenerateClick = () => {
    if (isReady) {
      setShowModal(true);
    } else {
      onAttemptGenerate();
    }
  };

  const handleSelectReportType = (type: ReportType) => {
    if (recipientEmail.trim() === '' || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
        alert("Veuillez saisir une adresse e-mail valide pour le destinataire.");
        return;
    }
    onGenerate(type, recipientEmail);
    setShowModal(false);
    setRecipientEmail(''); // Clear after generation
  };

  const handleCancel = () => {
    setShowModal(false);
    // Don't clear email on cancel, user might just want to check something
  };

  return (
    <>
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <span className="text-lg font-medium text-gray-600">Total à rembourser :</span>
              <span className="ml-2 text-2xl font-bold text-blue-600">{totalAmount.toFixed(2)} €</span>
            </div>
            <button
              onClick={handleGenerateClick}
              className={`w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors ${
                isReady
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-300' // Keep it simple, logic is now on click
              }`}
            >
              <DownloadIcon />
              Générer le document
            </button>
          </div>
        </div>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-20 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Finaliser et Générer</h3>
            <div className="mt-4">
                <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700">Email du destinataire</label>
                <div className="mt-1">
                    <input
                      type="email"
                      name="recipient-email"
                      id="recipient-email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="contact@laboratoire.com"
                      required
                    />
                </div>
                <p className="mt-2 text-xs text-gray-500">Adresse à laquelle le document doit être envoyé.</p>
            </div>
            <div className="mt-6">
                <p className="text-sm font-medium text-gray-900">Choisir le type de document :</p>
                 <div className="mt-2 space-y-3">
                  <button
                    onClick={() => handleSelectReportType('frais')}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Note de Frais
                  </button>
                  <button
                    onClick={() => handleSelectReportType('debit')}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Note de Débit
                  </button>
                </div>
            </div>
             <div className="mt-5 text-right">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={handleCancel}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};