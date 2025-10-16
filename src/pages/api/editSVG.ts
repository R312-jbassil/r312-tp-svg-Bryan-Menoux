import type { APIContext } from "astro";
import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

interface EditSVGRequest {
  id: string;
  code_svg: string;
  chat_history?: string | any[];
}

export const POST = async ({ request }: APIContext): Promise<Response> => {
  try {
    const data: EditSVGRequest = await request.json();
    console.log("📩 Received data:", data);

    const { id, code_svg, chat_history } = data;

    if (!id) {
      console.warn("⚠️ Missing SVG id");
      return new Response(
        JSON.stringify({ success: false, error: "Missing SVG id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔧 Updating SVG with id:", id);

    // --- Compression / nettoyage de l'historique ---
    let compressedHistory: string;

    try {
      if (typeof chat_history === "string") {
        const parsed = JSON.parse(chat_history);
        compressedHistory = JSON.stringify(parsed);
      } else if (Array.isArray(chat_history)) {
        compressedHistory = JSON.stringify(chat_history);
      } else {
        compressedHistory = JSON.stringify([]);
      }
    } catch {
      console.warn("⚠️ Failed to parse chat_history, using empty array");
      compressedHistory = JSON.stringify([]);
    }

    // --- Limitation de taille du chat ---
    if (compressedHistory.length > 4500) {
      console.log("✂️ Chat history too long, truncating...");
      const parsed = JSON.parse(compressedHistory);
      const recentHistory = parsed.slice(-6); // 3 derniers échanges
      compressedHistory = JSON.stringify(recentHistory);
    }

    // --- Mise à jour PocketBase ---
    const updated = await pb.collection(Collections.Svg).update(id, {
      code_svg,
      chat_history: compressedHistory,
    });

    console.log("✅ Update successful:", updated.id);

    return new Response(JSON.stringify({ success: true, svg: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ PocketBase update error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Unknown error",
        details: error?.response?.data || null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
