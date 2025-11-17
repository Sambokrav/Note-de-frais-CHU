import { Expense, RibData, ReportType, ProfileData } from '../types';

declare const jspdf: any;
declare const pdfjsLib: any;

export const generateExpenseReport = async (
  expenses: Expense[], 
  ribData: RibData, 
  profileData: ProfileData,
  reportType: ReportType, 
  recipientEmail: string,
  contractFile: File | null,
  ribFile: File | null
) => {
  // Setup pdf.js worker to render PDFs
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  const { jsPDF } = jspdf;
  const doc = new jsPDF();

  const title = reportType === 'frais' ? 'Note de Frais' : 'Note de Débit';
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2);
  const generationDate = new Date().toLocaleDateString('fr-FR');

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 52, 96); // Medical Blue
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Date de génération : ${generationDate}`, 14, 30);
  
  // Doctor Info
  doc.setFontSize(11);
  doc.text(`${profileData.title} ${profileData.firstName} ${profileData.lastName}`, 14, 45);
  doc.setFontSize(10);
  doc.text(`RPPS : ${profileData.rpps}`, 14, 51);
  doc.text(`Email : ${profileData.email}`, 14, 57);

  // Recipient email
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("À l'attention de :", 145, 45);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 52, 96);
  doc.text(recipientEmail, 145, 51);
  doc.setTextColor(100);


  // Expense Table
  const tableColumn = ["Date", "Type de dépense", "Montant (€)"];
  const tableRows: (string | number)[][] = [];

  expenses.forEach(expense => {
    const expenseData = [
      new Date(expense.date).toLocaleDateString('fr-FR'),
      expense.type,
      expense.amount.toFixed(2),
    ];
    tableRows.push(expenseData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 68,
    theme: 'grid',
    headStyles: { fillColor: [40, 52, 96] },
    didDrawPage: (data: any) => {
      // Total
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total à rembourser : ${totalAmount} €`, 14, data.cursor.y + 15);
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY || 80;

  // RIB information
  doc.setFontSize(12);
  doc.setTextColor(40, 52, 96);
  doc.text("Coordonnées bancaires pour le remboursement", 14, finalY + 30);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`IBAN : ${ribData.iban}`, 14, finalY + 38);
  doc.text(`BIC : ${ribData.bic}`, 14, finalY + 43);

  // Add receipts/proofs as new pages
  const addFileToPdf = async (file: File, titlePrefix: string) => {
    if (file.type.startsWith('image/')) {
        return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                doc.addPage();
                doc.setFontSize(12);
                doc.text(`${titlePrefix} : ${file.name}`, 14, 15);
                const imgData = event.target?.result as string;
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth() - 28;
                const pdfHeight = doc.internal.pageSize.getHeight() - 28;
                const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
                const imgWidth = imgProps.width * ratio;
                const imgHeight = imgProps.height * ratio;
                doc.addImage(imgData, file.type.split('/')[1].toUpperCase(), 14, 25, imgWidth, imgHeight);
                resolve();
            };
            reader.readAsDataURL(file);
        });
    } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Use higher scale for better quality
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                doc.addPage();
                doc.setFontSize(12);
                doc.text(`${titlePrefix} : ${file.name} (Page ${i}/${pdf.numPages})`, 14, 15);
                const imgData = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG with quality setting
                
                const pdfWidth = doc.internal.pageSize.getWidth() - 28;
                const pdfHeight = doc.internal.pageSize.getHeight() - 28;
                const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
                const imgWidth = canvas.width * ratio;
                const imgHeight = canvas.height * ratio;
                doc.addImage(imgData, 'JPEG', 14, 25, imgWidth, imgHeight);
            }
        }
    }
  };

  const processFiles = async () => {
    const expenseFiles = expenses
      .map(e => e.file)
      .filter(file => {
          // Filter out the contract file if it's present in expenses
          if (!contractFile) return true;
          return !(file.name === contractFile.name && file.size === contractFile.size && file.lastModified === contractFile.lastModified);
      });
      
    const uniqueExpenseFiles = Array.from(new Set(expenseFiles));

    if (uniqueExpenseFiles.length > 0) {
        doc.addPage();
        doc.setFontSize(22);
        doc.setTextColor(40, 52, 96);
        doc.text("Justificatifs", 14, 22);

        for (const file of uniqueExpenseFiles) {
            await addFileToPdf(file, "Justificatif");
        }
    }

    if (contractFile) {
        doc.addPage();
        doc.setFontSize(22);
        doc.setTextColor(40, 52, 96);
        doc.text("Annexe : Contrat de Prestation", 14, 22);
        await addFileToPdf(contractFile, "Contrat");
    }

    if (ribFile) {
        doc.addPage();
        doc.setFontSize(22);
        doc.setTextColor(40, 52, 96);
        doc.text("Annexe : Relevé d'Identité Bancaire", 14, 22);
        await addFileToPdf(ribFile, "RIB");
    } else if (ribData && ribData.iban && ribData.bic) {
        doc.addPage();
        doc.setFontSize(22);
        doc.setTextColor(40, 52, 96);
        doc.text("Annexe : Relevé d'Identité Bancaire", 14, 22);
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("Coordonnées bancaires fournies :", 14, 40);
        doc.text(`IBAN : ${ribData.iban}`, 14, 48);
        doc.text(`BIC : ${ribData.bic}`, 14, 56);
    }

    doc.save(`${title.replace(' ', '_')}_${generationDate}.pdf`);
  };

  await processFiles();
};
