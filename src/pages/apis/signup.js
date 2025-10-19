// ========================================
// Configuration et imports

import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

// ========================================
// Endpoint d'inscription

export const POST = async ({ request, cookies }) => {
  try {
    const { email, password, passwordConfirm, name } = await request.json();

    // ========================================
    // Validation des données

    if (!email || !password || !passwordConfirm) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis." }),
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return new Response(
        JSON.stringify({ error: "Les mots de passe ne correspondent pas." }),
        { status: 400 }
      );
    }

    // ========================================
    // Création de l'utilisateur

    pb.authStore.clear();

    const newUser = await pb.collection(Collections.Users).create({
      email,
      password,
      passwordConfirm,
      name: name?.trim() || email.split("@")[0],
      username: name?.trim() || email.split("@")[0],
    });

    // ========================================
    // Authentification immédiate

    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    // ========================================
    // Enregistrement du cookie

    cookies.set("pb_auth", pb.authStore.exportToCookie(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    // ========================================
    // Réponse succès

    return new Response(JSON.stringify({ user: authData.record }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // ========================================
    // Gestion des erreurs

    console.error("Erreur d'inscription :", err);

    let message = "Impossible de créer le compte.";
    if (err?.status === 400) message = "Données invalides.";
    else if (err?.status === 409)
      message = "Un compte existe déjà avec cet email.";
    else if (err?.response?.message) message = err.response.message;

    return new Response(JSON.stringify({ error: message }), {
      status: err?.status || 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
