import type { APIContext } from "astro";
import OpenAI from "openai";

// --- Récupération des variables d’environnement ---
const ACCESS_TOKEN = import.meta.env.HF_TOKEN as string;
const BASE_URL = import.meta.env.HF_URL as string;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const POST = async ({ request }: APIContext): Promise<Response> => {
  try {
    // --- Lecture du corps JSON ---
    const messages: ChatMessage[] = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucun message fourni à l'API." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Initialisation du client OpenAI ---
    const client = new OpenAI({
      baseURL: BASE_URL,
      apiKey: ACCESS_TOKEN,
    });

    // --- Message système pour guider le modèle ---
    const SystemMessage: ChatMessage = {
      role: "system",
      content:
        "You are an SVG code generator. Generate SVG code for the following messages. " +
        "Make sure to include ids for each part of the generated SVG.",
    };

    // --- Requête au modèle ---
    const chatCompletion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.1-8B-Instruct:novita",
      messages: [SystemMessage, ...messages],
    });

    // --- Validation de la réponse ---
    const choice = chatCompletion.choices?.[0]?.message;
    if (!choice || !choice.content) {
      throw new Error("Aucune réponse valide reçue de l'API.");
    }

    // --- Extraction du SVG ---
    const svgMatch = choice.content.match(/<svg[\s\S]*?<\/svg>/i);
    const svgContent = svgMatch ? svgMatch[0] : "";

    console.log("✅ SVG généré :", svgContent);

    // --- Réponse OK ---
    return new Response(JSON.stringify({ svg: svgContent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de la génération SVG :", error);

    // --- Réponse d’erreur ---
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la génération du SVG",
        details: error?.message || "Erreur inconnue",
        svg: {
          role: "assistant",
          content:
            "<svg width='200' height='200' xmlns='http://www.w3.org/2000/svg'>" +
            "<text x='10' y='50' fill='red'>Erreur de génération</text></svg>",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
