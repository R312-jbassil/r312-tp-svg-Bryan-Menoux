// ========================================
// Configuration et imports

import { OpenAI } from "openai";

// ========================================
// Configuration environnement

const isProd =
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

const ACCESS_TOKEN = isProd ? process.env.HF_TOKEN : import.meta.env.HF_TOKEN;
const BASE_URL = isProd ? process.env.HF_URL : import.meta.env.HF_URL;

// ========================================
// Endpoint de génération SVG

export const POST = async ({ request }) => {
  console.log("[generate-svg] Requête reçue");

  try {
    // ========================================
    // Extraction et préparation des données

    const messages = await request.json();
    console.log("[generate-svg] Messages reçus :", messages);

    const client = new OpenAI({
      baseURL: BASE_URL,
      apiKey: ACCESS_TOKEN,
    });

    const SystemMessage = {
      role: "system",
      content:
        "You are an SVG code generator. Generate SVG code for the following messages. Make sure to include ids for each part of the generated SVG.",
    };

    // ========================================
    // Appel à l'API

    const chatCompletion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.1-8B-Instruct:novita",
      messages: [SystemMessage, ...messages],
    });

    // ========================================
    // Validation de la réponse

    if (!chatCompletion.choices || chatCompletion.choices.length === 0) {
      throw new Error("Aucune réponse reçue de l'API");
    }

    const message = chatCompletion.choices[0].message;

    if (!message || !message.content) {
      throw new Error("Message vide reçu de l'API");
    }

    console.log("[generate-svg] Réponse brute de l'API :", message);

    // ========================================
    // Extraction du SVG

    const svgMatch = message.content.match(/<svg[\s\S]*?<\/svg>/i);
    message.content = svgMatch ? svgMatch[0] : "";

    console.log("[generate-svg] SVG extrait :", message.content);

    // ========================================
    // Réponse succès

    return new Response(JSON.stringify({ svg: message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ========================================
    // Gestion des erreurs

    console.error("[generate-svg] Erreur lors de la génération SVG :", error);

    return new Response(
      JSON.stringify({
        error: "Erreur lors de la génération du SVG",
        details: error.message,
        svg: {
          role: "assistant",
          content:
            "<svg width='200' height='200' xmlns='http://www.w3.org/2000/svg'><text x='10' y='50' fill='red'>Erreur de génération</text></svg>",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// ========================================
// Endpoint de test

export const GET = async () => {
  return new Response(
    JSON.stringify({ message: "Endpoint /apis/generate-svg is alive" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
