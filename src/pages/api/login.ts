import type { APIContext } from "astro";
import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

interface LoginBody {
  email: string;
  password: string;
}

export const POST = async ({ request, cookies }: APIContext): Promise<Response> => {
  try {
    const { email, password }: LoginBody = await request.json();

    // --- Vérification basique ---
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Authentification ---
    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    // --- Définition du cookie sécurisé ---
    cookies.set("pb_auth", pb.authStore.exportToCookie(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
    });

    // --- Réponse ---
    return new Response(JSON.stringify({ user: authData.record }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ Erreur de connexion :", err);

    return new Response(
      JSON.stringify({
        error:
          err?.status === 400
            ? "Email ou mot de passe invalide."
            : "Erreur de connexion au serveur.",
      }),
      { status: err?.status || 401, headers: { "Content-Type": "application/json" } }
    );
  }
};
