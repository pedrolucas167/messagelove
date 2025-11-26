"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Language, TranslationKey, t, getDirection, languages } from "./translations";

const STORAGE_KEY = "messagelove-lang";
const DEFAULT_LANGUAGE: Language = "pt";

// Store for language state
let currentLang: Language = DEFAULT_LANGUAGE;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return currentLang;
}

function getServerSnapshot() {
  return DEFAULT_LANGUAGE;
}

function setLanguage(lang: Language) {
  currentLang = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.dir = getDirection(lang);
    document.documentElement.lang = lang;
  }
  listeners.forEach(listener => listener());
}

// Initialize language from localStorage
if (typeof window !== "undefined") {
  const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (savedLang && languages.some(l => l.code === savedLang)) {
    currentLang = savedLang;
  } else {
    const browserLang = navigator.language.split("-")[0] as Language;
    if (languages.some(l => l.code === browserLang)) {
      currentLang = browserLang;
    }
  }
}

export function useTranslation() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Update document direction when language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = getDirection(lang);
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const translate = useCallback((key: TranslationKey) => {
    return t(key, lang);
  }, [lang]);

  return {
    lang,
    setLang: setLanguage,
    t: translate,
    dir: getDirection(lang),
    languages,
  };
}
