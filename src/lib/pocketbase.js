import PocketBase from "pocketbase";

// Détection de l'environnement basée sur le hostname
const isLocal =
  typeof window !== "undefined"
    ? window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    : import.meta.env.MODE === "development";

// URL de PocketBase
const baseUrl = isLocal
  ? "http://127.0.0.1:8090"
  : "https://tp-svg.bryan-menoux.fr:8087";

const pb = new PocketBase(baseUrl);

export async function createNewFavorite(name, svg) {
  try {
    const data = {
      nom_favori: name,
      contenu_svg: svg,
    };

    const record = await pb.collection("favoris").create(data);
    return record;
  } catch (err) {
    console.error("Erreur lors de la creation du favori :", err);
    throw err;
  }
}

export async function getAllFavorites() {
  try {
    const records = await pb.collection("favoris").getFullList({
      sort: "-created",
    });
    return records;
  } catch (err) {
    console.error("Erreur lors de la recuperation des favoris :", err);
    return [];
  }
}

export async function deleteFavorite(id) {
  try {
    await pb.collection("favoris").delete(id);
    return true;
  } catch (err) {
    console.error("Erreur lors de la suppression du favori :", err);
    return false;
  }
}

export async function getAllSvgs() {
  try {
    const records = await pb.collection("svg").getFullList({
      sort: "-created",
    });
    return records;
  } catch (err) {
    console.error("Erreur lors de la récupération des SVG :", err);
    return [];
  }
}

export async function deleteSvg(id) {
  try {
    // Récupérer les informations du SVG avant de le supprimer
    const svg = await pb.collection("svg").getOne(id);

    // Supprimer le SVG de la collection svg
    await pb.collection("svg").delete(id);

    // Vérifier et supprimer l'entrée correspondante dans public_galery si elle existe
    try {
      const existingPublic = await pb.collection("public_galery").getFullList({
        filter: `user = "${svg.user}" && nom = "${svg.nom.replace(
          /"/g,
          '\\"'
        )}"`,
      });

      const exactMatch = existingPublic.find(
        (pub) => pub.code_svg === svg.code_svg
      );

      if (exactMatch) {
        await pb.collection("public_galery").delete(exactMatch.id);
        console.log("SVG public supprimé de la galerie publique");
      }
    } catch (publicErr) {
      // Erreur lors de la suppression de public_galery, mais le SVG principal est déjà supprimé
      console.warn(
        "Erreur lors de la suppression de public_galery:",
        publicErr
      );
    }

    return true;
  } catch (err) {
    console.error("Erreur lors de la suppression du SVG :", err);
    return false;
  }
}

export default pb;
