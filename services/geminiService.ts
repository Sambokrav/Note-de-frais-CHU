import { GoogleGenAI, Type } from "@google/genai";
import { Expense, RibData, ProfileData } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const expenseItemSchema = {
  type: Type.OBJECT,
  properties: {
    date: {
      type: Type.STRING,
      description: "La date de la dépense au format AAAA-MM-JJ. Si l'année n'est pas présente, utiliser l'année en cours.",
    },
    amount: {
      type: Type.NUMBER,
      description: "Le montant total de la dépense sous forme de nombre (par exemple, 12.50).",
    },
    type: {
      type: Type.STRING,
      description: "Le type de dépense (choisir parmi : 'Transport', 'Hébergement', 'Repas', 'Frais de conférence', 'Péage', 'Carburant', 'Parking', 'Frais d'expertise', 'Autre').",
    },
  },
  required: ["date", "amount", "type"],
};

const expensesSchema = {
    type: Type.OBJECT,
    properties: {
        expenses: {
            type: Type.ARRAY,
            items: expenseItemSchema
        }
    },
    required: ["expenses"]
};

const ribSchema = {
  type: Type.OBJECT,
  properties: {
    iban: {
      type: Type.STRING,
      description: "L'IBAN (International Bank Account Number) extrait du document. Nettoie la valeur en retirant tous les espaces ou tirets.",
    },
    bic: {
      type: Type.STRING,
      description: "Le BIC (Bank Identifier Code) ou code SWIFT extrait du document. Nettoie la valeur en retirant tous les espaces ou tirets.",
    },
  },
  required: ["iban", "bic"],
};

const contractSchema = {
    type: Type.OBJECT,
    properties: {
        predefinedExpenses: {
            type: Type.ARRAY,
            description: "Liste des frais fixes ou honoraires mentionnés dans le contrat.",
            items: {
                type: Type.OBJECT,
                properties: {
                    amount: {
                        type: Type.NUMBER,
                        description: "Le montant des frais ou honoraires."
                    },
                    type: {
                        type: Type.STRING,
                        description: "Description des frais (par exemple, 'Honoraires expertise', 'Forfait intervention'). S'il n'y a pas de description claire, utiliser 'Frais d'expertise'."
                    }
                },
                required: ["amount", "type"]
            }
        },
        recipientEmail: {
            type: Type.STRING,
            description: "L'adresse e-mail de contact pour la soumission des notes de frais."
        },
        providerInfo: {
            type: Type.OBJECT,
            description: "Informations sur le prestataire de services (le médecin).",
            properties: {
                title: { type: Type.STRING, description: "Titre du médecin (Dr. ou Pr.)." },
                lastName: { type: Type.STRING, description: "Nom de famille du médecin." },
                firstName: { type: Type.STRING, description: "Prénom du médecin." },
                rpps: { type: Type.STRING, description: "Numéro RPPS du médecin." },
                email: { type: Type.STRING, description: "Adresse e-mail professionnelle du médecin." }
            }
        }
    }
};

export const extractExpenseDetails = async (file: File): Promise<Omit<Expense, 'id' | 'file'>[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToBase64(file);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        },
        { text: "Extrait les informations de chaque justificatif de dépense distinct trouvé dans ce document. Un document PDF peut contenir plusieurs justificatifs sur différentes pages." },
      ],
    },
    config: {
      systemInstruction: "Tu es un système OCR intelligent spécialisé dans les reçus et factures français. Ta mission est d'extraire la date, le montant total et le type de dépense pour CHAQUE reçu distinct dans le document, et de renvoyer les informations sous la forme d'un objet JSON contenant une clé 'expenses' qui est un tableau d'objets.",
      responseMimeType: "application/json",
      responseSchema: expensesSchema,
    },
  });

  const text = response.text.trim();
  try {
    const parsedJson = JSON.parse(text);
    if (parsedJson && Array.isArray(parsedJson.expenses)) {
        return parsedJson.expenses as Omit<Expense, 'id' | 'file'>[];
    }
    console.warn("Gemini response did not contain a valid expenses array:", text);
    return [];
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", text);
    throw new Error("Impossible d'analyser les données du justificatif.");
  }
};

export const extractRibDetails = async (file: File): Promise<RibData> => {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
  
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await fileToBase64(file);
  
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          { text: "Extrait l'IBAN et le BIC de ce Relevé d'Identité Bancaire (RIB)." },
        ],
      },
      config: {
        systemInstruction: "Tu es un système OCR intelligent spécialisé dans les Relevés d'Identité Bancaire (RIB) français. Ta mission est d'extraire l'IBAN et le BIC d'une image ou d'un PDF et de renvoyer les informations dans un format JSON structuré. Assure-toi que les valeurs retournées ne contiennent aucun espace ou tiret.",
        responseMimeType: "application/json",
        responseSchema: ribSchema,
      },
    });
  
    const text = response.text.trim();
    try {
      const parsedJson = JSON.parse(text);
      if (!parsedJson.iban || !parsedJson.bic) {
          throw new Error("IBAN ou BIC non trouvé dans le document.");
      }
      return parsedJson as RibData;
    } catch (e) {
      console.error("Failed to parse JSON from Gemini for RIB:", text);
      throw new Error("Impossible d'analyser les données du RIB.");
    }
};

export const extractContractDetails = async (file: File): Promise<{ predefinedExpenses: {amount: number; type: string}[]; recipientEmail: string | null; providerInfo: Omit<ProfileData, 'rib'> | null }> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await fileToBase64(file);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data,
                    },
                },
                { text: "Lis ce contrat de prestation. Extrait les frais prévus pour le paiement de l'expertise (par exemple, 'honoraires', 'forfait journée') et leur montant. Trouve aussi l'adresse e-mail à laquelle envoyer la note de frais pour le remboursement. Enfin, extrais les informations du prestataire (le médecin) : son titre (Dr. ou Pr.), nom, prénom, numéro RPPS et son e-mail professionnel." },
            ],
        },
        config: {
            systemInstruction: "Tu es un assistant intelligent qui analyse des contrats de prestation pour des médecins. Ta mission est d'extraire les frais d'expertise fixes (honoraires, forfaits), l'e-mail du destinataire pour la note de frais, et les informations du prestataire (médecin). Si tu ne trouves pas une information, ne l'inclus pas dans le JSON. La réponse doit être un objet JSON.",
            responseMimeType: "application/json",
            responseSchema: contractSchema,
        },
    });

    const text = response.text.trim();
    try {
        const parsedJson = JSON.parse(text);
        return {
            predefinedExpenses: parsedJson.predefinedExpenses || [],
            recipientEmail: parsedJson.recipientEmail || null,
            providerInfo: parsedJson.providerInfo || null
        };
    } catch (e) {
        console.error("Failed to parse JSON from Gemini for contract:", text);
        throw new Error("Impossible d'analyser les données du contrat.");
    }
};