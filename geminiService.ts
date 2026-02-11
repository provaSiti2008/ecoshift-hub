
import { GoogleGenAI } from "@google/genai";
import { Trip, User } from "./types";
import { db } from "./db";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Genera un motivo di match basato su euristiche locali in caso di fallimento API.
 */
function getLocalFallbackReason(user: User, trip: Trip): string {
  const matchingSkills = user.skills.filter(s => trip.tutoringSubject?.toLowerCase().includes(s.toLowerCase()));
  const needsAssistance = user.accessibilityNeeds.length > 0 && trip.assistanceOffered;

  if (needsAssistance) {
    return `Questo viaggio supporta la Missione 5 del PNRR: il conducente offre l'assistenza specifica di cui hai bisogno per un tragitto inclusivo.`;
  }
  if (matchingSkills.length > 0 && trip.tutoringSubject) {
    return `Match perfetto per la Missione 4! Puoi ripassare ${trip.tutoringSubject} durante il tragitto, ottimizzando il tuo tempo di studio.`;
  }
  if (trip.tutoringSubject) {
    return `Interessante opportunità di Peer Tutoring (Missione 4) in ${trip.tutoringSubject} per ampliare le tue conoscenze durante lo spostamento.`;
  }
  return `Ottima scelta per la Missione 3: riduci le emissioni di CO2 e accumuli crediti per la tua mobilità sostenibile universitaria.`;
}

export async function getSmartMatchReasoning(user: User, trip: Trip): Promise<string> {
  // Check local cache first to avoid API calls
  const cached = db.getAICache(user.id, trip.id);
  if (cached) return cached;

  try {
    const prompt = `
      Agisci come un assistente di mobilità inclusiva. 
      Analizza questo match tra un utente e un viaggio:
      UTENTE: ${user.name}, Competenze: ${user.skills.join(', ')}, Bisogni: ${user.accessibilityNeeds.join(', ')}.
      VIAGGIO: Da ${trip.from} a ${trip.to}, Tutoring offerto in: ${trip.tutoringSubject || 'Nessuno'}, Assistenza disabili: ${trip.assistanceOffered ? 'Sì' : 'No'}.
      
      Spiega in una sola frase breve e incoraggiante perché questo viaggio è ideale per l'utente, citando i benefici PNRR (Missione 4: studio, Missione 5: inclusione).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const reason = response.text?.trim() || getLocalFallbackReason(user, trip);
    db.saveAICache(user.id, trip.id, reason);
    return reason;
  } catch (error: any) {
    console.warn("Gemini API Error (likely quota):", error.message);

    // Fallback logic for 429 Resource Exhausted
    const fallback = getLocalFallbackReason(user, trip);
    // We don't save fallback to cache to try AI again later, 
    // or we could save it to stop trying for this session. 
    // Let's save it to give the user a stable experience.
    db.saveAICache(user.id, trip.id, fallback);
    return fallback;
  }
}
