import type { APIContext } from "astro";
import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

interface SvgData {
  title?: string;
  content?: string;
  user?: string;
  [key: string]: unknown;
}

export async function POST({ request }: APIContext): Promise<Response> {
  try {
    const data: SvgData = await request.json();
    console.log("📥 Données reçues pour sauvegarde :", data);

    // --- Vérification minimale ---
    if (!data || Object.keys(data).length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Aucune donnée reçue." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Création de l’enregistrement dans PocketBase ---
    const record = await pb.collection(Collections.Svg).create(data);
    console.log("✅ SVG enregistré avec succès, ID :", record.id);

    return new Response(JSON.stringify({ success: true, id: record.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de la sauvegarde du SVG :", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Erreur interne du serveur.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
