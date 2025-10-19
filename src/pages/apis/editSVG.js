// ========================================
// Configuration et imports

import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

// ========================================
// Endpoint de modification SVG

export async function POST({ request }) {
  const data = await request.json();
  console.log("Received data:", data);
  const { id, code_svg, chat_history } = data;

  // ========================================
  // Validation

  if (!id) {
    console.log("Missing SVG id");
    return new Response(
      JSON.stringify({ success: false, error: "Missing SVG id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Updating SVG with id:", id);

    // ========================================
    // Compression de l'historique

    let compressedHistory = chat_history;
    if (typeof chat_history === "string") {
      const parsed = JSON.parse(chat_history);
      compressedHistory = JSON.stringify(parsed);
    }

    if (compressedHistory.length > 4500) {
      console.log("Chat history too long, truncating...");
      const parsed = JSON.parse(compressedHistory);
      const recentHistory = parsed.slice(-6);
      compressedHistory = JSON.stringify(recentHistory);
    }

    // ========================================
    // Mise à jour

    const updated = await pb.collection(Collections.Svg).update(id, {
      code_svg,
      chat_history: compressedHistory,
    });
    console.log("Update successful:", updated);
    return new Response(JSON.stringify({ success: true, svg: updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ========================================
    // Gestion des erreurs

    console.error("PocketBase update error:", error);
    console.error("Error details:", error.response?.data || error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.response?.data,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
