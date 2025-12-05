"use client";

import React, { useState, useCallback } from "react";

export interface GifItem {
  id: string;
  url: string;
  preview: string;
  title: string;
}

interface GifSelectorProps {
  selectedGif: GifItem | null;
  onSelect: (gif: GifItem | null) => void;
  translations: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
  };
}

const gifCategories = [
  { id: "love", emoji: "💕", label: "Amor" },
  { id: "hug", emoji: "🤗", label: "Abraço" },
  { id: "miss", emoji: "💭", label: "Saudade" },
  { id: "thank", emoji: "🙏", label: "Obrigado" },
  { id: "happy", emoji: "😊", label: "Feliz" },
  { id: "congrats", emoji: "🎉", label: "Parabéns" },
  { id: "heart", emoji: "❤️", label: "Coração" },
  { id: "cute", emoji: "🥰", label: "Fofo" },
];

const mockGifs: Record<string, GifItem[]> = {
  love: [
    { id: "l1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDN4OHBrbGN2MmVpMW80Y3BuM2JyNXBraHB0ZDd2Z2RnMjd0Y3VoZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0xeJpnrWC4XWblEk/giphy.gif", preview: "💕", title: "Corações voando" },
    { id: "l2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWZ4d2p2NHRqcGxmNXg2OXJ2aWdtbHBxdnVlcW5lZHRiNjI3aWJ2ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYt5jPR6QX5pnqM/giphy.gif", preview: "💖", title: "Amor infinito" },
    { id: "l3", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHBwOGZlZHNhbThqOXR3d3Nxczl1eHViNHZhNmtwZm5yOWRpcnQ0bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26BRv0ThflsHCqDrG/giphy.gif", preview: "💗", title: "Coração batendo" },
    { id: "l4", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWt6YnR4YTNuaGNkNGZnNmNvYjl6MHF3OGxhZWR6bm4xMTV6ZGN6ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKoWXm3okO1kgHC/giphy.gif", preview: "💝", title: "Presente de amor" },
  ],
  hug: [
    { id: "h1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHlxaWVoMXQxMjRkc3RlZ3NxNmRkbnpnMGl3NnRuaWQ0dWptdGFodyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEdv6sy3ulljPMGdy/giphy.gif", preview: "🤗", title: "Abraço apertado" },
    { id: "h2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGRvMHk5cTJ0cjdxM25vdHB0d2dwY2Fhdmxka2Fxc3lxbDdnbTRsaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/llmZp6fCVb4ju/giphy.gif", preview: "🫂", title: "Abraço carinhoso" },
  ],
  miss: [
    { id: "m1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODd3cWZ6ZXRldGZ6OWZ5c2NxM3k3dHJiMHFjcWN0am8yZnJjbzh6NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlGQMo9dHNxVc1q/giphy.gif", preview: "😢", title: "Sinto sua falta" },
    { id: "m2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmZxZHh2aWJlcWRsMmN6bXhxcGl0OWRocTFjaHdmZ2N0MjNjYjRvZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0GqJfdLcrcpSbZf2/giphy.gif", preview: "💭", title: "Pensando em você" },
  ],
  thank: [
    { id: "t1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHR5ZXgxNnk1N2p0YnprcXppcWo1ZXV1MnBxMHVxNWxqZHNkZXByOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oz8xIsloV7zOmt81G/giphy.gif", preview: "🙏", title: "Muito obrigado" },
    { id: "t2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2JpZTBhNXRtMm5sOHBqaWE4bjZ4YTc5bXZwN2s1ZnBibmRqNWo4MyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6Zt6KHxJTbXCnSvu/giphy.gif", preview: "✨", title: "Gratidão" },
  ],
  happy: [
    { id: "ha1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjNtdWZvOXlhNjdsYXFpY2Z5cDQwY2Q2d25ydGJqaG00c3ZyeGM5YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oriO0OEd9QIDdllqo/giphy.gif", preview: "😊", title: "Super feliz" },
    { id: "ha2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWRncWpxZzd4YTJ5OG1xMjFhYmh1YXVhNHN4Y2FsbWF6MHZyYnI1aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/artj92V8o75VPL7AeQ/giphy.gif", preview: "🥳", title: "Comemorando" },
  ],
  congrats: [
    { id: "c1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmFjNnZxcnQ3emZrbXNvYzI5NTRjcXVqcXd5dWpxa3NhYnU1aXM0ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/g9582DNuQppxC/giphy.gif", preview: "🎉", title: "Parabéns!" },
    { id: "c2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHV4cjFnNW5wN2J1dWJxNjFoMGNjMWRiZGU2dHQ4NmZ0cWRicWQ5ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tOZ42Mg6pbTUPHW/giphy.gif", preview: "🎊", title: "Celebração" },
  ],
  heart: [
    { id: "he1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazFscmx4dDk5M2x2ZW9rbWFzdHVhaDJxd2JhaWZlMnF1OXl6anNqOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjHYibHwRL7mrNyo/giphy.gif", preview: "❤️", title: "Coração vermelho" },
    { id: "he2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjN3N2xoMDNiZHJhZ3NtYjExMnF4dThsYnFkMzQ1dWxxdmJlY3htaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4FGjNNXJIq8UMNDq/giphy.gif", preview: "💜", title: "Coração roxo" },
  ],
  cute: [
    { id: "cu1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG1lZ2hhMThqM2JtcGVibzlhc2h6cWM2OGxhY3V3ajluMjlhOW5oYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MDJ9IbxxvDUQM/giphy.gif", preview: "🥰", title: "Tão fofo" },
    { id: "cu2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTRxdnJ4MmNqNnBtd3h4YWt0dDZ2cWk5OW5lZWt4cnVtcGwwN3hqaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VbnUQpnihPSIgIXuZv/giphy.gif", preview: "🐱", title: "Gatinho fofo" },
  ],
};

export function GifSelector({ selectedGif, onSelect, translations: t }: GifSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GifItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiGrid, setShowEmojiGrid] = useState(true);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setShowEmojiGrid(false);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const allGifs = Object.values(mockGifs).flat();
    const filtered = allGifs.filter((gif) =>
      gif.title.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filtered);
    setIsSearching(false);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setShowEmojiGrid(false);
    setSearchResults(mockGifs[categoryId] || []);
  };

  const emojiAnimations = [
    "💕", "💖", "💗", "💝", "💘", "💓", "💞", "💜",
    "🥰", "😍", "🤗", "💫", "✨", "🌟", "⭐", "💐",
    "🌸", "🌺", "🌹", "🦋", "🐰", "🐻", "🐱", "🦊",
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
          <span className="text-2xl">🎬</span>
          {t.title}
        </h3>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowEmojiGrid(false)}
          placeholder={t.searchPlaceholder}
          className="w-full px-5 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
        {isSearching && (
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <svg
              className="animate-spin h-5 w-5 text-purple-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </span>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {gifCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              flex items-center gap-1.5
              ${activeCategory === cat.id
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {showEmojiGrid && !searchQuery && (
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
          {emojiAnimations.map((emoji, index) => (
            <div
              key={index}
              className="aspect-square flex items-center justify-center text-2xl"
              style={{
                animation: `bounce ${0.5 + (index % 4) * 0.2}s ease-in-out infinite`,
                animationDelay: `${index * 0.05}s`,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {searchResults.map((gif) => (
            <button
              key={gif.id}
              onClick={() => onSelect(gif)}
              className={`
                aspect-square rounded-xl
                flex items-center justify-center
                text-4xl
                transition-all duration-200
                border-2
                ${selectedGif?.id === gif.id
                  ? "border-purple-400 bg-purple-50 shadow-lg scale-105"
                  : "border-gray-200 bg-white hover:border-purple-200 hover:scale-105"
                }
              `}
              title={gif.title}
            >
              <span className="group-hover:animate-bounce">{gif.preview}</span>
            </button>
          ))}
        </div>
      )}

      {searchQuery && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">😢</span>
          <p>Nenhum GIF encontrado para &ldquo;{searchQuery}&rdquo;</p>
          <p className="text-sm">Tente outras palavras como: amor, abraço, saudade</p>
        </div>
      )}

      {selectedGif && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{selectedGif.preview}</div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">{selectedGif.title}</div>
              <div className="text-sm text-gray-500">GIF selecionado</div>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-400">
        GIFs powered by GIPHY
      </div>
    </div>
  );
}

export default GifSelector;
