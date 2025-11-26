"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { nanoid } from "nanoid";

type User = {
  id: string;
  name: string;
  email: string;
};

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

type Notification = {
  id: string;
  message: string;
  type: NotificationKind;
};

async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const finalHeaders = new Headers(headers);
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  if (rest.body && !(rest.body instanceof FormData) && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...rest, headers: finalHeaders });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  if (!response.ok) {
    const message = (data as { error?: string }).error ?? response.statusText;
    throw new Error(message);
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────────────────
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

const InfinityIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-6 w-6 inline-block ml-2">
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

const creationSteps = [
  { icon: <GiftIcon />, title: "Preencha os campos", description: "Siga o formulário simples e construa sua memória passo a passo." },
  { icon: <PaymentIcon />, title: "Pagamento seguro", description: "Use cartão de crédito ou PIX com total segurança." },
  { icon: <QRCodeIcon />, title: "QR Code e Link", description: "Receba instantaneamente o QR Code e link por e-mail." },
  { icon: <ShareIcon />, title: "Compartilhe a memória", description: "Surpreenda alguém ou guarde para sempre enviando o link." },
];

const trustItems = [
  { value: "10.000+", label: "memórias criadas em 2024" },
  { value: "4.97/5", label: "avaliação média", stars: true },
  { value: "85%", label: "dos clientes recomendam" },
  { value: "30+", label: "países alcançados" },
];

type ViewState = "welcome" | "dashboard" | "creation";
type AuthModalState = "none" | "login" | "register";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>("welcome");
  const [cards, setCards] = useState<Card[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [authModal, setAuthModal] = useState<AuthModalState>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    de: "",
    para: "",
    mensagem: "",
    youtubeVideoId: "",
    youtubeStartTime: "",
    foto: null as File | null,
  });

  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    const savedUser =
      typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser) as User);
      setView("dashboard");
    }
  }, []);

  useEffect(() => {
    if (token && currentUser) {
      loadCards(token);
    }
  }, [token, currentUser]);

  const pushNotification = (message: string, type: NotificationKind = "info") => {
    const id = nanoid();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
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
    pushNotification("Você saiu da sua conta.", "info");
  };

  const loadCards = async (authToken: string) => {
    try {
      const data = await apiRequest<Card[]>("/api/cards", {
        method: "GET",
        token: authToken,
      });
      setCards(data);
    } catch (error) {
      console.error(error);
      pushNotification("Erro ao carregar cartões", "error");
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiRequest<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      handleAuthSuccess(data);
      pushNotification("Login realizado com sucesso!", "success");
      event.currentTarget.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro no login";
      pushNotification(message, "error");
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
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      handleAuthSuccess(data);
      pushNotification(`Bem-vindo, ${data.user.name}!`, "success");
      event.currentTarget.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao cadastrar";
      pushNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      pushNotification("Faça login para criar cartões", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("de", createForm.de);
      formData.append("para", createForm.para);
      formData.append("mensagem", createForm.mensagem);
      if (createForm.youtubeVideoId) {
        formData.append("youtubeVideoId", createForm.youtubeVideoId);
      }
      if (createForm.youtubeStartTime) {
        formData.append("youtubeStartTime", createForm.youtubeStartTime);
      }
      if (createForm.foto) {
        formData.append("foto", createForm.foto);
      }

      await apiRequest("/api/cards", {
        method: "POST",
        body: formData,
        token,
      });

      pushNotification("Cartão criado com sucesso!", "success");
      setCreateForm({ de: "", para: "", mensagem: "", youtubeVideoId: "", youtubeStartTime: "", foto: null });
      setView("dashboard");
      await loadCards(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar cartão";
      pushNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedCards = useMemo(
    () =>
      cards.map((card) => ({
        ...card,
        createdDate: format(new Date(card.createdAt), "dd 'de' MMMM 'de' yyyy", {
          locale: ptBR,
        }),
      })),
    [cards]
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#3a0d60] via-[#241035] to-[#0d051d] text-white">
      <main className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 bg-gradient-to-b from-black/40 via-black/10 to-transparent py-6 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
            <div className="text-2xl font-bold tracking-wide">
              Message<span className="text-fuchsia-400">Love</span>
            </div>
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sair
              </button>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <button
                  onClick={() => setAuthModal("login")}
                  className="rounded-full border border-white/30 px-5 py-2 font-semibold text-white transition hover:bg-white/10"
                >
                  Entrar
                </button>
                <button
                  onClick={() => setAuthModal("register")}
                  className="rounded-full bg-white px-5 py-2 font-semibold text-fuchsia-700 shadow-lg shadow-fuchsia-900/30 transition hover:-translate-y-0.5"
                >
                  Cadastre-se
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl flex-1 space-y-24 px-6 pb-24 pt-12">
          {view === "welcome" && (
            <section className="space-y-24">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600/90 via-purple-700/80 to-indigo-800/80 p-10 shadow-2xl">
                <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-fuchsia-400/40 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 translate-y-20 rounded-full bg-purple-500/40 blur-3xl" />
                <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
                  <div className="space-y-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-[0.18em]">
                      Nova experiência MessageLove
                    </span>
                    <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
                      Crie memórias digitais que emocionam de verdade
                    </h1>
                    <p className="max-w-xl text-base text-white/80 sm:text-lg">
                      Transforme histórias em presentes inesquecíveis com fotos, vídeos, trilhas sonoras e surpresas interativas. Ideal para aniversários, casamentos ou para surpreender quem você ama.
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <button
                        onClick={() => setAuthModal("register")}
                        className="w-full rounded-2xl bg-white px-8 py-3 text-base font-semibold text-fuchsia-700 shadow-lg shadow-fuchsia-900/30 transition duration-200 hover:-translate-y-1 hover:shadow-2xl sm:w-auto"
                      >
                        Começar grátis
                      </button>
                      <button
                        onClick={() => setAuthModal("login")}
                        className="w-full rounded-2xl border border-white/40 px-8 py-3 text-base font-semibold text-white transition duration-200 hover:bg-white/10 sm:w-auto"
                      >
                        Já tenho conta
                      </button>
                    </div>
                    <dl className="grid gap-6 text-sm text-white/80 sm:grid-cols-3">
                      {heroStats.map((stat) => (
                        <div key={stat.label}>
                          <dt className="text-3xl font-black text-white">{stat.value}</dt>
                          <dd>{stat.label}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-6 -top-6 h-16 w-16 rounded-2xl border border-white/30" />
                    <div className="absolute -right-4 top-24 h-20 w-20 rounded-full bg-white/10 blur-xl" />
                    <div className="relative space-y-6 rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl font-semibold">01</span>
                        <div>
                          <p className="text-sm font-medium text-white/60">Prévia exclusiva</p>
                          <p className="text-lg font-semibold text-white">Mensagem com trilha única</p>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Acesso privado</p>
                        <p className="mt-2 text-xl font-semibold text-white">messagelove.app/ana-e-rafa</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white/10 p-4 text-white/80">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Emoções</p>
                          <p className="text-lg font-semibold">Chuva de emojis</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4 text-white/80">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Momentos</p>
                          <p className="text-lg font-semibold">Linha do tempo visual</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/20 px-4 py-3 text-white/80">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">❤</span>
                        <p className="text-sm">“Nunca vi algo tão emocionante, virou tradição na nossa família.”</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold sm:text-4xl">Presenteie com algo que ninguém espera</h2>
                  <p className="max-w-xl text-base text-gray-200">
                    MessageLove combina histórias, imagens, vídeos e interações para criar páginas personalizadas que surpreendem em qualquer ocasião. É fácil de montar, simples de compartilhar e inesquecível para quem recebe.
                  </p>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
                      <p className="text-sm uppercase tracking-[0.2em] text-fuchsia-200">Surpreenda</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Experiência imersiva</h3>
                      <p className="mt-3 text-sm text-gray-200">Adicione música, cronômetro especial e efeitos que fazem o coração acelerar.</p>
                    </article>
                    <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
                      <p className="text-sm uppercase tracking-[0.2em] text-fuchsia-200">Compartilhe</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Link + QR Code</h3>
                      <p className="mt-3 text-sm text-gray-200">Envie em segundos por mensagem, redes sociais ou entregue impresso, do jeitinho que preferir.</p>
                    </article>
                  </div>
                </div>
                <aside className="rounded-3xl border border-white/10 bg-gray-900/60 p-8 shadow-2xl backdrop-blur">
                  <h3 className="text-2xl font-semibold">Por que quem usa indica?</h3>
                  <ul className="mt-6 space-y-4 text-sm text-gray-200">
                    {whyChoose.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-fuchsia-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => (currentUser ? setView("creation") : setAuthModal("register"))}
                    className="mt-8 w-full rounded-2xl bg-fuchsia-600 px-8 py-3 text-base font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-fuchsia-500"
                  >
                    Quero montar meu cartão agora
                  </button>
                </aside>
              </div>

              <section className="space-y-10 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-xl">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-xl space-y-4">
                    <h2 className="text-3xl font-bold">Crie uma memória em 4 passos simples</h2>
                    <p className="text-gray-200">Sem complicação: cada etapa foi pensada para você finalizar em minutos e já receber tudo pronto para compartilhar.</p>
                  </div>
                  <button
                    onClick={() => (currentUser ? setView("creation") : setAuthModal("register"))}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-fuchsia-700 shadow-lg shadow-fuchsia-900/20 transition duration-200 hover:-translate-y-1"
                  >
                    Começar agora <span aria-hidden>→</span>
                  </button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {creationSteps.map((step, index) => (
                    <article
                      key={step.title}
                      className="group rounded-2xl border border-white/10 bg-gray-900/60 p-6 shadow-lg transition duration-200 hover:-translate-y-1"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold">{index + 1}</span>
                      <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                      <p className="mt-3 text-sm text-gray-200">{step.description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="grid gap-12 rounded-3xl border border-white/10 bg-gray-900/60 p-10 shadow-xl lg:grid-cols-2">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold">Confiança que emociona</h2>
                  <p className="text-gray-200">Quem cria com MessageLove sente orgulho de compartilhar. Somos referência em experiências digitais que fortalecem laços.</p>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {trustMetrics.map((metric) => (
                      <div key={metric.caption} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-3xl font-black text-white">{metric.value}</p>
                        <p className="mt-1 text-sm text-gray-200">{metric.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
                    <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-200">Impacto real</p>
                    <blockquote className="mt-4 text-lg font-semibold text-white">
                      “Foi a surpresa mais marcante do nosso aniversário. Todos choraram ao ver o vídeo com fotos antigas e mensagens dos amigos.”
                    </blockquote>
                    <p className="mt-3 text-sm text-gray-300">Ana &amp; Júlia • São Paulo/SP</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
                    <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-200">Além da tela</p>
                    <p className="mt-3 text-sm text-gray-200">
                      Muitas pessoas imprimem o QR Code e entregam junto a caixas de presente, flores ou convites especiais. Você escolhe o formato e nós cuidamos da magia digital.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-10 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-xl">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-xl space-y-4">
                    <h2 className="text-3xl font-bold">Escolha o plano que combina com a sua história</h2>
                    <p className="text-gray-200">Planos flexíveis para presentes pontuais ou coleções de memórias. Pagamento seguro e garantia de satisfação.</p>
                  </div>
                  <p className="rounded-full bg-fuchsia-500/20 px-4 py-2 text-sm font-semibold text-fuchsia-100">Promo especial: 20% off até o Natal</p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {plans.map((plan) => (
                    <article
                      key={plan.title}
                      className={`relative rounded-3xl border border-white/10 p-8 ${
                        plan.badge ? "bg-gray-900/60 shadow-2xl" : "bg-gray-900/40 shadow-lg"
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute right-6 top-6 rounded-full bg-fuchsia-600 px-4 py-1 text-xs font-semibold tracking-wide text-white">
                          {plan.badge}
                        </span>
                      )}
                      <h3 className="text-2xl font-semibold text-white">{plan.title}</h3>
                      <p className="mt-2 text-sm text-gray-300">{plan.subtitle}</p>
                      <div className="mt-6 flex items-baseline gap-2 text-white">
                        <span className="text-4xl font-black">{plan.price}</span>
                        <span className="text-sm text-gray-300">{plan === plans[0] ? "pagamento único" : "por memória adicional"}</span>
                      </div>
                      <ul className="mt-6 space-y-3 text-sm text-gray-200">
                        {plan.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <button
                        onClick={() => (currentUser ? setView("creation") : setAuthModal("register"))}
                        className={`mt-8 w-full rounded-2xl px-6 py-3 text-base font-semibold transition duration-200 ${
                          plan.badge
                            ? "bg-fuchsia-600 text-white hover:-translate-y-1 hover:bg-fuchsia-500"
                            : "border border-white/30 text-white hover:-translate-y-1 hover:bg-white/10"
                        }`}
                      >
                        {plan.cta}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="space-y-6 rounded-3xl border border-white/10 bg-gray-900/60 p-10 shadow-xl">
                <div className="max-w-3xl space-y-4">
                  <h2 className="text-3xl font-bold">Perguntas frequentes</h2>
                  <p className="text-gray-200">Tudo o que você precisa saber para criar sua primeira memória com confiança.</p>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      question: "O acesso expira?",
                      answer:
                        "Você escolhe: acesso vitalício ou por tempo limitado. Mesmo após encerrar, pode reativar quando quiser sem perder conteúdo.",
                    },
                    {
                      question: "Em quanto tempo recebo meu cartão?",
                      answer:
                        "Assim que concluir sua criação, geramos o link e o QR Code automaticamente. Você visualiza, edita e envia na mesma hora.",
                    },
                    {
                      question: "Posso imprimir ou embalar o QR Code?",
                      answer:
                        "Sim! Enviamos arquivos em alta resolução para você colocar em caixas de presente, convites, quadros ou até em um mural de fotos.",
                    },
                    {
                      question: "Como funciona o suporte?",
                      answer:
                        "Conte com atendimento humano 24h via chat e e-mail. Ajudamos a revisar textos, ajustar fotos e garantir que tudo esteja perfeito para o grande momento.",
                    },
                  ].map((item) => (
                    <details key={item.question} className="group rounded-2xl border border-white/10 bg-white/5 p-6">
                      <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-white">
                        {item.question}
                        <span className="ml-4 text-xl transition duration-200 group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-4 text-sm text-gray-200">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>

              <section className="grid gap-10 rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-600 via-rose-600 to-purple-700 p-10 shadow-2xl lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold sm:text-4xl">Pronto para criar o presente mais lembrado do ano?</h2>
                  <p className="max-w-2xl text-base text-white/80">
                    Em poucos minutos você personaliza tudo, envia para quem ama e guarda a reação para sempre. MessageLove é a forma moderna de dizer “eu te amo”.
                  </p>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <button
                      onClick={() => (currentUser ? setView("creation") : setAuthModal("register"))}
                      className="w-full rounded-2xl bg-white px-8 py-3 text-base font-semibold text-fuchsia-700 shadow-lg shadow-fuchsia-900/30 transition duration-200 hover:-translate-y-1 sm:w-auto"
                    >
                      Criar minha memória agora
                    </button>
                    <button
                      onClick={() => (currentUser ? setView("creation") : setAuthModal("login"))}
                      className="w-full rounded-2xl border border-white/40 px-8 py-3 text-base font-semibold text-white transition duration-200 hover:bg-white/10 sm:w-auto"
                    >
                      Ver como funciona
                    </button>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-white/10 px-10 py-12 text-center shadow-xl backdrop-blur">
                    <div className="absolute inset-0 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative space-y-3">
                      <p className="text-sm uppercase tracking-[0.3em] text-white/60">Suporte humano</p>
                      <p className="text-4xl font-black text-white">24 / 7</p>
                      <p className="text-sm text-white/70">Acompanhamos você até o momento da surpresa</p>
                    </div>
                  </div>
                </div>
              </section>
            </section>
          )}

          {view === "dashboard" && currentUser && (
            <section className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-gray-900/60 p-8 shadow-xl">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">Olá, {currentUser.name}!</h2>
                    <p className="text-gray-300">Aqui estão seus cartões criados.</p>
                  </div>
                  <button
                    onClick={() => setView("creation")}
                    className="rounded-2xl bg-fuchsia-600 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-fuchsia-500"
                  >
                    + Criar novo cartão
                  </button>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {formattedCards.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-gray-300">
                      Você ainda não criou nenhum cartão. Clique em “Criar novo cartão” para começar.
                    </div>
                  )}
                  {formattedCards.map((card) => (
                    <article key={card.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
                      <h3 className="text-xl font-semibold text-white">Para: {card.para}</h3>
                      <p className="mt-2 text-sm text-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
                        {card.mensagem}
                      </p>
                      <p className="mt-4 text-xs text-gray-400">Criado em: {card.createdDate}</p>
                      <a
                        href={`/cards/${card.id}`}
                        className="mt-4 inline-block text-sm font-semibold text-fuchsia-200 hover:text-fuchsia-100"
                      >
                        Ver cartão →
                      </a>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {view === "creation" && currentUser && (
            <section className="space-y-6">
              <h2 className="text-3xl font-bold">Crie um cartão especial</h2>
              <form
                onSubmit={handleCreateCard}
                className="space-y-4 rounded-3xl border border-white/10 bg-gray-900/60 p-8 shadow-xl"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    Remetente
                    <input
                      name="de"
                      value={createForm.de}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, de: event.target.value }))}
                      className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                      placeholder="Seu nome"
                      required
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    Destinatário
                    <input
                      name="para"
                      value={createForm.para}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, para: event.target.value }))}
                      className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                      placeholder="Quem vai receber"
                      required
                    />
                  </label>
                </div>
                <label className="flex flex-col text-sm font-medium text-gray-200">
                  Mensagem
                  <textarea
                    name="mensagem"
                    value={createForm.mensagem}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, mensagem: event.target.value }))}
                    className="mt-2 h-32 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                    placeholder="Escreva sua mensagem especial"
                    required
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    Imagem (opcional)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, foto: event.target.files?.[0] ?? null }))}
                      className="mt-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-white/80 file:rounded-lg file:border-0 file:bg-fuchsia-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    Link do YouTube (opcional)
                    <input
                      name="youtubeVideoId"
                      value={createForm.youtubeVideoId}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, youtubeVideoId: event.target.value }))}
                      className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                      placeholder="ID do vídeo (ex.: dQw4w9WgXcQ)"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    Início do vídeo em segundos (opcional)
                    <input
                      name="youtubeStartTime"
                      type="number"
                      min="0"
                      value={createForm.youtubeStartTime}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, youtubeStartTime: event.target.value }))}
                      className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                      placeholder="Ex.: 30"
                    />
                  </label>
                </div>
                <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setView("dashboard")}
                    className="text-sm font-semibold text-fuchsia-200 hover:text-fuchsia-100"
                  >
                    ← Voltar ao dashboard
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-2xl bg-fuchsia-600 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Enviando..." : "Criar cartão"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        <footer className="border-t border-white/10 bg-black/40 py-6 text-center text-sm text-gray-300">
          <p>
            Feito com <span aria-label="coração">❤</span> por
            <a
              href="https://pedrolucas167.github.io/portfolio/"
              target="_blank"
              rel="noreferrer"
              className="ml-1 font-medium text-fuchsia-200 hover:text-fuchsia-100"
            >
              Pedro Marques
            </a>
          </p>
          <p className="mt-2">MessageLove © {new Date().getFullYear()}</p>
        </footer>
      </main>

      <div className="pointer-events-none fixed top-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto rounded-2xl px-5 py-4 text-sm font-medium text-white shadow-lg transition ${
              notification.type === "success"
                ? "bg-emerald-500/90"
                : notification.type === "error"
                ? "bg-red-500/90"
                : notification.type === "warning"
                ? "bg-amber-500/90"
                : "bg-sky-600/90"
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {authModal !== "none" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gray-900/80 p-8 shadow-2xl">
            <button
              onClick={() => setAuthModal("none")}
              className="absolute right-4 top-4 text-gray-400 transition hover:text-white"
              aria-label="Fechar modal"
            >
              ×
            </button>

            {authModal === "login" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">Bem-vindo de volta!</h2>
                  <p className="text-sm text-gray-300">Acesse sua conta para continuar criando memórias.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    E-mail
                    <input
                      type="email"
                      name="email"
                      required
                      className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    Senha
                    <input
                      type="password"
                      name="password"
                      required
                      className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-fuchsia-600 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Entrando..." : "Entrar"}
                  </button>
                </form>
                <div className="text-center text-sm text-gray-300">
                  Não tem uma conta?{" "}
                  <button className="font-semibold text-fuchsia-200" onClick={() => setAuthModal("register")}>
                    Cadastre-se
                  </button>
                </div>
              </div>
            )}

            {authModal === "register" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">Crie sua conta</h2>
                  <p className="text-sm text-gray-300">Leva menos de um minuto para começar.</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    Nome
                    <input
                      type="text"
                      name="name"
                      required
                      className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    E-mail
                    <input
                      type="email"
                      name="email"
                      required
                      className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-200">
                    Senha
                    <input
                      type="password"
                      name="password"
                      required
                      className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-fuchsia-600 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Cadastrando..." : "Cadastrar"}
                  </button>
                </form>
                <div className="text-center text-sm text-gray-300">
                  Já tem conta?{" "}
                  <button className="font-semibold text-fuchsia-200" onClick={() => setAuthModal("login")}>
                    Faça login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
