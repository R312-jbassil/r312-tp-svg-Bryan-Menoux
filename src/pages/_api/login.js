// src/pages/api/login.ts
import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

/**
 * Permet de tester facilement dans le navigateur ou avec curl.
 * Exemple : GET https://tp-svg.bryan-menoux.fr/api/login
 */
export const GET = async () => {
  return new Response(
    JSON.stringify({ message: "Endpoint /_api/login is alive" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

/**
 * Authentifie un utilisateur via PocketBase
 */
export const POST = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  try {
    // Authentifie l'utilisateur dans PocketBase
    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    // Enregistre le cookie sécurisé
    cookies.set("pb_auth", pb.authStore.exportToCookie(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return new Response(JSON.stringify({ user: authData.record }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur de connexion :", err);
    return new Response(JSON.stringify({ error: "Identifiants invalides" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
};
