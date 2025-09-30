import { ui } from "./ui.js";

export const languages = {
  en: "English",
  fr: "Français",
};

export const defaultLang = "fr";

export function getLangFromUrl(url) {
  const [, lang] = url.pathname.split("/");
  if (lang in languages) return lang;
  return defaultLang;
}

export function useTranslations(lang) {
  return function t(key) {
    const keys = key.split(".");
    let value = ui[lang];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };
}

export function getRouteFromUrl(url) {
  const [, lang, ...route] = url.pathname.split("/");
  if (lang in languages) {
    return `/${route.join("/")}`;
  }
  return url.pathname;
}

export function translatePath(path, lang) {
  if (lang === defaultLang) {
    return path;
  }
  return `/${lang}${path}`;
}
