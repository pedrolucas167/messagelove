'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Card {
  id: string;
  recipient_name: string;
  sender_name: string;
  message: string;
  category: string;
  template: string;
  youtube_url?: string;
  youtube_title?: string;
  youtube_author?: string;
  spotify_uri?: string;
  music_type?: 'youtube' | 'spotify';
  music_start_time?: number;
  music_end_time?: number;
  music_autoplay?: boolean;
  gif_url?: string;
  audio_url?: string;
  relationship_date?: string;
  cute_animal?: string;
  gift?: string;
  created_at: string;
}

// Floating hearts component
const FloatingHearts = () => {
  const hearts = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 5) % 100}%`,
    delay: `${(i * 0.3) % 4}s`,
    duration: `${3 + (i % 3)}s`,
    size: 12 + (i % 3) * 8,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute animate-float opacity-30"
          style={{
            left: heart.left,
            bottom: '-50px',
            animationDelay: heart.delay,
            animationDuration: heart.duration,
          }}
        >
          <svg
            width={heart.size}
            height={heart.size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-pink-400"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
};

// Sparkle effect component
const Sparkles = () => {
  const sparkles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${(i * 3.33) % 100}%`,
    top: `${(i * 4) % 100}%`,
    delay: `${(i * 0.2) % 3}s`,
    size: 4 + (i % 3) * 2,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            animationDelay: sparkle.delay,
          }}
        >
          <div
            className="bg-yellow-300 rounded-full"
            style={{ width: sparkle.size, height: sparkle.size }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Emoji rain component - uses emojis from the card with improved distribution
const EmojiRain = ({ emojis }: { emojis: string[] }) => {
  // Create columns for better distribution
  const columns = 8;
  const emojisPerColumn = 4;
  
  const rainDrops = Array.from({ length: columns * emojisPerColumn }, (_, i) => {
    const column = i % columns;
    const row = Math.floor(i / columns);
    
    // Spread within column with some randomness (using deterministic "randomness")
    const baseLeft = (column / columns) * 100;
    const offsetLeft = ((i * 7) % 12) - 6; // -6 to +6 offset
    
    return {
      id: i,
      emoji: emojis[i % emojis.length],
      left: `${Math.max(0, Math.min(95, baseLeft + offsetLeft))}%`,
      delay: `${(row * 1.2) + ((i * 0.3) % 1.5)}s`,
      duration: `${5 + (i % 4)}s`,
      size: 18 + (i % 5) * 6,
      wobble: ((i * 13) % 3) - 1, // -1, 0, or 1 for subtle wobble direction
    };
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {rainDrops.map((drop) => (
        <div
          key={drop.id}
          className="absolute animate-emoji-fall"
          style={{
            left: drop.left,
            top: '-50px',
            animationDelay: drop.delay,
            animationDuration: drop.duration,
            fontSize: `${drop.size}px`,
            ['--wobble' as string]: drop.wobble,
          }}
        >
          {drop.emoji}
        </div>
      ))}
      <style jsx>{`
        @keyframes emojifall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          3% {
            opacity: 0.7;
          }
          50% {
            transform: translateY(50vh) translateX(calc(var(--wobble) * 20px)) rotate(180deg);
          }
          97% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(100vh) translateX(0) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-emoji-fall {
          animation: emojifall ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};

export default function CardPage() {
  const params = useParams();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const response = await fetch(`/api/cards/${params.id}`);
        if (!response.ok) {
          throw new Error('Card not found');
        }
        const data = await response.json();
        setCard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load card');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCard();
    }
  }, [params.id]);

  const openEnvelope = () => {
    setIsEnvelopeOpen(true);
    setTimeout(() => setShowContent(true), 800);
  };

  const formatRelationshipTime = (date: string) => {
    const start = new Date(date);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { years, months, days, hours, minutes, seconds };
  };

  const getYouTubeEmbedUrl = (url: string, startTime?: number, endTime?: number, autoplay?: boolean) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        let embedUrl = `https://www.youtube.com/embed/${match[1]}?`;
        if (startTime) embedUrl += `start=${startTime}&`;
        if (endTime) embedUrl += `end=${endTime}&`;
        if (autoplay) embedUrl += `autoplay=1&`;
        return embedUrl;
      }
    }
    return null;
  };

  const getSpotifyEmbedUrl = (uri: string) => {
    // Handle different Spotify formats
    const patterns = [
      /spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/,
      /spotify:track:([a-zA-Z0-9]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = uri.match(pattern);
      if (match) {
        return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <FloatingHearts />
        <div className="relative z-10">
          <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <FloatingHearts />
        <div className="relative z-10 text-center bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
          <div className="text-6xl mb-4">💔</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
          <p className="text-gray-600">{error || 'Card not found'}</p>
        </div>
      </div>
    );
  }

  // Collect emojis from the card for the rain effect
  const cardEmojis: string[] = ['💕', '✨', '💖', '💗', '💓'];
  if (card.cute_animal) cardEmojis.push(card.cute_animal);
  if (card.gift) cardEmojis.push(card.gift);
  // Add category-based emojis
  const categoryEmojis: Record<string, string[]> = {
    love: ['❤️', '💕', '💘', '💝'],
    friendship: ['🤗', '👯', '✌️', '🌟'],
    birthday: ['🎂', '🎈', '🎉', '🎁'],
    thanks: ['🙏', '💐', '🌸', '⭐'],
    congrats: ['🎊', '🏆', '👏', '🎯'],
    miss: ['💭', '🌙', '💫', '🥺'],
  };
  if (card.category && categoryEmojis[card.category]) {
    cardEmojis.push(...categoryEmojis[card.category]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-100 to-rose-200 relative overflow-hidden">
      {/* Animated background effects */}
      <FloatingHearts />
      <Sparkles />
      <EmojiRain emojis={cardEmojis} />
      
      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-pink-300/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-rose-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        {!showContent ? (
          /* Envelope animation */
          <div 
            className={`cursor-pointer transition-all duration-700 ${isEnvelopeOpen ? 'scale-50 opacity-0' : 'hover:scale-105'}`}
            onClick={openEnvelope}
          >
            <div className="relative">
              {/* Envelope glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 blur-2xl opacity-50 animate-pulse" />
              
              {/* Envelope */}
              <div className="relative bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl p-8 sm:p-12 shadow-2xl transform hover:rotate-1 transition-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl" />
                
                {/* Envelope flap */}
                <div className="absolute -top-1 left-0 right-0 h-24">
                  <svg viewBox="0 0 200 50" className="w-full h-full">
                    <path
                      d="M0,50 L100,0 L200,50"
                      fill="url(#flapGradient)"
                      className="drop-shadow-lg"
                    />
                    <defs>
                      <linearGradient id="flapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fce7f3" />
                        <stop offset="100%" stopColor="#fbcfe8" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Heart seal */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-4xl">💌</span>
                  </div>
                  <p className="text-pink-600 font-semibold text-lg">Para: {card.recipient_name}</p>
                  <p className="text-pink-400 text-sm animate-pulse">Toque para abrir ✨</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Card content */
          <div className="w-full max-w-2xl animate-fadeIn">
            <style jsx>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(30px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              .animate-fadeIn {
                animation: fadeIn 0.8s ease-out forwards;
              }
            `}</style>

            {/* Main card - Elegant design */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              
              {/* Elegant header */}
              <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-8 text-white">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />
                
                {/* Gold accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                
                <div className="relative z-10 text-center">
                  <p className="text-amber-300/80 text-sm tracking-[0.3em] uppercase mb-2">Uma carta especial para</p>
                  <h1 className="text-3xl md:text-4xl font-light tracking-wide">
                    {card.recipient_name}
                  </h1>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/50" />
                    <span className="text-amber-400">✦</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/50" />
                  </div>
                </div>
              </div>

              {/* Message content */}
              <div className="p-8 md:p-12">
                
                {/* Message with elegant typography */}
                <div className="relative mb-10">
                  {/* Opening quote */}
                  <div className="absolute -top-4 -left-2 text-6xl text-pink-200 font-serif select-none">&ldquo;</div>
                  
                  <blockquote className="relative z-10 text-gray-700 text-lg md:text-xl leading-relaxed whitespace-pre-wrap text-center font-light px-6" style={{ fontFamily: 'Georgia, serif' }}>
                    {card.message}
                  </blockquote>
                  
                  {/* Closing quote */}
                  <div className="absolute -bottom-8 -right-2 text-6xl text-pink-200 font-serif select-none">&rdquo;</div>
                </div>

                {/* Elegant divider */}
                <div className="flex items-center justify-center gap-4 my-8">
                  <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-pink-200" />
                  <span className="text-pink-300 text-sm">❧</span>
                  <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-pink-200" />
                </div>

                {/* Cute animal - Now positioned elegantly */}
                {card.cute_animal && (
                  <div className="flex justify-center mb-8">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative bg-gradient-to-br from-pink-50 to-purple-50 rounded-full p-6 border border-pink-100 shadow-lg">
                        <span className="text-5xl md:text-6xl block transform hover:scale-110 transition-transform cursor-default">
                          {card.cute_animal}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Relationship counter - Refined */}
                {card.relationship_date && (
                  <RelationshipDisplay date={card.relationship_date} formatTime={formatRelationshipTime} />
                )}

                {/* GIF - Clean presentation */}
                {card.gif_url && (
                  <div className="mb-8">
                    <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={card.gif_url} 
                        alt="GIF" 
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Music player - YouTube */}
                {card.music_type === 'youtube' && card.youtube_url && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Nossa Música</p>
                        {card.youtube_title && (
                          <p className="text-sm text-gray-500">{card.youtube_title}</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-lg">
                      <iframe
                        src={getYouTubeEmbedUrl(card.youtube_url, card.music_start_time, card.music_end_time, card.music_autoplay) || ''}
                        className="w-full aspect-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Spotify player */}
                {card.music_type === 'spotify' && card.spotify_uri && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                      </div>
                      <p className="font-medium text-gray-800">Nossa Música</p>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-lg bg-[#282828]">
                      <iframe
                        src={getSpotifyEmbedUrl(card.spotify_uri) || ''}
                        className="w-full h-[152px]"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}

                {/* Audio message - Glass design */}
                {card.audio_url && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <span className="text-lg">🎙️</span>
                      </div>
                      <p className="font-medium text-gray-800">Mensagem de Voz</p>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 rounded-xl blur-sm" />
                      <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100/50 shadow-sm">
                        <audio
                          ref={audioRef}
                          src={card.audio_url}
                          controls
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Gift - Subtle presentation */}
                {card.gift && (
                  <div className="text-center mb-8">
                    <p className="text-gray-500 text-sm mb-3">Um presente simbólico para você</p>
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-3 rounded-full border border-amber-100 shadow-sm">
                      <span className="text-3xl">{card.gift}</span>
                    </div>
                  </div>
                )}

                {/* Footer signature - Elegant */}
                <div className="text-center pt-8 mt-8 border-t border-gray-100">
                  <p className="text-gray-400 text-sm italic mb-3">Com carinho,</p>
                  <p className="text-2xl font-light text-gray-800 tracking-wide">
                    {card.sender_name}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2 text-pink-400">
                    <span>♡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Create your own button - Refined */}
            <div className="text-center mt-10">
              <Link
                href="/"
                className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-medium shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                <span>Criar minha carta</span>
                <span className="text-pink-400 group-hover:scale-110 transition-transform">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Relationship display component
function RelationshipDisplay({ date, formatTime }: { date: string; formatTime: (date: string) => { years: number; months: number; days: number; hours: number; minutes: number; seconds: number } }) {
  const [time, setTime] = useState(formatTime(date));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTime(date));
    }, 1000);
    return () => clearInterval(interval);
  }, [date, formatTime]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-center gap-2 mb-3 text-rose-600">
        <span className="text-2xl">💑</span>
        <span className="font-semibold">Juntos há</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-lg mx-auto">
        {[
          { label: 'Anos', value: time.years },
          { label: 'Meses', value: time.months },
          { label: 'Dias', value: time.days },
          { label: 'Horas', value: time.hours },
          { label: 'Min', value: time.minutes },
          { label: 'Seg', value: time.seconds },
        ].map((item) => (
          <div key={item.label} className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-2 text-center border border-pink-100">
            <div className="text-2xl font-bold text-rose-500">{item.value}</div>
            <div className="text-xs text-rose-400">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
