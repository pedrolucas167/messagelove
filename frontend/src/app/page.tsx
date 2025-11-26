"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format, Locale } from "date-fns";
import { ptBR, enUS, es, hi, ar } from "date-fns/locale";
import { nanoid } from "nanoid";
import { useTranslation } from "@/lib/useTranslation";
import type { Language, TranslationKey } from "@/lib/translations";

type User = { id: string; name: string; email: string };
type Card = {
  id: string;
  de: string;
  para: string;
  mensagem: string;
  fotoUrl: string | null;
  youtubeVideoId: string | null;
  youtubeStartTime: number | null;
  createdAt: string;
};
type NotificationKind = "success" | "error" | "info" | "warning";
type Notification = { id: string; message: string; type: NotificationKind };

async function apiRequest<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const finalHeaders = new Headers(headers);
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  if (rest.body && !(rest.body instanceof FormData) && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...rest, headers: finalHeaders });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  if (!response.ok) throw new Error((data as { error?: string }).error ?? response.statusText);
  return data;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════════════════════════════ */
const HeartGiftIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="h-10 w-10">
    <path d="M32 58s24-14 24-30c0-8-6-14-12-14-4 0-8 2-12 8-4-6-8-8-12-8-6 0-12 6-12 14 0 16 24 30 24 30z" fill="url(#hg1)" />
    <defs>
      <linearGradient id="hg1" x1="8" y1="14" x2="56" y2="58" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f472b6" />
        <stop offset="1" stopColor="#a855f7" />
      </linearGradient>
    </defs>
  </svg>
);

const GiftIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
    <rect x="6" y="20" width="36" height="24" rx="4" fill="#a855f7" />
    <rect x="4" y="12" width="40" height="10" rx="3" fill="#c084fc" />
    <path d="M24 12v32" stroke="#fff" strokeWidth="3" />
    <path d="M24 12c-4-6-10-8-10-4s6 4 10 4" stroke="#fbbf24" strokeWidth="2" fill="none" />
    <path d="M24 12c4-6 10-8 10-4s-6 4-10 4" stroke="#fbbf24" strokeWidth="2" fill="none" />
  </svg>
);

const PaymentIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
    <rect x="4" y="12" width="40" height="28" rx="4" fill="#a855f7" />
    <rect x="4" y="18" width="40" height="6" fill="#7c3aed" />
    <rect x="8" y="30" width="12" height="4" rx="1" fill="#c4b5fd" />
  </svg>
);

const QRCodeIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
    <rect x="6" y="6" width="14" height="14" rx="2" fill="#a855f7" />
    <rect x="28" y="6" width="14" height="14" rx="2" fill="#a855f7" />
    <rect x="6" y="28" width="14" height="14" rx="2" fill="#a855f7" />
    <rect x="28" y="28" width="6" height="6" fill="#c084fc" />
    <rect x="36" y="28" width="6" height="6" fill="#c084fc" />
    <rect x="28" y="36" width="6" height="6" fill="#c084fc" />
    <rect x="36" y="36" width="6" height="6" fill="#c084fc" />
    <rect x="10" y="10" width="6" height="6" fill="#fff" />
    <rect x="32" y="10" width="6" height="6" fill="#fff" />
    <rect x="10" y="32" width="6" height="6" fill="#fff" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
    <circle cx="36" cy="12" r="6" fill="#a855f7" />
    <circle cx="12" cy="24" r="6" fill="#c084fc" />
    <circle cx="36" cy="36" r="6" fill="#a855f7" />
    <path d="M17 21l14-6M17 27l14 6" stroke="#7c3aed" strokeWidth="2" />
  </svg>
);

const TrustIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
    <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" fill="url(#ti1)" />
    <path d="M20 24l4 4 8-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="ti1" x1="6" y1="4" x2="42" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a855f7" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

const InfinityIcon = ({ className = "h-6 w-6 inline-block ml-2" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M12 24c0 4 3 8 8 8s8-4 8-8-4-8-8-8-8 4-8 8zm16 0c0-4 3-8 8-8s8 4 8 8-3 8-8 8-8-4-8-8z" stroke="url(#inf1)" strokeWidth="3" fill="none" />
    <defs>
      <linearGradient id="inf1" x1="12" y1="16" x2="44" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f472b6" />
        <stop offset="1" stopColor="#a855f7" />
      </linearGradient>
    </defs>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-yellow-400">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════════════ */
type ViewState = "welcome" | "dashboard" | "creation";
type AuthModalState = "none" | "login" | "register";

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { t, lang, setLang, languages } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>("welcome");
  const [cards, setCards] = useState<Card[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [authModal, setAuthModal] = useState<AuthModalState>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({ de: "", para: "", mensagem: "", youtubeVideoId: "", youtubeStartTime: "", foto: null as File | null });

  // Translated arrays - inside component to use t()
  const creationSteps = [
    { icon: <GiftIcon />, title: t("steps.step1.title"), description: t("steps.step1.description") },
    { icon: <PaymentIcon />, title: t("steps.step2.title"), description: t("steps.step2.description") },
    { icon: <QRCodeIcon />, title: t("steps.step3.title"), description: t("steps.step3.description") },
    { icon: <ShareIcon />, title: t("steps.step4.title"), description: t("steps.step4.description") },
  ];

  const trustItems = [
    { value: "10.000+", label: t("trust.memories"), stars: false },
    { value: "4.97/5", label: t("trust.rating"), stars: true },
    { value: "85%", label: t("trust.recommend"), stars: false },
    { value: "30+", label: t("trust.countries"), stars: false },
  ];

  const faqItems = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  const planFeatures = [
    t("pricing.feature1"),
    t("pricing.feature2"),
    t("pricing.feature3"),
    t("pricing.feature4"),
    t("pricing.feature5"),
    t("pricing.feature6"),
    t("pricing.feature7"),
  ];

  // Get date-fns locale based on current language
  const getDateLocale = () => {
    const locales: Record<Language, Locale> = { pt: ptBR, en: enUS, es, hi, ar };
    return locales[lang] || ptBR;
  };

  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    const savedUser = typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser) as User);
      setView("dashboard");
    }
  }, []);

  useEffect(() => {
    if (token && currentUser) loadCards(token);
  }, [token, currentUser]);

  const pushNotification = (message: string, type: NotificationKind = "info") => {
    const id = nanoid();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
  };

  const handleAuthSuccess = (payload: { token: string; user: User }) => {
    sessionStorage.setItem("token", payload.token);
    sessionStorage.setItem("user", JSON.stringify(payload.user));
    setToken(payload.token);
    setCurrentUser(payload.user);
    setView("dashboard");
    setAuthModal("none");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setToken(null);
    setCurrentUser(null);
    setCards([]);
    setView("welcome");
    pushNotification(t("notifications.loggedOut"), "info");
  };

  const loadCards = async (authToken: string) => {
    try {
      const data = await apiRequest<Card[]>("/api/cards", { method: "GET", token: authToken });
      setCards(data);
    } catch (error) {
      console.error(error);
      pushNotification(t("notifications.loadError"), "error");
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiRequest<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      handleAuthSuccess(data);
      pushNotification(t("notifications.loginSuccess"), "success");
      event.currentTarget.reset();
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : t("notifications.loginError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiRequest<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") }),
      });
      handleAuthSuccess(data);
      pushNotification(`${t("notifications.welcome")}, ${data.user.name}!`, "success");
      event.currentTarget.reset();
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : t("notifications.registerError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return pushNotification(t("notifications.loginRequired"), "warning");
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("de", createForm.de);
      formData.append("para", createForm.para);
      formData.append("mensagem", createForm.mensagem);
      if (createForm.youtubeVideoId) formData.append("youtubeVideoId", createForm.youtubeVideoId);
      if (createForm.youtubeStartTime) formData.append("youtubeStartTime", createForm.youtubeStartTime);
      if (createForm.foto) formData.append("foto", createForm.foto);
      await apiRequest("/api/cards", { method: "POST", body: formData, token });
      pushNotification(t("notifications.cardCreated"), "success");
      setCreateForm({ de: "", para: "", mensagem: "", youtubeVideoId: "", youtubeStartTime: "", foto: null });
      setView("dashboard");
      await loadCards(token);
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : t("notifications.cardError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedCards = useMemo(
    () => cards.map((card) => ({ ...card, createdDate: format(new Date(card.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) })),
    [cards]
  );

  const goToCreate = () => (currentUser ? setView("creation") : setAuthModal("register"));

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#2d1b4e] via-[#1e1333] to-[#0f0520] text-white antialiased">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-purple-600/40 blur-[150px]" />
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-fuchsia-500/30 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-violet-600/25 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a0a2e]/90 backdrop-blur-lg border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            {/* Heart Logo */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 shadow-lg shadow-pink-500/30">
              <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Message<span className="text-fuchsia-400">Love</span>
            </span>
          </div>
          
          {currentUser ? (
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  <span>{languages.find(l => l.code === lang)?.flag}</span>
                  <span className="hidden sm:inline">{languages.find(l => l.code === lang)?.code.toUpperCase()}</span>
                  <svg className={`h-4 w-4 transition ${langMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-[#2d1b4e] border border-white/10 shadow-xl overflow-hidden">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => { setLang(language.code); setLangMenuOpen(false); }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/10 ${lang === language.code ? 'bg-white/5 text-fuchsia-400' : 'text-gray-300'}`}
                      >
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="hidden text-sm text-gray-300 sm:inline">{t("nav.hello")}, {currentUser.name}</span>
              <button onClick={handleLogout} className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium transition hover:bg-white/10">
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  <span>{languages.find(l => l.code === lang)?.flag}</span>
                  <span className="hidden sm:inline">{languages.find(l => l.code === lang)?.code.toUpperCase()}</span>
                  <svg className={`h-4 w-4 transition ${langMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-[#2d1b4e] border border-white/10 shadow-xl overflow-hidden">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => { setLang(language.code); setLangMenuOpen(false); }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/10 ${lang === language.code ? 'bg-white/5 text-fuchsia-400' : 'text-gray-300'}`}
                      >
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white sm:flex">
                📷 {t("nav.gallery")}
              </button>
              <button 
                onClick={goToCreate} 
                className="rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-6 py-2.5 text-sm font-bold shadow-lg shadow-pink-500/30 transition hover:-translate-y-0.5 hover:shadow-pink-500/50"
              >
                {t("nav.create")}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10">
        {/* ═══════════════════════════════════════════════════════════════════════
           WELCOME VIEW
           ═══════════════════════════════════════════════════════════════════════ */}
        {view === "welcome" && (
          <>
            {/* Hero Section - New Design */}
            <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 xl:py-24">
              <div className="mx-auto max-w-[1800px] px-6 sm:px-8 lg:px-12">
                <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-20">
                  {/* Left Content */}
                  <div className="space-y-6 lg:space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/20 px-4 py-2 text-sm font-medium text-pink-300">
                      <span className="text-lg">💝</span>
                      {t("hero.badge")}
                    </div>
                    
                    {/* Main Title */}
                    <h1 className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                      {t("hero.titlePart1")}{" "}
                      <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                        {t("hero.titleHighlight")}
                      </span>{" "}
                      {t("hero.titlePart2")}
                    </h1>
                    
                    {/* Subtitle */}
                    <p className="max-w-xl text-lg leading-relaxed text-gray-300 sm:text-xl">
                      {t("hero.subtitle")}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <button 
                        onClick={goToCreate} 
                        className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-8 py-4 text-base font-bold shadow-xl shadow-pink-500/30 transition duration-300 hover:-translate-y-1 hover:shadow-pink-500/50"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {t("hero.cta")}
                      </button>
                      <button 
                        onClick={() => setAuthModal("login")}
                        className="inline-flex items-center justify-center rounded-full border-2 border-white/20 bg-white/5 px-8 py-4 text-base font-bold backdrop-blur transition duration-300 hover:border-white/40 hover:bg-white/10"
                      >
                        {t("hero.seeExamples")}
                      </button>
                    </div>
                  </div>

                  {/* Right Side - Phone Mockup with Card Preview */}
                  <div className="relative flex justify-center lg:justify-center xl:justify-end">
                    {/* Floating hearts decoration */}
                    <div className="absolute -right-4 top-0 text-3xl opacity-60">💕</div>
                    <div className="absolute -left-4 bottom-20 text-2xl opacity-40">💜</div>
                    
                    {/* Phone Frame */}
                    <div className="relative w-[320px] sm:w-[360px] lg:w-[380px] xl:w-[400px]">
                      {/* Glow effect */}
                      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-pink-500/30 via-fuchsia-500/30 to-purple-500/30 blur-3xl" />
                      
                      {/* Phone bezel */}
                      <div className="relative rounded-[2.5rem] border-[6px] border-gray-800/80 bg-gradient-to-b from-gray-800 to-gray-900 p-1 shadow-2xl">
                        {/* Screen */}
                        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#2a1548] via-[#1e1030] to-[#150a25]">
                          {/* Status bar */}
                          <div className="flex items-center justify-between px-6 pb-2 pt-3 text-[10px] text-gray-400">
                            <span className="font-medium">9:41</span>
                            <div className="flex items-center gap-1">
                              <div className="flex h-3 w-5 items-center rounded-sm border border-gray-400 px-0.5">
                                <div className="h-1.5 w-3 rounded-sm bg-green-400" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Card Content */}
                          <div className="px-5 pb-6">
                            {/* Heart icon */}
                            <div className="mb-4 flex justify-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-600 shadow-lg shadow-pink-500/40">
                                <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                              </div>
                            </div>
                            
                            {/* Para text */}
                            <div className="mb-4 text-center">
                              <p className="text-lg font-bold text-white">Para: Meu Amor 🧡</p>
                              <p className="mt-1 text-sm text-gray-400">Estamos juntos há</p>
                            </div>
                            
                            {/* Time Counter */}
                            <div className="mb-5 flex justify-center gap-3">
                              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                                <span className="text-2xl font-bold text-white">2</span>
                                <span className="text-[10px] text-gray-400">anos</span>
                              </div>
                              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                                <span className="text-2xl font-bold text-white">5</span>
                                <span className="text-[10px] text-gray-400">meses</span>
                              </div>
                              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                                <span className="text-2xl font-bold text-white">18</span>
                                <span className="text-[10px] text-gray-400">dias</span>
                              </div>
                            </div>
                            
                            {/* Photo preview */}
                            <div className="overflow-hidden rounded-2xl">
                              <div className="aspect-[4/3] bg-gradient-to-br from-pink-400/40 via-fuchsia-400/30 to-purple-500/40 p-4">
                                <div className="flex h-full items-center justify-center">
                                  <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                      <div key={i} className="h-8 w-8 rounded-full bg-white/20 backdrop-blur" style={{ 
                                        animation: `pulse ${1 + i * 0.2}s ease-in-out infinite`
                                      }} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Home indicator */}
                          <div className="flex justify-center pb-2">
                            <div className="h-1 w-28 rounded-full bg-white/30" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Steps Section */}
            <section className="border-t border-white/5 bg-gradient-to-b from-transparent to-purple-950/20 py-16 sm:py-20 lg:py-24">
              <div className="mx-auto max-w-[1800px] px-6 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                    {t("steps.title")} <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">{t("steps.titleHighlight")}</span>!
                  </h2>
                  <p className="mt-4 text-gray-400 sm:text-lg">{t("steps.subtitle")}</p>
                </div>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
                  {creationSteps.map((step, index) => (
                    <div key={step.title} className="group relative rounded-3xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-pink-500/50 hover:bg-white/10">
                      <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-sm font-bold shadow-lg">{index + 1}</div>
                      <div className="mb-4 mt-2">{step.icon}</div>
                      <h3 className="text-lg font-bold">{step.title}</h3>
                      <p className="mt-2 text-sm text-gray-400">{step.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 text-center">
                  <button onClick={goToCreate} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-pink-500/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-pink-500/50">
                    {t("steps.cta")} <span>→</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Trust Section */}
            <section className="border-t border-white/5 py-16 sm:py-20 lg:py-24">
              <div className="mx-auto max-w-[1800px] px-6 sm:px-8 lg:px-12">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">
                  <div className="space-y-8">
                    <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                      {t("trust.title")} <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">{t("trust.titleHighlight")}</span>
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {trustItems.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <p className="text-3xl font-black">{item.value}</p>
                          {item.stars && (
                            <div className="mt-1 flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} />)}
                            </div>
                          )}
                          <p className="mt-2 text-sm text-gray-400">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 p-6">
                      <div className="mb-4"><TrustIcon /></div>
                      <h3 className="text-xl font-bold">{t("trust.digital.title")}</h3>
                      <p className="mt-2 text-gray-400">{t("trust.digital.desc")}</p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <h3 className="text-xl font-bold">{t("trust.social.title")}</h3>
                      <div className="mt-4 flex gap-6">
                        <div>
                          <p className="text-2xl font-black">30k+</p>
                          <p className="text-sm text-gray-400">{t("trust.social.followers")}</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black">3M+</p>
                          <p className="text-sm text-gray-400">{t("trust.social.likes")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <h3 className="text-xl font-bold">{t("trust.beyond.title")}</h3>
                      <p className="mt-2 text-gray-400">{t("trust.beyond.desc")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section className="border-t border-white/5 bg-gradient-to-b from-transparent to-purple-950/20 py-16 sm:py-20 lg:py-24">
              <div className="mx-auto max-w-[1800px] px-6 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                    {t("pricing.title")} <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{t("pricing.forever")}</span>
                    <InfinityIcon />
                    <span className="text-gray-400"> {t("pricing.orTemp")}</span>
                  </h2>
                  <p className="mt-4 text-gray-400">{t("pricing.subtitle")}</p>
                </div>

                <div className="mt-12 flex justify-center">
                  <div className="w-full max-w-md">
                    <div className="relative overflow-hidden rounded-3xl border-2 border-fuchsia-500/50 bg-gradient-to-br from-[#1a0a2e] to-[#120820] p-8 shadow-2xl shadow-fuchsia-500/10">
                      <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-3 py-1 text-xs font-bold">{t("pricing.popular")}</div>
                      <div className="absolute left-4 top-4 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">{t("pricing.promo")}</div>

                      <div className="mt-8 flex items-center gap-2">
                        <InfinityIcon className="h-6 w-6" />
                        <h3 className="text-2xl font-bold">{t("pricing.forever")}</h3>
                      </div>

                      <div className="mt-6">
                        <span className="text-sm text-gray-400 line-through">R$ 35,90</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black">R$ 29,90</span>
                          <span className="text-gray-400">{t("pricing.perUser")}</span>
                        </div>
                      </div>

                      <ul className="mt-8 space-y-3 text-sm">
                        {planFeatures.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span className="mt-0.5 text-fuchsia-400">✓</span>
                            <span className="text-gray-300">{item}</span>
                          </li>
                        ))}
                      </ul>

                      <button onClick={goToCreate} className="mt-8 w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 py-4 text-base font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                        {t("pricing.cta")}
                      </button>

                      <p className="mt-4 text-center text-xs text-gray-500">{t("pricing.guarantee")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="border-t border-white/5 py-20 sm:py-28">
              <div className="mx-auto max-w-3xl px-4 sm:px-6">
                <div className="text-center">
                  <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{t("faq.title")}</h2>
                  <p className="mt-4 text-gray-400">{t("faq.subtitle")}</p>
                </div>

                <div className="mt-12 space-y-4">
                  {faqItems.map((item) => (
                    <details key={item.q} className="group rounded-2xl border border-white/10 bg-white/5">
                      <summary className="flex cursor-pointer items-center justify-between p-6 text-lg font-semibold">
                        {item.q}
                        <span className="ml-4 transition duration-200 group-open:rotate-45">+</span>
                      </summary>
                      <p className="px-6 pb-6 text-gray-400">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            {/* Final CTA Section */}
            <section className="border-t border-white/5 bg-gradient-to-r from-fuchsia-600/20 via-purple-600/20 to-pink-600/20 py-20 sm:py-28">
              <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  {t("footer.ctaTitle")} <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{t("footer.ctaHighlight")}</span>
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">{t("footer.ctaSubtitle")}</p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <button onClick={goToCreate} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-8 py-4 text-base font-bold shadow-xl transition duration-300 hover:-translate-y-0.5">
                    {t("footer.ctaButton")}
                  </button>
                  <a href="https://instagram.com/messagelove" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-bold transition hover:bg-white/10">
                    {t("footer.instagram")}
                  </a>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
           DASHBOARD VIEW
           ═══════════════════════════════════════════════════════════════════════ */}
        {view === "dashboard" && currentUser && (
          <section className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-[1800px] px-6 sm:px-8 lg:px-12">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-black sm:text-4xl">{t("dashboard.title")}</h1>
                  <p className="mt-1 text-gray-400">{t("dashboard.subtitle")}</p>
                </div>
                <button onClick={() => setView("creation")} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-6 py-3 font-bold shadow-lg transition hover:-translate-y-0.5">
                  + {t("dashboard.newMemory")}
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {formattedCards.length === 0 && (
                  <div className="col-span-full rounded-3xl border border-dashed border-white/20 p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20">
                      <GiftIcon />
                    </div>
                    <p className="text-xl font-semibold">{t("dashboard.empty")}</p>
                    <p className="mt-2 text-gray-400">{t("dashboard.emptyDesc")}</p>
                    <button onClick={() => setView("creation")} className="mt-6 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-6 py-3 font-bold shadow-lg transition hover:-translate-y-0.5">
                      {t("dashboard.createFirst")}
                    </button>
                  </div>
                )}
                {formattedCards.map((card) => (
                  <article key={card.id} className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-fuchsia-500/50 hover:bg-white/10">
                    {card.fotoUrl && (
                      <div className="mb-4 aspect-video overflow-hidden rounded-2xl bg-black/20">
                        <img src={card.fotoUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <p className="text-sm text-fuchsia-400">{t("dashboard.from")}: {card.de}</p>
                    <h3 className="mt-1 text-xl font-bold">{t("dashboard.to")}: {card.para}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-gray-400">{card.mensagem}</p>
                    <p className="mt-4 text-xs text-gray-500">{card.createdDate}</p>
                    <a href={`/cards/${card.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-400 transition hover:text-fuchsia-300">
                      {t("dashboard.viewMemory")} →
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
           CREATION VIEW - Com preview em tempo real no celular
           ═══════════════════════════════════════════════════════════════════════ */}
        {view === "creation" && currentUser && (
          <section className="py-8 sm:py-12 lg:py-16">
            <div className="mx-auto max-w-[1800px] px-6 sm:px-8 lg:px-12">
              <button onClick={() => setView("dashboard")} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                {t("creation.back")}
              </button>

              <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Formulário */}
                <div className="order-2 lg:order-1">
                  <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 sm:p-8">
                    <div className="mb-6">
                      <h1 className="text-2xl font-black sm:text-3xl">
                        {t("creation.title")} <span className="animate-pulse">✨</span>
                      </h1>
                      <p className="mt-2 text-gray-400">{t("creation.subtitle")}</p>
                    </div>

                    {/* Progress indicator */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{t("creation.progress")}</span>
                        <span>{Math.round(((createForm.de ? 1 : 0) + (createForm.para ? 1 : 0) + (createForm.mensagem ? 1 : 0)) / 3 * 100)}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${((createForm.de ? 1 : 0) + (createForm.para ? 1 : 0) + (createForm.mensagem ? 1 : 0)) / 3 * 100}%` }}
                        />
                      </div>
                    </div>

                    <form onSubmit={handleCreateCard} className="space-y-5">
                      {/* De e Para */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs text-fuchsia-400">1</span>
                            {t("creation.from")}
                          </span>
                          <input 
                            type="text" 
                            value={createForm.de} 
                            onChange={(e) => setCreateForm((p) => ({ ...p, de: e.target.value }))} 
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20" 
                            placeholder={t("creation.fromPlaceholder")} 
                            required 
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs text-fuchsia-400">2</span>
                            {t("creation.to")}
                          </span>
                          <input 
                            type="text" 
                            value={createForm.para} 
                            onChange={(e) => setCreateForm((p) => ({ ...p, para: e.target.value }))} 
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20" 
                            placeholder={t("creation.toPlaceholder")} 
                            required 
                          />
                        </label>
                      </div>

                      {/* Mensagem */}
                      <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs text-fuchsia-400">3</span>
                          {t("creation.message")}
                        </span>
                        <textarea 
                          value={createForm.mensagem} 
                          onChange={(e) => setCreateForm((p) => ({ ...p, mensagem: e.target.value }))} 
                          className="h-32 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20" 
                          placeholder={t("creation.messagePlaceholder")} 
                          required 
                        />
                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                          <span>{t("creation.beCreative")}</span>
                          <span>{createForm.mensagem.length} {t("creation.characters")}</span>
                        </div>
                      </label>

                      {/* Foto */}
                      <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-xs text-purple-400">📷</span>
                          {t("creation.photo")}
                        </span>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp" 
                            onChange={(e) => setCreateForm((p) => ({ ...p, foto: e.target.files?.[0] ?? null }))} 
                            className="w-full cursor-pointer rounded-xl border-2 border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-gray-400 transition hover:border-fuchsia-500/50 hover:bg-white/10 file:hidden"
                          />
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <svg className="mb-2 h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm">
                              {createForm.foto ? createForm.foto.name : t("creation.photoClick")}
                            </span>
                          </div>
                        </div>
                      </label>

                      {/* YouTube */}
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20">
                            <svg className="h-3 w-3 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </span>
                          <span className="text-sm font-medium text-gray-300">{t("creation.youtube")}</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input 
                            type="text" 
                            value={createForm.youtubeVideoId} 
                            onChange={(e) => setCreateForm((p) => ({ ...p, youtubeVideoId: e.target.value }))} 
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-500" 
                            placeholder={t("creation.youtubeIdPlaceholder")} 
                          />
                          <input 
                            type="number" 
                            min="0" 
                            value={createForm.youtubeStartTime} 
                            onChange={(e) => setCreateForm((p) => ({ ...p, youtubeStartTime: e.target.value }))} 
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-500" 
                            placeholder={t("creation.youtubeTimePlaceholder")} 
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">{t("creation.youtubeHelp")}</p>
                      </div>

                      {/* Submit */}
                      <button 
                        type="submit" 
                        disabled={isSubmitting || !createForm.de || !createForm.para || !createForm.mensagem} 
                        className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 py-4 text-base font-bold shadow-lg shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isSubmitting ? (
                            <>
                              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              {t("creation.creating")}
                            </>
                          ) : (
                            <>
                              {t("creation.submit")}
                              <span className="text-lg">❤️</span>
                            </>
                          )}
                        </span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Preview do Celular */}
                <div className="order-1 flex items-start justify-center lg:order-2 lg:sticky lg:top-24">
                  <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-pink-500/20 blur-2xl" />
                    
                    {/* Phone frame */}
                    <div className="relative w-[280px] sm:w-[320px]">
                      {/* Phone bezel */}
                      <div className="rounded-[2.5rem] border-[8px] border-gray-800 bg-gray-900 p-1 shadow-2xl shadow-purple-500/20">
                        {/* Dynamic Island */}
                        <div className="absolute left-1/2 top-3 z-20 h-7 w-24 -translate-x-1/2 rounded-full bg-black" />
                        
                        {/* Screen */}
                        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#1a0a2e] via-[#150820] to-[#0f0520]">
                          {/* Status bar */}
                          <div className="flex items-center justify-between px-6 pb-1 pt-10 text-[10px] text-gray-400">
                            <span>9:41</span>
                            <div className="flex items-center gap-1">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.12 0-.23-.01-.35l-1.41-1.42A6.97 6.97 0 0 1 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7 3.13-7 7-7c1.68 0 3.21.59 4.42 1.58l1.42-1.42A8.96 8.96 0 0 0 12 3z"/></svg>
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                              <div className="flex h-3 w-5 items-center rounded-sm border border-gray-400 px-0.5">
                                <div className="h-1.5 w-3 rounded-sm bg-green-400" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="px-4 pb-6">
                            {/* Header */}
                            <div className="mb-4 flex items-center gap-2 pt-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500">
                                <HeartGiftIcon />
                              </div>
                              <span className="text-xs font-bold text-white">MessageLove</span>
                            </div>
                            
                            {/* Card Preview */}
                            <div className="space-y-3 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-4 backdrop-blur">
                              {/* De/Para */}
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 p-0.5">
                                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1a0a2e] text-xs">
                                    {createForm.de ? createForm.de.charAt(0).toUpperCase() : "?"}
                                  </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <p className="truncate text-[10px] text-gray-400">
                                    {t("dashboard.from")}: <span className="text-gray-300">{createForm.de || t("creation.fromPlaceholder")}</span>
                                  </p>
                                  <p className="truncate text-xs font-semibold text-white">
                                    {t("dashboard.to")}: {createForm.para || t("creation.toPlaceholder")} {createForm.para && "❤️"}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Mensagem */}
                              <div className="rounded-xl bg-black/30 p-3">
                                <p className="line-clamp-4 text-[11px] italic leading-relaxed text-gray-300">
                                  {createForm.mensagem ? (
                                    <>
                                      &quot;{createForm.mensagem}&quot;
                                    </>
                                  ) : (
                                    <span className="text-gray-500">{t("creation.previewMessage")}</span>
                                  )}
                                </p>
                              </div>
                              
                              {/* Foto preview */}
                              {createForm.foto && (
                                <div className="overflow-hidden rounded-xl">
                                  <div className="aspect-video bg-gradient-to-br from-fuchsia-500/30 to-purple-600/30 flex items-center justify-center">
                                    <svg className="h-8 w-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              
                              {/* YouTube indicator */}
                              {createForm.youtubeVideoId && (
                                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-2">
                                  <span className="text-lg">🎵</span>
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] text-gray-400">{t("creation.nowPlaying")}</p>
                                    <p className="truncate text-xs font-medium text-white">{t("creation.specialMusic")}</p>
                                  </div>
                                  <div className="flex gap-0.5">
                                    <div className="h-3 w-0.5 animate-pulse rounded-full bg-red-400" style={{ animationDelay: "0ms" }} />
                                    <div className="h-4 w-0.5 animate-pulse rounded-full bg-red-400" style={{ animationDelay: "150ms" }} />
                                    <div className="h-2 w-0.5 animate-pulse rounded-full bg-red-400" style={{ animationDelay: "300ms" }} />
                                    <div className="h-5 w-0.5 animate-pulse rounded-full bg-red-400" style={{ animationDelay: "450ms" }} />
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Features indicators */}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium transition-all ${createForm.de && createForm.para ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-500"}`}>
                                ✓ {t("preview.exclusiveLink")}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium transition-all ${createForm.mensagem ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-500"}`}>
                                ✓ {t("preview.qrCode")}
                              </span>
                              {createForm.foto && (
                                <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[9px] font-medium text-fuchsia-400">
                                  📷 {t("preview.photo")}
                                </span>
                              )}
                              {createForm.youtubeVideoId && (
                                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-medium text-red-400">
                                  🎵 {t("preview.music")}
                                </span>
                              )}
                            </div>
                            
                            {/* Bottom action preview */}
                            <div className="mt-4 rounded-xl bg-gradient-to-r from-fuchsia-500/80 to-purple-600/80 p-2.5 text-center">
                              <span className="text-[10px] font-bold text-white">{t("preview.shareMemory")}</span>
                            </div>
                          </div>
                          
                          {/* Home indicator */}
                          <div className="flex justify-center pb-2">
                            <div className="h-1 w-24 rounded-full bg-white/30" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating labels */}
                      <div className="absolute -right-4 top-16 animate-bounce rounded-full bg-gradient-to-r from-green-400 to-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                        {t("preview.livePreview")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0312] py-12 sm:py-16">
        <div className="mx-auto max-w-[1800px] px-6 sm:px-8 lg:px-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-xl font-bold">
                <HeartGiftIcon />
                <span>Message<span className="text-fuchsia-400">Love</span></span>
              </div>
              <p className="mt-4 text-sm text-gray-400">{t("footer.description")}</p>
            </div>
            <div>
              <h4 className="font-semibold">{t("footer.additionalLinks")}</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li><button onClick={goToCreate} className="hover:text-white">{t("footer.createNow")}</button></li>
                <li><button onClick={() => setAuthModal("login")} className="hover:text-white">{t("footer.memoryGallery")}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">{t("footer.legal")}</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">{t("footer.terms")}</a></li>
                <li><a href="#" className="hover:text-white">{t("footer.privacy")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">{t("footer.socialNetworks")}</h4>
              <div className="mt-4 flex gap-4">
                <a href="https://instagram.com/messagelove" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white">Instagram</a>
                <a href="https://tiktok.com/@messagelove" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white">TikTok</a>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-gray-500 sm:flex-row">
            <p>{t("footer.rights")}</p>
            <p>{t("footer.developedBy")} <a href="https://pedrolucas167.github.io/portfolio/" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline">Pedro Marques</a></p>
          </div>
        </div>
      </footer>

      {/* Notifications */}
      <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-full max-w-sm flex-col gap-3">
        {notifications.map((n) => (
          <div key={n.id} className={`pointer-events-auto rounded-2xl px-5 py-4 text-sm font-medium text-white shadow-xl ${n.type === "success" ? "bg-emerald-500" : n.type === "error" ? "bg-red-500" : n.type === "warning" ? "bg-amber-500" : "bg-sky-600"}`}>
            {n.message}
          </div>
        ))}
      </div>

      {/* Auth Modal */}
      {authModal !== "none" && (
        <AuthModal
          mode={authModal}
          isSubmitting={isSubmitting}
          onClose={() => setAuthModal("none")}
          onSwitchMode={(mode) => setAuthModal(mode)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          t={t}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   AUTH MODAL COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";

function getPasswordStrength(password: string): { strength: PasswordStrength; score: number } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { strength: "weak", score: 25 };
  if (score <= 3) return { strength: "medium", score: 50 };
  if (score <= 4) return { strength: "strong", score: 75 };
  return { strength: "very-strong", score: 100 };
}

function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case "weak": return "bg-red-500";
    case "medium": return "bg-yellow-500";
    case "strong": return "bg-green-500";
    case "very-strong": return "bg-emerald-400";
  }
}

function getPasswordStrengthLabel(strength: PasswordStrength, t: (key: TranslationKey) => string): string {
  switch (strength) {
    case "weak": return t("password.weak");
    case "medium": return t("password.medium");
    case "strong": return t("password.strong");
    case "very-strong": return t("password.veryStrong");
  }
}

type AuthModalProps = {
  mode: "login" | "register";
  isSubmitting: boolean;
  onClose: () => void;
  onSwitchMode: (mode: "login" | "register") => void;
  onLogin: (e: FormEvent<HTMLFormElement>) => void;
  onRegister: (e: FormEvent<HTMLFormElement>) => void;
  t: (key: TranslationKey) => string;
};

function AuthModal({ mode, isSubmitting, onClose, onSwitchMode, onLogin, onRegister, t }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

  const validations = {
    name: formData.name.trim().length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    password: formData.password.length >= 6,
    confirmPassword: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
  };

  const passwordRules = [
    { label: t("password.minChars"), valid: formData.password.length >= 6 },
    { label: t("password.uppercase"), valid: /[A-Z]/.test(formData.password) },
    { label: t("password.lowercase"), valid: /[a-z]/.test(formData.password) },
    { label: t("password.number"), valid: /\d/.test(formData.password) },
  ];

  const isLoginValid = validations.email && formData.password.length > 0;
  const isRegisterValid = validations.name && validations.email && validations.password && validations.confirmPassword && agreedToTerms;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "login") {
      onLogin(e);
    } else {
      if (!isRegisterValid) return;
      onRegister(e);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    setTouched({ name: false, email: false, password: false, confirmPassword: false });
    setAgreedToTerms(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSwitchMode = (newMode: "login" | "register") => {
    resetForm();
    onSwitchMode(newMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a0a2e] to-[#120820] shadow-2xl shadow-purple-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative p-8">
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <XIcon />
          </button>

          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2">
              <HeartGiftIcon />
              <span className="text-xl font-bold">Message<span className="text-fuchsia-400">Love</span></span>
            </div>
          </div>

          {mode === "login" ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-black">{t("auth.welcomeBack")}</h2>
                <p className="mt-1 text-sm text-gray-400">{t("auth.loginSubtitle")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email field */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t("auth.email")}</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                      placeholder={t("auth.emailPlaceholder")}
                      required
                      className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 ${
                        touched.email && !validations.email 
                          ? "border-red-500/50 focus:border-red-500" 
                          : "border-white/10 focus:border-fuchsia-500"
                      }`}
                    />
                    {touched.email && formData.email && (
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${validations.email ? "text-green-500" : "text-red-500"}`}>
                        {validations.email ? <CheckIcon /> : <XIcon />}
                      </div>
                    )}
                  </div>
                  {touched.email && !validations.email && formData.email && (
                    <p className="mt-1 text-xs text-red-400">{t("auth.invalidEmail")}</p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t("auth.password")}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-white"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                <div className="text-right">
                  <button type="button" className="text-sm text-fuchsia-400 transition hover:text-fuchsia-300">
                    {t("auth.forgotPassword")}
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isLoginValid}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 font-bold shadow-lg shadow-purple-500/25 transition hover:-translate-y-0.5 hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner />
                      <span>{t("auth.loggingIn")}</span>
                    </>
                  ) : (
                    t("auth.loginButton")
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#150a24] px-2 text-gray-500">{t("auth.or")}</span>
                </div>
              </div>

              {/* Social login buttons */}
              <div className="grid gap-3">
                <button 
                  type="button"
                  onClick={() => window.location.href = "/api/auth/google"}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 font-medium transition hover:bg-white/10"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t("auth.continueWithGoogle")}
                </button>
              </div>

              {/* Switch to register */}
              <p className="text-center text-sm text-gray-400">
                {t("auth.noAccount")}{" "}
                <button onClick={() => handleSwitchMode("register")} className="font-semibold text-fuchsia-400 transition hover:text-fuchsia-300">
                  {t("auth.signUpFree")}
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-black">{t("auth.createAccount")}</h2>
                <p className="mt-1 text-sm text-gray-400">{t("auth.registerSubtitle")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name field */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t("auth.fullName")}</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                      placeholder={t("auth.namePlaceholder")}
                      required
                      className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 ${
                        touched.name && !validations.name 
                          ? "border-red-500/50 focus:border-red-500" 
                          : "border-white/10 focus:border-fuchsia-500"
                      }`}
                    />
                    {touched.name && formData.name && (
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${validations.name ? "text-green-500" : "text-red-500"}`}>
                        {validations.name ? <CheckIcon /> : <XIcon />}
                      </div>
                    )}
                  </div>
                  {touched.name && !validations.name && formData.name && (
                    <p className="mt-1 text-xs text-red-400">{t("auth.nameMinChars")}</p>
                  )}
                </div>

                {/* Email field */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t("auth.email")}</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                      placeholder={t("auth.emailPlaceholder")}
                      required
                      className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 ${
                        touched.email && !validations.email 
                          ? "border-red-500/50 focus:border-red-500" 
                          : "border-white/10 focus:border-fuchsia-500"
                      }`}
                    />
                    {touched.email && formData.email && (
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${validations.email ? "text-green-500" : "text-red-500"}`}>
                        {validations.email ? <CheckIcon /> : <XIcon />}
                      </div>
                    )}
                  </div>
                  {touched.email && !validations.email && formData.email && (
                    <p className="mt-1 text-xs text-red-400">{t("auth.invalidEmail")}</p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t("auth.password")}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                      placeholder={t("auth.createPassword")}
                      required
                      className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-gray-500 ${
                        touched.password && !validations.password 
                          ? "border-red-500/50 focus:border-red-500" 
                          : "border-white/10 focus:border-fuchsia-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-white"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.strength)}`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.strength === "weak" ? "text-red-400" :
                          passwordStrength.strength === "medium" ? "text-yellow-400" :
                          "text-green-400"
                        }`}>
                          {getPasswordStrengthLabel(passwordStrength.strength, t)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {passwordRules.map((rule) => (
                          <div key={rule.label} className={`flex items-center gap-1 text-xs ${rule.valid ? "text-green-400" : "text-gray-500"}`}>
                            {rule.valid ? <CheckIcon /> : <span className="h-4 w-4 text-center">○</span>}
                            {rule.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password field */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t("auth.confirmPassword")}</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                      placeholder={t("auth.repeatPassword")}
                      required
                      className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-gray-500 ${
                        touched.confirmPassword && !validations.confirmPassword 
                          ? "border-red-500/50 focus:border-red-500" 
                          : "border-white/10 focus:border-fuchsia-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-white"
                    >
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>
                  {touched.confirmPassword && !validations.confirmPassword && formData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-400">{t("auth.passwordsNotMatch")}</p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                      agreedToTerms 
                        ? "border-fuchsia-500 bg-fuchsia-500 text-white" 
                        : "border-white/20 bg-white/5"
                    }`}
                  >
                    {agreedToTerms && <CheckIcon />}
                  </button>
                  <span className="text-xs text-gray-400">
                    {t("auth.agreeTerms")}{" "}
                    <a href="#" className="text-fuchsia-400 hover:underline">{t("auth.termsOfUse")}</a>
                    {" "}{t("auth.and")}{" "}
                    <a href="#" className="text-fuchsia-400 hover:underline">{t("auth.privacyPolicy")}</a>
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isRegisterValid}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 font-bold shadow-lg shadow-purple-500/25 transition hover:-translate-y-0.5 hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner />
                      <span>{t("auth.registering")}</span>
                    </>
                  ) : (
                    t("auth.registerButton")
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#150a24] px-2 text-gray-500">{t("auth.or")}</span>
                </div>
              </div>

              {/* Social login buttons */}
              <div className="grid gap-3">
                <button 
                  type="button"
                  onClick={() => window.location.href = "/api/auth/google"}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 font-medium transition hover:bg-white/10"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t("auth.continueWithGoogle")}
                </button>
              </div>

              {/* Switch to login */}
              <p className="text-center text-sm text-gray-400">
                {t("auth.haveAccount")}{" "}
                <button onClick={() => handleSwitchMode("login")} className="font-semibold text-fuchsia-400 transition hover:text-fuchsia-300">
                  {t("auth.doLogin")}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
