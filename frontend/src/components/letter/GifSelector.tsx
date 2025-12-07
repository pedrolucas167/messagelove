"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";

export interface GifItem {
  id: string;
  url: string;
  preview: string;
  title: string;
}

interface GifSelectorProps {
  selectedGif: GifItem | null;
  onSelect: (gif: GifItem | null) => void;
  translations?: {
    title?: string;
    subtitle?: string;
    searchPlaceholder?: string;
  };
}

// GIPHY API - use your own key for production
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "GlVGYHkr3WSBnllca54iNt0yFbjz7L65";

interface GiphyImage {
  url: string;
  width: string;
  height: string;
}

interface GiphyGif {
  id: string;
  title: string;
  images: {
    original: GiphyImage;
    fixed_height: GiphyImage;
    fixed_width_small: GiphyImage;
    downsized: GiphyImage;
  };
}

// Categories
const categories = [
  { id: "love", emoji: "💕", label: "Amor", query: "love heart romantic" },
  { id: "kiss", emoji: "💋", label: "Beijo", query: "kiss" },
  { id: "hug", emoji: "🤗", label: "Abraço", query: "hug" },
  { id: "miss", emoji: "💭", label: "Saudade", query: "miss you" },
  { id: "cute", emoji: "🥰", label: "Fofo", query: "cute kawaii" },
  { id: "happy", emoji: "😊", label: "Feliz", query: "happy excited" },
  { id: "thanks", emoji: "🙏", label: "Obrigado", query: "thank you" },
  { id: "congrats", emoji: "🎉", label: "Parabéns", query: "congratulations party" },
  { id: "sorry", emoji: "😔", label: "Desculpa", query: "sorry apologize" },
  { id: "flowers", emoji: "🌹", label: "Flores", query: "flowers rose" },
  { id: "animals", emoji: "🐱", label: "Animais", query: "cute cat dog" },
  { id: "hearts", emoji: "❤️", label: "Corações", query: "hearts" },
  { id: "funny", emoji: "😂", label: "Engraçado", query: "funny lol" },
  { id: "dance", emoji: "💃", label: "Dança", query: "dance dancing" },
  { id: "reaction", emoji: "😮", label: "Reação", query: "reaction wow omg" },
];

export function GifSelector({ selectedGif, onSelect, translations }: GifSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("love");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default translations
  const t = {
    title: translations?.title || "🎬 GIFs Animados",
    subtitle: translations?.subtitle || "Adicione um GIF divertido",
    searchPlaceholder: translations?.searchPlaceholder || "Buscar GIFs...",
  };

  // Fetch GIFs from GIPHY API
  const fetchGifs = useCallback(async (query: string, newOffset = 0) => {
    console.log("[GifSelector] fetchGifs called with:", query, newOffset);
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        api_key: GIPHY_API_KEY,
        q: query,
        limit: "30",
        offset: newOffset.toString(),
        rating: "pg-13",
      });

      const url = `https://api.giphy.com/v1/gifs/search?${params}`;
      console.log("[GifSelector] Fetching:", url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log("[GifSelector] Response status:", response.status, "Data count:", data?.data?.length);

      const newGifs: GifItem[] = (data.data || []).map((gif: GiphyGif) => ({
        id: gif.id,
        url: gif.images.downsized?.url || gif.images.original.url,
        preview: gif.images.fixed_width_small?.url || gif.images.fixed_height.url,
        title: gif.title || "GIF",
      }));

      if (newOffset === 0) {
        setGifs(newGifs);
      } else {
        setGifs(prev => [...prev, ...newGifs]);
      }
      setOffset(newOffset + 30);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial category on mount
  useEffect(() => {
    const cat = categories.find(c => c.id === activeCategory);
    if (cat) {
      fetchGifs(cat.query, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setOffset(0);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      const cat = categories.find(c => c.id === activeCategory);
      if (cat) {
        fetchGifs(cat.query, 0);
      }
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchGifs(query, 0);
    }, 300);
  }, [activeCategory, fetchGifs]);

  // Category click
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery("");
    setOffset(0);
    const cat = categories.find(c => c.id === categoryId);
    if (cat) {
      fetchGifs(cat.query, 0);
    }
  };

  // Load more on scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      const query = searchQuery || categories.find(c => c.id === activeCategory)?.query || "love";
      fetchGifs(query, offset);
    }
  }, [isLoading, searchQuery, activeCategory, offset, fetchGifs]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">{t.title}</h3>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full px-5 py-3 pl-12 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-gray-700"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">🔍</span>
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                flex items-center gap-1.5
                ${activeCategory === cat.id && !searchQuery
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              <span>{cat.emoji}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* GIF Grid */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="max-h-[400px] overflow-y-auto rounded-xl bg-gray-50 p-2"
      >
        {isLoading && gifs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Carregando GIFs...</span>
            </div>
          </div>
        ) : gifs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl mb-3 block">😢</span>
            <p>Nenhum GIF encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif)}
                className={`
                  relative aspect-square rounded-lg overflow-hidden
                  transition-all duration-200 group
                  ${selectedGif?.id === gif.id
                    ? "ring-4 ring-purple-500 scale-95"
                    : "hover:scale-105 hover:shadow-lg"
                  }
                `}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {selectedGif?.id === gif.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {isLoading && gifs.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-3 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Selected GIF preview */}
      {selectedGif && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedGif.preview}
                alt={selectedGif.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{selectedGif.title}</div>
              <div className="text-sm text-gray-500">GIF selecionado ✨</div>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="flex items-center justify-center text-xs text-gray-400">
        <span>Powered by GIPHY</span>
      </div>
    </div>
  );
}

export default GifSelector;
