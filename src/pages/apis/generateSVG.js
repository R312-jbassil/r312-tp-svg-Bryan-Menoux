// src/pages/apis/generate-svg.js
import { OpenAI } from "openai";

// Détection automatique : dev (import.meta.env) ou prod (process.env)
const isProd =
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

// Récupération du token d'accès à partir des variables d'environnement
const ACCESS_TOKEN = isProd ? process.env.HF_TOKEN : import.meta.env.HF_TOKEN;
const BASE_URL = isProd ? process.env.HF_URL : import.meta.env.HF_URL;

export const POST = async ({ request }) => {
  // --- Étape 1 : Journalisation pour débogage ---
  console.log("[generate-svg] Requête reçue");

  try {
    // --- Étape 2 : Extraction du contenu JSON de la requête ---
    const messages = await request.json();
    console.log("[generate-svg] Messages reçus :", messages);

    // --- Étape 3 : Initialisation du client OpenAI avec l'URL de base et le token d'API ---
    const client = new OpenAI({
      baseURL: BASE_URL, // URL de l'API (ex : HuggingFace endpoint)
      apiKey: ACCESS_TOKEN, // Token d'accès pour l'API
    });

    // --- Étape 4 : Création du message système pour guider le modèle ---
    const SystemMessage = {
      role: "system", // Rôle du message
      content:
        "You are an SVG code generator. Generate SVG code for the following messages. Make sure to include ids for each part of the generated SVG.",
    };

    // --- Étape 5 : Appel à l'API pour générer le code SVG ---
    const chatCompletion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.1-8B-Instruct:novita", // Modèle à utiliser pour la génération
      messages: [SystemMessage, ...messages], // Messages envoyés au modèle, incluant le message système et l'historique des messages
    });

    // --- Étape 6 : Vérification que la réponse contient bien des choix ---
    if (!chatCompletion.choices || chatCompletion.choices.length === 0) {
      throw new Error("Aucune réponse reçue de l'API");
    }

    // --- Étape 7 : Récupération du message généré par l'API ---
    const message = chatCompletion.choices[0].message;

    // --- Étape 8 : Vérification que le message existe et contient du contenu ---
    if (!message || !message.content) {
      throw new Error("Message vide reçu de l'API");
    }

    // --- Étape 9 : Affichage du message complet dans la console pour vérification ---
    console.log("[generate-svg] Réponse brute de l'API :", message);

    // --- Étape 10 : Recherche d'un bloc <svg> dans le message généré ---
    const svgMatch = message.content.match(/<svg[\s\S]*?<\/svg>/i);

    // --- Étape 11 : Si un SVG est trouvé, l'extrait, sinon vide ---
    message.content = svgMatch ? svgMatch[0] : "";

    // --- Étape 12 : Journalisation du résultat final ---
    console.log("[generate-svg] SVG extrait :", message.content);

    // --- Étape 13 : Retourne une réponse JSON contenant le SVG généré ---
    return new Response(JSON.stringify({ svg: message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // --- Étape 14 : Gestion des erreurs ---
    console.error("[generate-svg] Erreur lors de la génération SVG :", error);

    // --- Étape 15 : Réponse d'erreur détaillée avec un SVG de secours ---
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

// --- Optionnel : route GET pour test de fonctionnement rapide ---
export const GET = async () => {
  return new Response(
    JSON.stringify({ message: "Endpoint /apis/generate-svg is alive" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
