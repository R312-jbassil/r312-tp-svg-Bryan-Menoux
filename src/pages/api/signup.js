import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

export const POST = async ({ request, cookies }) => {
  const { email, password, passwordConfirm, username } = await request.json();

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

  try {
    pb.authStore.clear();

    await pb.collection(Collections.Users).create({
      email,
      password,
      passwordConfirm,
      username: username || email.split("@")[0],
    });

    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    cookies.set("pb_auth", pb.authStore.exportToCookie(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return new Response(JSON.stringify({ user: authData.record }), {
      status: 201,
    });
  } catch (err) {
    console.error("Erreur d'inscription :", err);
    const message =
      err?.status === 400
        ? "Données invalides."
        : err?.status === 409
        ? "Un compte existe déjà avec cet email."
        : "Impossible de créer le compte.";

    return new Response(JSON.stringify({ error: message }), {
      status: err?.status || 500,
    });
  }
};

