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
  : "https://tp_svg.bryan-menoux.fr:443";

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
    await pb.collection("svg").delete(id);
    return true;
  } catch (err) {
    console.error("Erreur lors de la suppression du SVG :", err);
    return false;
  }
}

export default pb;
