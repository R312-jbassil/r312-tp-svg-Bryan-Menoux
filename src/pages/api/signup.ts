import type { APIContext } from "astro";
import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

interface SignupBody {
  email: string;
  password: string;
  passwordConfirm: string;
  username?: string;
}

export const POST = async ({ request, cookies }: APIContext): Promise<Response> => {
  try {
    const { email, password, passwordConfirm, username }: SignupBody = await request.json();

    // --- Validation basique ---
    if (!email || !password || !passwordConfirm) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password !== passwordConfirm) {
      return new Response(
        JSON.stringify({ error: "Les mots de passe ne correspondent pas." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Création du compte utilisateur ---
    pb.authStore.clear();

    await pb.collection(Collections.Users).create({
      email,
      password,
      passwordConfirm,
      username: username || email.split("@")[0],
    });

    // --- Authentifie immédiatement après la création ---
    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    // --- Enregistre le cookie d'authentification ---
    cookies.set("pb_auth", pb.authStore.exportToCookie(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
    });

    return new Response(JSON.stringify({ user: authData.record }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erreur d'inscription :", err);

    const message =
      err?.status === 400
        ? "Données invalides."
        : err?.status === 409
        ? "Un compte existe déjà avec cet email."
        : "Impossible de créer le compte.";

    return new Response(JSON.stringify({ error: message }), {
      status: err?.status || 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
