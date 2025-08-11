import { ui, defaultLang, type Languages } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang && lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    // Ensure lang is valid, fallback to defaultLang
    const validLang = lang && ui[lang] ? lang : defaultLang;
    // Ensure the translation exists, fallback to defaultLang translation
    return ui[validLang]?.[key] || ui[defaultLang][key] || key;
  };
}

export function getRouteFromUrl(url: URL): string | undefined {
  const pathname = new URL(url).pathname;
  const parts = pathname?.split('/');
  const path = parts.pop() || parts.pop();

  if (path === undefined) {
    return '/';
  }

  return `/${path}`;
}

export type { Languages };
