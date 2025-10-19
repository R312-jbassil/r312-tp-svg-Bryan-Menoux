// ========================================
// Configuration et imports

import pb from "../../lib/pocketbase";

// ========================================
// Endpoint de basculement public/privé

export async function POST({ request }) {
  try {
    const { svgId } = await request.json();

    // ========================================
    // Validation

    if (!svgId) {
      return new Response(
        JSON.stringify({ success: false, error: "ID manquant" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ========================================
    // Récupération du SVG

    const svg = await pb.collection("svg").getOne(svgId);

    // ========================================
    // Vérification si déjà public

    const existingPublic = await pb.collection("public_galery").getFullList({
      filter: `user = "${svg.user}" && nom = "${svg.nom.replace(/"/g, '\\"')}"`,
    });

    const exactMatch = existingPublic.find(
      (pub) => pub.code_svg === svg.code_svg
    );

    // ========================================
    // Basculement public/privé

    if (exactMatch) {
      await pb.collection("public_galery").delete(exactMatch.id);
      return new Response(JSON.stringify({ success: true, isPublic: false }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      await pb.collection("public_galery").create({
        nom: svg.nom,
        code_svg: svg.code_svg,
        chat_history: svg.chat_history,
        user: svg.user,
      });
      return new Response(JSON.stringify({ success: true, isPublic: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    // ========================================
    // Gestion des erreurs

    console.error("Erreur togglePublic:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
