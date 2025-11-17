import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Expense, RibData, ReportType, Notification as NotificationType, ProfileData } from './types';
import { ExpenseUploader } from './components/ExpenseUploader';
import { RibManager } from './components/RibManager';
import { ExpenseList } from './components/ExpenseList';
import { ActionPanel } from './components/ActionPanel';
import { generateExpenseReport } from './utils/pdfGenerator';
import { Notification } from './components/Notification';
import { ProfileManager } from './components/ProfileManager';
import { ContractUploader } from './components/ContractUploader';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profileInfo, setProfileInfo] = useState<Omit<ProfileData, 'rib'> | null>(null);
  const [ribData, setRibData] = useState<RibData | null>(null);
  const [processingFiles, setProcessingFiles] = useState<File[]>([]);
  const [processingContract, setProcessingContract] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [ribFile, setRibFile] = useState<File | null>(null);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [rememberMe, setRememberMe] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile: ProfileData = JSON.parse(savedProfile);
      const { rib, ...info } = parsedProfile;
      setProfileInfo(info);
      if (rib) {
        setRibData(rib);
      }
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (rememberMe && profileInfo) {
      const { title, lastName, firstName, rpps, email } = profileInfo;
      const isProfileInfoValid = title && lastName && firstName && rpps && email;
      if (isProfileInfoValid) {
        const profileToSave = { ...profileInfo, rib: ribData };
        localStorage.setItem('userProfile', JSON.stringify(profileToSave));
      }
    } else if (!rememberMe) {
      localStorage.removeItem('userProfile');
    }
  }, [profileInfo, ribData, rememberMe]);

  const addNotification = useCallback((message: string, type: NotificationType['type']) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addExpenses = (newExpenses: Expense[]) => {
    setExpenses(prev => [...prev, ...newExpenses]);
    if (newExpenses.length === 1) {
      addNotification('1 justificatif ajouté avec succès !', 'success');
    } else if (newExpenses.length > 1) {
      addNotification(`${newExpenses.length} justificatifs ajoutés avec succès !`, 'success');
    }
  };

  const handleContractExtracted = (data: { expenses: Expense[], email: string | null, providerInfo: Omit<ProfileData, 'rib'> | null }) => {
    let infoFound = false;

    if (data.expenses.length > 0) {
        addExpenses(data.expenses);
        infoFound = true;
    }
    if (data.email) {
        setRecipientEmail(data.email);
        addNotification(`Email du destinataire trouvé : ${data.email}`, 'info');
        infoFound = true;
    }
    if (data.providerInfo) {
        const hasRealData = Object.values(data.providerInfo).some(v => !!v);
        if (hasRealData) {
            setProfileInfo(prev => ({
                title: prev?.title || data.providerInfo?.title || 'Dr.',
                lastName: prev?.lastName || data.providerInfo?.lastName || '',
                firstName: prev?.firstName || data.providerInfo?.firstName || '',
                rpps: prev?.rpps || data.providerInfo?.rpps || '',
                email: prev?.email || data.providerInfo?.email || '',
            }));
            addNotification('Votre profil a été pré-rempli avec les informations du contrat.', 'info');
            infoFound = true;
        }
    }

    if(!infoFound) {
        addNotification("Aucune information exploitable trouvée dans le contrat.", 'info');
    }
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateExpenseCategory = (id: string, category: string) => {
    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, type: category } : e))
    );
  };

  const handleProfileInfoChange = useCallback((data: Omit<ProfileData, 'rib'> | null) => {
    setProfileInfo(data);
  }, []);

  const handleRibChange = useCallback((data: RibData | null) => {
    setRibData(data);
  }, []);

  const handleGenerateReport = useCallback(async (reportType: ReportType, finalRecipientEmail: string) => {
    if (!profileInfo || !ribData) {
      console.error("Attempted to generate report with incomplete data.");
      return;
    }
    const fullProfile = { ...profileInfo, rib: ribData };
    await generateExpenseReport(expenses, ribData, fullProfile, reportType, finalRecipientEmail, contractFile, ribFile);
    addNotification('Document généré avec succès !', 'success');
  }, [expenses, profileInfo, ribData, addNotification, contractFile, ribFile]);
  
  const handleGenerateAttempt = useCallback(() => {
    const missingParts: string[] = [];
    
    const isProfileComplete = !!(profileInfo?.title && profileInfo?.lastName && profileInfo?.firstName && profileInfo?.rpps && profileInfo?.email);
    const isRibComplete = !!(ribData?.iban && ribData?.bic);
    
    if (!isProfileComplete) {
      missingParts.push("votre profil");
    }
    if (expenses.length === 0) {
      missingParts.push("au moins un justificatif");
    }
    if (!isRibComplete) {
      missingParts.push("vos informations bancaires (RIB)");
    }

    if (missingParts.length > 0) {
      let message = "Veuillez compléter : ";
      if (missingParts.length === 1) {
          message += missingParts[0];
      } else if (missingParts.length === 2) {
          message += `${missingParts[0]} et ${missingParts[1]}`;
      } else {
          message += `${missingParts.slice(0, -1).join(', ')}, et ${missingParts.slice(-1)}`;
      }
      message += " pour générer le document.";
      addNotification(message, 'info');
    }
  }, [profileInfo, ribData, expenses, addNotification]);

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const isProfileComplete = !!(profileInfo?.title && profileInfo?.lastName && profileInfo?.firstName && profileInfo?.rpps && profileInfo?.email);
  const isRibComplete = !!(ribData?.iban && ribData?.bic);
  const hasExpenses = expenses.length > 0;
  const isReady = hasExpenses && isProfileComplete && isRibComplete;


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
       <div aria-live="assertive" className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50">
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {notifications.map(notification => (
            <Notification 
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      </div>
      
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="space-y-8">
            <section id="contrat" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Étape 1 : Ajoutez le contrat (Optionnel)</h2>
              <p className="text-gray-500 mb-6">Commencez par uploader le contrat de prestation. L'IA pré-remplira votre profil, ajoutera les frais d'expertise et trouvera l'email du destinataire.</p>
              <ContractUploader 
                onContractExtracted={handleContractExtracted}
                setProcessingFile={setProcessingContract} 
                addNotification={addNotification} 
                onFileSelect={setContractFile}
              />
            </section>

            <section id="profil" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Étape 2 : Votre Profil</h2>
                <p className="text-gray-500 mb-6">Vérifiez ou complétez les informations de votre profil. Celles-ci seront utilisées pour générer l'en-tête de vos documents.</p>
                <ProfileManager 
                  onProfileChange={handleProfileInfoChange} 
                  initialData={profileInfo}
                  rememberMe={rememberMe}
                  onRememberMeChange={setRememberMe}
                  addNotification={addNotification}
                />
            </section>
        
          <section id="justificatifs" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Étape 3 : Ajoutez vos justificatifs</h2>
            <p className="text-gray-500 mb-6">Uploadez vos tickets, factures ou reçus (PDF, PNG, JPEG). L'IA extraira les informations automatiquement.</p>
            <ExpenseUploader onExpensesExtracted={addExpenses} setProcessingFiles={setProcessingFiles} addNotification={addNotification} />
          </section>

          <section id="rib" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 scroll-mt-24">
             <h2 className="text-2xl font-bold text-gray-700 mb-4">Étape 4 : Renseignez votre RIB</h2>
             <p className="text-gray-500 mb-6">Saisissez votre IBAN et BIC pour le remboursement. Ils seront mémorisés avec votre profil.</p>
            <RibManager 
              onRibChange={handleRibChange} 
              initialData={ribData}
              addNotification={addNotification}
              onFileSelect={setRibFile}
            />
          </section>

          <section id="recapitulatif" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Récapitulatif</h2>
            <ExpenseList 
              expenses={expenses} 
              onRemove={removeExpense} 
              processingFiles={processingFiles}
              onUpdateCategory={updateExpenseCategory} 
            />
          </section>
        </div>
      </main>
      
      <ActionPanel 
        totalAmount={totalAmount} 
        onGenerate={handleGenerateReport} 
        isReady={isReady}
        onAttemptGenerate={handleGenerateAttempt}
        initialEmail={recipientEmail}
      />
    </div>
  );
};

export default App;
