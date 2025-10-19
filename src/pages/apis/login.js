// ========================================
// Configuration et imports

import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

// ========================================
// Endpoint de test

export const GET = async () => {
  return new Response(
    JSON.stringify({ message: "Endpoint /api/login is alive" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

// ========================================
// Endpoint de connexion

export const POST = async ({ request, cookies }) => {
  const payload = await request.json();

  // ========================================
  // Gestion OAuth (Google)

  if (payload.token && payload.record) {
    try {
      pb.authStore.save(payload.token, payload.record);
      cookies.set("pb_auth", pb.authStore.exportToCookie(), {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      const user = pb.authStore.model;
      pb.authStore.clear();
      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("OAuth finalize error:", err);
      pb.authStore.clear();
      return new Response(JSON.stringify({ error: "OAuth finalize failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // ========================================
  // Connexion par email/mot de passe

  const { email, password } = payload;

  console.log("Tentative de connexion avec email:", email);

  try {
    // ========================================
    // Authentification

    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    // ========================================
    // Enregistrement du cookie

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
