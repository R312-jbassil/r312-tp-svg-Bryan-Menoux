/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    lang: "en" | "fr";
    user?: {
      id: string;
      email: string;
    } | null;
  }
}