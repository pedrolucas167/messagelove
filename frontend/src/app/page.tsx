"use client";

import { FormEvent, useEffect, useState, useCallback } from "react";
import { format, Locale } from "date-fns";
import { ptBR, enUS, es, hi, ar } from "date-fns/locale";
import { nanoid } from "nanoid";
import {
  getTranslation,
  languageNames,
  isRTL,
  type Language,
} from "@/lib/translations-new";
import {
  IntimateLetter,
  CategorySelector,
  CuteAnimalSelector,
  MusicSelector,
  GiftSelector,
  GifSelector,
  defaultGifts,
  ProgressSteps,
  FloatingLabelInput,
  EnhancedTextarea,
  TipCard,
  ConfettiButton,
  AnimatedCard,
  ShareModal,
  AudioRecorder,
  MiniAudioPlayer,
  type Category,
  type MusicItem,
  type GiftSuggestion,
  type GifItem,
  type AudioMessage,
} from "@/components/letter";

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

type ViewState = "welcome" | "dashboard" | "create-step1" | "create-step2" | "create-step3" | "preview";
type AuthModalState = "none" | "login" | "register";
type PaperStyle = "classic" | "romantic" | "vintage" | "modern" | "handwritten";

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

function LanguageSelector({ 
  lang, 
  onChangeLang 
}: { 
  lang: Language; 
  onChangeLang: (lang: Language) => void;
}) {
  const [open, setOpen] = useState(false);
  const languages: { code: Language; flag: string }[] = [
    { code: "pt", flag: "🇧🇷" },
    { code: "en", flag: "🇺🇸" },
    { code: "es", flag: "🇪🇸" },
    { code: "hi", flag: "🇮🇳" },
    { code: "ar", flag: "🇸🇦" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
      >
        <span>{languages.find(l => l.code === lang)?.flag}</span>
        <span className="text-sm font-medium">{languageNames[lang]}</span>
        <svg className={`w-4 h-4 transition ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden z-50">
            {languages.map(({ code, flag }) => (
              <button
                key={code}
                onClick={() => { onChangeLang(code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${lang === code ? "bg-pink-50 text-pink-600" : "text-gray-700"}`}
              >
                <span className="text-xl">{flag}</span>
                <span className="font-medium">{languageNames[code]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationToast({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };
  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  return (
    <div className={`${colors[notification.type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slideIn`}>
      <span className="font-bold">{icons[notification.type]}</span>
      <span className="flex-1">{notification.message}</span>
      <button onClick={onClose} className="hover:opacity-70 transition">✕</button>
    </div>
  );
}

function AuthModal({
  mode,
  onClose,
  t,
  isSubmitting,
  onSubmit,
}: {
  mode: "login" | "register";
  onClose: () => void;
  t: (key: string) => string;
  isSubmitting: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>, mode: "login" | "register") => void;
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
        {/* Decorative header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 h-2" />
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all z-10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="text-3xl">{currentMode === "login" ? "👋" : "✨"}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {currentMode === "login" ? t("auth.welcome") : t("auth.createAccount")}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {currentMode === "login" 
                ? "Entre para acessar suas cartas" 
                : "Crie sua conta gratuitamente"}
            </p>
          </div>

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-gray-700 group-hover:text-gray-900">{t("auth.continueWithGoogle")}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400 font-medium">{t("auth.or")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={(e) => onSubmit(e, currentMode)} className="space-y-4">
            {/* Name field (register only) */}
            {currentMode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("auth.name")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    name="name"
                    type="text"
                    placeholder="Seu nome completo"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth.email")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth.password")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password link (login only) */}
            {currentMode === "login" && (
              <div className="text-right">
                <button type="button" className="text-sm text-pink-500 hover:text-pink-600 font-medium transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Aguarde...</span>
                </>
              ) : (
                <span>{currentMode === "login" ? t("auth.login") : t("auth.register")}</span>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              {currentMode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
              <button
                onClick={() => setCurrentMode(currentMode === "login" ? "register" : "login")}
                className="text-pink-500 font-semibold hover:text-pink-600 transition-colors"
              >
                {currentMode === "login" ? t("auth.register") : t("auth.login")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [lang, setLang] = useState<Language>("pt");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>("welcome");
  const [cards, setCards] = useState<Card[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [authModal, setAuthModal] = useState<AuthModalState>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [letterData, setLetterData] = useState({
    from: "",
    to: "",
    message: "",
    paperStyle: "classic" as PaperStyle,
  });
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [musicMode, setMusicMode] = useState<"single" | "playlist">("single");
  const [selectedMusic, setSelectedMusic] = useState<MusicItem | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [gifts, setGifts] = useState<GiftSuggestion[]>(defaultGifts);
  const [selectedGif, setSelectedGif] = useState<GifItem | null>(null);
  const [uploadedPhoto] = useState<File | null>(null);
  const [audioMessage, setAudioMessage] = useState<AudioMessage | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);

  const t = (key: string) => getTranslation(key as keyof typeof import("@/lib/translations-new").translations, lang);

  const getDateLocale = () => {
    const locales: Record<Language, Locale> = { pt: ptBR, en: enUS, es, hi, ar };
    return locales[lang] || ptBR;
  };

  const loadCards = useCallback(async (authToken: string) => {
    try {
      const data = await apiRequest<Card[]>("/api/cards", { method: "GET", token: authToken });
      setCards(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const [googleAuthSuccess, setGoogleAuthSuccess] = useState(false);

  useEffect(() => {
    // Check for Google OAuth cookies first
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const authToken = getCookie("auth_token");
    const userData = getCookie("user_data");
    
    if (authToken && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData)) as User;
        // Transfer to sessionStorage and clear cookies
        sessionStorage.setItem("token", authToken);
        sessionStorage.setItem("user", JSON.stringify(user));
        // Clear cookies
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setToken(authToken);
        setCurrentUser(user);
        setView("dashboard");
        setGoogleAuthSuccess(true);
        return;
      } catch (e) {
        console.error("Error parsing Google OAuth cookies:", e);
      }
    }
    
    // Check sessionStorage
    const savedToken = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    const savedUser = typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
    const savedLang = typeof window !== "undefined" ? localStorage.getItem("lang") as Language : null;
    
    if (savedLang && ["pt", "en", "es", "hi", "ar"].includes(savedLang)) {
      setLang(savedLang);
    }
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser) as User);
      setView("dashboard");
    }
  }, []);

  useEffect(() => {
    if (token && currentUser) loadCards(token);
  }, [token, currentUser, loadCards]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
  }, [lang]);

  const pushNotification = (message: string, type: NotificationKind = "info") => {
    const id = nanoid();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
  };

  // Show notification after Google OAuth success
  useEffect(() => {
    if (googleAuthSuccess) {
      pushNotification("Login com Google realizado com sucesso!", "success");
      setGoogleAuthSuccess(false);
    }
  }, [googleAuthSuccess]);

  const [pendingAction, setPendingAction] = useState<"create" | null>(null);

  const handleAuthSuccess = (payload: { token: string; user: User }) => {
    sessionStorage.setItem("token", payload.token);
    sessionStorage.setItem("user", JSON.stringify(payload.user));
    setToken(payload.token);
    setCurrentUser(payload.user);
    setAuthModal("none");
    
    if (pendingAction === "create") {
      setView("create-step1");
      setPendingAction(null);
    } else {
      setView("dashboard");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setToken(null);
    setCurrentUser(null);
    setCards([]);
    setView("welcome");
    pushNotification(t("msg.saved"), "info");
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>, mode: "login" | "register") => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email: form.get("email"), password: form.get("password") }
        : { name: form.get("name"), email: form.get("email"), password: form.get("password") };
      
      const data = await apiRequest<{ success: boolean; token: string; user: User }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      
      if (data.success && data.token && data.user) {
        handleAuthSuccess({ token: data.token, user: data.user });
        pushNotification(mode === "login" ? "Login realizado com sucesso!" : "Conta criada com sucesso!", "success");
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : t("msg.error"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startCreating = () => {
    if (currentUser) {
      setView("create-step1");
    } else {
      setPendingAction("create");
      setAuthModal("register");
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category.id);
    setView("create-step2");
  };

  const goToStep3 = () => {
    setView("create-step3");
  };

  const goToPreview = () => {
    setView("preview");
  };

  const handleSaveLetter = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("de", letterData.from);
      formData.append("para", letterData.to);
      formData.append("mensagem", letterData.message);
      if (selectedMusic) formData.append("youtubeVideoId", selectedMusic.id);
      if (uploadedPhoto) formData.append("foto", uploadedPhoto);
      if (audioMessage) {
        formData.append("audio", audioMessage.blob, "voice-message.webm");
        formData.append("audioDuration", String(audioMessage.duration));
      }
      
      const response = await apiRequest<{ id: string }>("/api/cards", { method: "POST", body: formData, token });
      setSavedCardId(response.id);
      setShowShareModal(true);
      pushNotification(t("msg.saved"), "success");
      await loadCards(token);
    } catch {
      pushNotification(t("msg.error"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSavedCardId(null);
    setView("dashboard");
    // Reset form
    setLetterData({ from: "", to: "", message: "", paperStyle: "classic" });
    setSelectedCategory(null);
    setSelectedAnimal(null);
    setSelectedMusic(null);
    setGifts(defaultGifts);
    setSelectedGif(null);
    setAudioMessage(null);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 ${isRTL(lang) ? "rtl" : "ltr"}`}>
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((n) => (
          <NotificationToast
            key={n.id}
            notification={n}
            onClose={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
          />
        ))}
      </div>

      {authModal !== "none" && (
        <AuthModal
          mode={authModal}
          onClose={() => {
            setAuthModal("none");
            setPendingAction(null);
          }}
          t={t}
          isSubmitting={isSubmitting}
          onSubmit={handleAuthSubmit}
        />
      )}

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => setView(currentUser ? "dashboard" : "welcome")} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xl shadow-lg">
                💝
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                MessageLove
              </span>
            </button>

            <div className="flex items-center gap-4">
              <LanguageSelector lang={lang} onChangeLang={setLang} />
              
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full border border-pink-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {currentUser.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModal("login")}
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-full hover:shadow-lg transition-all"
                >
                  {t("nav.login")}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {view === "welcome" && (
          <>
            <section className="relative py-20 lg:py-32 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-4xl mx-auto">
                  <span className="inline-block px-4 py-2 bg-pink-100 text-pink-600 rounded-full text-sm font-medium mb-6">
                    {t("hero.badge")}
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                    {t("hero.title")}{" "}
                    <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {t("hero.titleHighlight")}
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                    {t("hero.subtitle")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={startCreating}
                      className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <span>✨</span>
                      {t("hero.cta")}
                    </button>
                    <button className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-full border-2 border-gray-200 hover:border-pink-300 hover:text-pink-600 transition-all">
                      {t("hero.ctaSecondary")}
                    </button>
                  </div>
                </div>

                <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce">💕</div>
                <div className="absolute top-20 right-20 text-5xl opacity-20 animate-pulse">✨</div>
                <div className="absolute bottom-10 left-1/4 text-4xl opacity-20 animate-bounce">💝</div>
                <div className="absolute bottom-20 right-1/3 text-5xl opacity-20 animate-pulse">🦋</div>
              </div>
            </section>

            <section className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {t("features.title")}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { icon: "✉️", title: t("features.intimate.title"), desc: t("features.intimate.desc") },
                    { icon: "🎵", title: t("features.music.title"), desc: t("features.music.desc") },
                    { icon: "🎁", title: t("features.gifts.title"), desc: t("features.gifts.desc") },
                    { icon: "🎬", title: t("features.gifs.title"), desc: t("features.gifs.desc") },
                    { icon: "🐰", title: t("features.animals.title"), desc: t("features.animals.desc") },
                    { icon: "🔗", title: t("features.share.title"), desc: t("features.share.desc") },
                  ].map((feature, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 hover:shadow-lg transition-all group">
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="py-20">
              <div className="max-w-4xl mx-auto px-4 text-center">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl p-12 text-white">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Pronto para escrever sua carta?
                  </h2>
                  <p className="text-lg opacity-90 mb-8">
                    Crie uma mensagem especial em menos de 5 minutos
                  </p>
                  <button
                    onClick={startCreating}
                    className="px-8 py-4 bg-white text-pink-600 font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all"
                  >
                    Começar Agora ✨
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {view === "dashboard" && currentUser && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Olá, {currentUser.name}! 👋
                </h1>
                <p className="text-gray-600 mt-1">{t("nav.myLetters")}</p>
              </div>
              <button
                onClick={startCreating}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-full hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>✨</span>
                {t("nav.create")}
              </button>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">💌</div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Nenhuma carta ainda</h3>
                <p className="text-gray-500 mb-6">Crie sua primeira carta especial!</p>
                <button
                  onClick={startCreating}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-full hover:shadow-lg transition-all"
                >
                  Criar Minha Primeira Carta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <div key={card.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Para: <span className="font-medium text-gray-800">{card.para}</span></p>
                        <p className="text-sm text-gray-500">De: <span className="font-medium text-gray-800">{card.de}</span></p>
                      </div>
                      <span className="text-2xl">💌</span>
                    </div>
                    <p className="text-gray-600 line-clamp-3 mb-4">{card.mensagem}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(card.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: getDateLocale() })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "create-step1" && (
          <div className="max-w-5xl mx-auto px-4 py-12">
            <ProgressSteps
              currentStep={1}
              steps={[
                { id: 1, title: "Categoria", icon: "💝", description: "Escolha o tema" },
                { id: 2, title: "Carta", icon: "✉️", description: "Escreva a mensagem" },
                { id: 3, title: "Extras", icon: "🎁", description: "Personalize" },
                { id: 4, title: "Enviar", icon: "🚀", description: "Compartilhe" },
              ]}
            />
            <CategorySelector
              selected={selectedCategory}
              onSelect={handleCategorySelect}
              translations={{
                title: t("categories.title"),
                subtitle: t("categories.subtitle"),
                categories: {
                  love: { name: t("categories.love"), description: t("categories.loveDesc") },
                  friendship: { name: t("categories.friendship"), description: t("categories.friendshipDesc") },
                  family: { name: t("categories.family"), description: t("categories.familyDesc") },
                  gratitude: { name: t("categories.gratitude"), description: t("categories.gratitudeDesc") },
                  missing: { name: t("categories.missing"), description: t("categories.missingDesc") },
                  celebration: { name: t("categories.celebration"), description: t("categories.celebrationDesc") },
                },
              }}
            />
          </div>
        )}

        {view === "create-step2" && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <ProgressSteps
              currentStep={2}
              steps={[
                { id: 1, title: "Categoria", icon: "💝", description: "Escolha o tema" },
                { id: 2, title: "Carta", icon: "✉️", description: "Escreva a mensagem" },
                { id: 3, title: "Extras", icon: "🎁", description: "Personalize" },
                { id: 4, title: "Enviar", icon: "🚀", description: "Compartilhe" },
              ]}
              onStepClick={(step) => step === 1 && setView("create-step1")}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("letter.title")}</h2>
                  <p className="text-gray-500">Preencha os detalhes da sua carta</p>
                </div>

                <TipCard
                  icon="💡"
                  title="Dica"
                  tip="Cartas escritas à mão têm um toque especial. Seja autêntico e escreva do coração!"
                  variant="info"
                />

                <div className="grid grid-cols-2 gap-4">
                  <FloatingLabelInput
                    label={t("letter.from")}
                    value={letterData.from}
                    onChange={(value) => setLetterData({ ...letterData, from: value })}
                    placeholder={t("letter.fromPlaceholder")}
                    icon="✍️"
                    required
                  />
                  <FloatingLabelInput
                    label={t("letter.to")}
                    value={letterData.to}
                    onChange={(value) => setLetterData({ ...letterData, to: value })}
                    placeholder={t("letter.toPlaceholder")}
                    icon="💌"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">{t("letter.paperStyle")}</label>
                  <div className="flex flex-wrap gap-2">
                    {(["classic", "romantic", "vintage", "modern", "handwritten"] as PaperStyle[]).map((style) => (
                      <button
                        key={style}
                        onClick={() => setLetterData({ ...letterData, paperStyle: style })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                          letterData.paperStyle === style
                            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {t(`paper.${style}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    {t("letter.message")}
                    <span className="text-xs text-gray-400 font-normal">• Seja criativo!</span>
                  </label>
                  <EnhancedTextarea
                    value={letterData.message}
                    onChange={(value) => setLetterData({ ...letterData, message: value })}
                    placeholder={t("letter.messagePlaceholder")}
                    maxLength={2000}
                    rows={8}
                    suggestions={[
                      "Querido(a)...",
                      "Você é especial porque...",
                      "Lembro do dia em que...",
                      "Obrigado(a) por...",
                    ]}
                    onSuggestionClick={(suggestion) => 
                      setLetterData({ ...letterData, message: suggestion + " " })
                    }
                  />
                </div>

                <ConfettiButton
                  onClick={goToStep3}
                  disabled={!letterData.from || !letterData.to || !letterData.message}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar para Personalização →
                </ConfettiButton>
              </div>

              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-700">{t("preview.title")}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    Atualiza em tempo real ✨
                  </span>
                </div>
                <IntimateLetter
                  from={letterData.from}
                  to={letterData.to}
                  message={letterData.message}
                  paperStyle={letterData.paperStyle}
                  selectedAnimal={selectedAnimal || undefined}
                />
              </div>
            </div>
          </div>
        )}

        {view === "create-step3" && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-12">
                <div>
                  <ProgressSteps
                    currentStep={3}
                    steps={[
                      { number: 1, title: "Estilo", icon: "🎨" },
                      { number: 2, title: "Mensagem", icon: "✍️" },
                      { number: 3, title: "Extras", icon: "🎁" },
                      { number: 4, title: "Enviar", icon: "💌" },
                    ]}
                  />
                </div>

                <TipCard
                  icon="💡"
                  title="Dica de personalização"
                  tip="Adicione músicas, GIFs e presentes para tornar sua carta ainda mais especial! Todos os elementos são opcionais."
                />

                <AnimatedCard delay={0.1}>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <CuteAnimalSelector
                      selected={selectedAnimal}
                      onSelect={(animal) => setSelectedAnimal(animal?.emoji || null)}
                      title={t("animals.title")}
                      subtitle={t("animals.subtitle")}
                    />
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.2}>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <MusicSelector
                      mode={musicMode}
                      onModeChange={setMusicMode}
                      selectedMusic={selectedMusic}
                      onSelect={setSelectedMusic}
                      playlistUrl={playlistUrl}
                      onPlaylistUrlChange={setPlaylistUrl}
                      translations={{
                        title: t("music.title"),
                        subtitle: t("music.subtitle"),
                        single: t("music.single"),
                        playlist: t("music.playlist"),
                        searchPlaceholder: t("music.searchPlaceholder"),
                        playlistPlaceholder: t("music.playlistPlaceholder"),
                      }}
                    />
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.3}>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <GiftSelector
                      gifts={gifts}
                      onGiftsChange={setGifts}
                      translations={{
                        title: t("gifts.title"),
                        subtitle: t("gifts.subtitle"),
                        chocolate: t("gifts.chocolate"),
                        chocolateDesc: t("gifts.chocolateDesc"),
                        book: t("gifts.book"),
                        bookDesc: t("gifts.bookDesc"),
                        flowers: t("gifts.flowers"),
                        flowersDesc: t("gifts.flowersDesc"),
                        dinner: t("gifts.dinner"),
                        dinnerDesc: t("gifts.dinnerDesc"),
                        bookInput: t("gifts.bookInput"),
                      }}
                    />
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.4}>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <GifSelector
                      selectedGif={selectedGif}
                      onSelect={setSelectedGif}
                      translations={{
                        title: t("gifs.title"),
                        subtitle: t("gifs.subtitle"),
                        searchPlaceholder: t("gifs.searchPlaceholder"),
                      }}
                    />
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.5}>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <AudioRecorder
                      onAudioRecorded={setAudioMessage}
                      onAudioRemove={() => setAudioMessage(null)}
                      currentAudio={audioMessage}
                      maxDuration={60}
                      translations={{
                        title: "Mensagem de Voz 🎙️",
                        subtitle: "Grave uma mensagem pessoal e única",
                        record: "Gravar",
                        recording: "Gravando...",
                        stop: "Parar",
                        play: "Ouvir",
                        pause: "Pausar",
                        delete: "Excluir",
                        recordingTip: "Clique no microfone para começar",
                        playbackTip: "Sua mensagem está pronta!",
                      }}
                    />
                  </div>
                </AnimatedCard>

                <div className="flex gap-4">
                  <button
                    onClick={() => setView("create-step2")}
                    className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    ← Voltar
                  </button>
                  <ConfettiButton
                    onClick={goToPreview}
                    className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    Ver Prévia →
                  </ConfettiButton>
                </div>
              </div>

              <div className="lg:sticky lg:top-24 lg:self-start">
                <h3 className="text-lg font-medium text-gray-700 mb-4">{t("preview.title")}</h3>
                <IntimateLetter
                  from={letterData.from}
                  to={letterData.to}
                  message={letterData.message}
                  paperStyle={letterData.paperStyle}
                  selectedAnimal={selectedAnimal || undefined}
                />
              </div>
            </div>
          </div>
        )}

        {view === "preview" && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="mb-12">
              <ProgressSteps
                currentStep={4}
                steps={[
                  { number: 1, title: "Estilo", icon: "🎨" },
                  { number: 2, title: "Mensagem", icon: "✍️" },
                  { number: 3, title: "Extras", icon: "🎁" },
                  { number: 4, title: "Enviar", icon: "💌" },
                ]}
              />
            </div>

            <TipCard
              icon="💝"
              title="Sua carta está linda!"
              tip="Revise uma última vez antes de enviar. Você pode voltar e editar se necessário."
              variant="success"
            />

            <AnimatedCard delay={0.1} className="my-8">
              <IntimateLetter
                from={letterData.from}
                to={letterData.to}
                message={letterData.message}
                paperStyle={letterData.paperStyle}
                selectedAnimal={selectedAnimal || undefined}
              />
            </AnimatedCard>

            <AnimatedCard delay={0.2}>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  Extras incluídos:
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedAnimal && (
                    <span className="inline-flex items-center gap-2 px-3 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-medium hover:scale-105 transition-transform cursor-default">
                      {selectedAnimal} Bichinho
                    </span>
                  )}
                  {selectedMusic && (
                    <span className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:scale-105 transition-transform cursor-default">
                      🎵 {selectedMusic.title}
                    </span>
                  )}
                  {gifts.filter(g => g.selected).map(g => (
                    <span key={g.id} className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium hover:scale-105 transition-transform cursor-default">
                      {g.emoji} {g.type === "book" && g.customValue ? g.customValue : g.type}
                    </span>
                  ))}
                  {selectedGif && (
                    <span className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:scale-105 transition-transform cursor-default">
                      🎬 GIF incluído
                    </span>
                  )}
                  {audioMessage && (
                    <MiniAudioPlayer audio={audioMessage} />
                  )}
                  {!selectedAnimal && !selectedMusic && gifts.filter(g => g.selected).length === 0 && !selectedGif && !audioMessage && (
                    <span className="text-gray-400 text-sm italic">
                      Nenhum extra adicionado (sua mensagem é o mais importante! 💕)
                    </span>
                  )}
                </div>
              </div>
            </AnimatedCard>

            <div className="flex gap-4">
              <button
                onClick={() => setView("create-step3")}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                ← Editar
              </button>
              <ConfettiButton
                onClick={handleSaveLetter}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Salvando..." : "Salvar e Compartilhar ✨"}
              </ConfettiButton>
            </div>

            {/* Share Modal */}
            {showShareModal && savedCardId && (
              <ShareModal
                isOpen={showShareModal}
                onClose={handleCloseShareModal}
                cardId={savedCardId}
                cardTitle={`Carta para ${letterData.to}`}
              />
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-xl">
                💝
              </div>
              <span className="text-xl font-bold">MessageLove</span>
            </div>
            <p className="text-gray-400 text-sm">
              {t("footer.copyright")}
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition">{t("footer.privacy")}</a>
              <a href="#" className="text-gray-400 hover:text-white transition">{t("footer.terms")}</a>
              <a href="#" className="text-gray-400 hover:text-white transition">{t("footer.contact")}</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .font-cursive {
          font-family: 'Caveat', 'Dancing Script', cursive;
        }
      `}</style>
    </div>
  );
}
