// src/pages/api/generate-svg.js
import { OpenAI } from "openai";

// Récupération du token d'accès à partir des variables d'environnement
const ACCESS_TOKEN = import.meta.env.HF_TOKEN;
const BASE_URL = import.meta.env.HF_URL;

export const POST = async ({ request }) => {
  // Affiche la requête dans la console pour le débogage
  console.log(request);

  // Extraction des message du corps de la requête
  const messages = await request.json();
  // Initialisation du client OpenAI avec l'URL de base et le token d'API
  const client = new OpenAI({
    baseURL: BASE_URL, // URL de l'API
    apiKey: ACCESS_TOKEN, // Token d'accès pour l'API
  });

  // Création du message système pour guider le modèle
  let SystemMessage = {
    role: "system", // Rôle du message
    content:
      "You are an SVG code generator. Generate SVG code for the following messages. Make sure to include ids for each part of the generated SVG.", // Contenu du message
  };

  try {
    // Appel à l'API pour générer le code SVG en utilisant le modèle spécifié
    const chatCompletion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.1-8B-Instruct:novita", // Modèle à utiliser pour la génération
      messages: [SystemMessage, ...messages], // Messages envoyés au modèle, incluant le message système et l'historique des messages
    });

    // Vérification que la réponse contient des choix
    if (!chatCompletion.choices || chatCompletion.choices.length === 0) {
      throw new Error("Aucune réponse reçue de l'API");
    }

    // Récupération du message généré par l'API
    const message = chatCompletion.choices[0].message;

    // Vérification que le message existe
    if (!message || !message.content) {
      throw new Error("Message vide reçu de l'API");
    }

    // Affiche le message généré dans la console pour le débogage
    console.log("Generated SVG:", message);

    // Recherche d'un élément SVG dans le message généré
    const svgMatch = message.content.match(/<svg[\s\S]*?<\/svg>/i);

    // Si un SVG est trouvé, le remplace dans le message, sinon laisse une chaîne vide
    message.content = svgMatch ? svgMatch[0] : "";

    // Retourne une réponse JSON contenant le SVG généré
    return new Response(JSON.stringify({ svg: message }), {
      headers: { "Content-Type": "application/json" }, // Définit le type de contenu de la réponse
    });
  } catch (error) {
    console.error("Erreur lors de la génération SVG:", error);

    // Retourne une réponse d'erreur
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
