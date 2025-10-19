// ========================================
// Configuration et imports

import pb from "../../lib/pocketbase.js";

// ========================================
// Endpoint de mise à jour du profil

export async function POST({ request, cookies }) {
  try {
    const contentType = request.headers.get("content-type");
    let userId,
      updateData = {};

    // ========================================
    // Gestion multipart/form-data (avatar)

    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      userId = formData.get("userId");

      if (formData.get("name")) {
        updateData.name = formData.get("name");
      }

      if (formData.get("username")) {
        updateData.username = formData.get("username");
      }

      const avatarFile = formData.get("avatar");
      if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
        updateData.avatar = avatarFile;
      }
    } else {
      // ========================================
      // Gestion JSON (données textuelles et mot de passe)

      const body = await request.json();
      userId = body.userId;

      if (body.name !== undefined) updateData.name = body.name;
      if (body.username !== undefined) updateData.username = body.username;
      if (body.avatar !== undefined) updateData.avatar = body.avatar;

      if (body.password) {
        updateData.oldPassword = body.oldPassword;
        updateData.password = body.password;
        updateData.passwordConfirm = body.passwordConfirm;
      }
    }

    // ========================================
    // Validation et mise à jour

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "ID utilisateur manquant" }),
        { status: 400 }
      );
    }

    const updatedUser = await pb.collection("users").update(userId, updateData);

    const fullUser = await pb.collection("users").getOne(userId);

    pb.authStore.save(pb.authStore.token, fullUser);

    // ========================================
    // Mise à jour du cookie

    cookies.set("pb_auth", pb.authStore.exportToCookie(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 365 * 24 * 60 * 60,
    });

    // ========================================
    // Réponse succès

    return new Response(
      JSON.stringify({
        success: true,
        user: updatedUser,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // ========================================
    // Gestion des erreurs

    console.error("Erreur lors de la mise à jour du profil:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la mise à jour du profil",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
