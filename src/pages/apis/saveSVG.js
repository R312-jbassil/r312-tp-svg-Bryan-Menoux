// ========================================
// Configuration et imports

import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

// ========================================
// Endpoint de sauvegarde SVG

export async function POST({ request }) {
  const data = await request.json();
  console.log("Received data to save:", data);

  try {
    // ========================================
    // Création de l'enregistrement

    const record = await pb.collection(Collections.Svg).create(data);
    console.log("SVG saved with ID:", record.id);

    return new Response(JSON.stringify({ success: true, id: record.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ========================================
    // Gestion des erreurs

    console.error("Error saving SVG:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}
