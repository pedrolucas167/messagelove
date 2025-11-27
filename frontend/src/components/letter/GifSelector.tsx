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
    { id: "l1", url: "https://media.giphy.com/media/placeholder1.gif", preview: "💕", title: "Corações voando" },
    { id: "l2", url: "https://media.giphy.com/media/placeholder2.gif", preview: "💖", title: "Amor infinito" },
    { id: "l3", url: "https://media.giphy.com/media/placeholder3.gif", preview: "💗", title: "Coração batendo" },
    { id: "l4", url: "https://media.giphy.com/media/placeholder4.gif", preview: "💝", title: "Presente de amor" },
  ],
  hug: [
    { id: "h1", url: "https://media.giphy.com/media/placeholder5.gif", preview: "🤗", title: "Abraço apertado" },
    { id: "h2", url: "https://media.giphy.com/media/placeholder6.gif", preview: "🫂", title: "Abraço carinhoso" },
  ],
  miss: [
    { id: "m1", url: "https://media.giphy.com/media/placeholder7.gif", preview: "😢", title: "Sinto sua falta" },
    { id: "m2", url: "https://media.giphy.com/media/placeholder8.gif", preview: "💭", title: "Pensando em você" },
  ],
  thank: [
    { id: "t1", url: "https://media.giphy.com/media/placeholder9.gif", preview: "🙏", title: "Muito obrigado" },
    { id: "t2", url: "https://media.giphy.com/media/placeholder10.gif", preview: "✨", title: "Gratidão" },
  ],
  happy: [
    { id: "ha1", url: "https://media.giphy.com/media/placeholder11.gif", preview: "😊", title: "Super feliz" },
    { id: "ha2", url: "https://media.giphy.com/media/placeholder12.gif", preview: "🥳", title: "Comemorando" },
  ],
  congrats: [
    { id: "c1", url: "https://media.giphy.com/media/placeholder13.gif", preview: "🎉", title: "Parabéns!" },
    { id: "c2", url: "https://media.giphy.com/media/placeholder14.gif", preview: "🎊", title: "Celebração" },
  ],
  heart: [
    { id: "he1", url: "https://media.giphy.com/media/placeholder15.gif", preview: "❤️", title: "Coração vermelho" },
    { id: "he2", url: "https://media.giphy.com/media/placeholder16.gif", preview: "💜", title: "Coração roxo" },
  ],
  cute: [
    { id: "cu1", url: "https://media.giphy.com/media/placeholder17.gif", preview: "🥰", title: "Tão fofo" },
    { id: "cu2", url: "https://media.giphy.com/media/placeholder18.gif", preview: "🐱", title: "Gatinho fofo" },
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
