"use client";

import React, { useState, useCallback } from "react";

export interface MusicItem {
  id: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  url: string;
  type: "video" | "playlist";
}

interface MusicSelectorProps {
  mode: "single" | "playlist";
  onModeChange: (mode: "single" | "playlist") => void;
  selectedMusic: MusicItem | null;
  onSelect: (music: MusicItem | null) => void;
  playlistUrl: string;
  onPlaylistUrlChange: (url: string) => void;
  translations: {
    title: string;
    subtitle: string;
    single: string;
    playlist: string;
    searchPlaceholder: string;
    playlistPlaceholder: string;
  };
}

const mockSearchResults: MusicItem[] = [
  {
    id: "1",
    title: "Perfect - Ed Sheeran",
    artist: "Ed Sheeran",
    thumbnail: "🎵",
    url: "https://youtube.com/watch?v=example1",
    type: "video",
  },
  {
    id: "2",
    title: "All of Me - John Legend",
    artist: "John Legend",
    thumbnail: "🎵",
    url: "https://youtube.com/watch?v=example2",
    type: "video",
  },
  {
    id: "3",
    title: "A Thousand Years - Christina Perri",
    artist: "Christina Perri",
    thumbnail: "🎵",
    url: "https://youtube.com/watch?v=example3",
    type: "video",
  },
  {
    id: "4",
    title: "Thinking Out Loud - Ed Sheeran",
    artist: "Ed Sheeran",
    thumbnail: "🎵",
    url: "https://youtube.com/watch?v=example4",
    type: "video",
  },
  {
    id: "5",
    title: "Can't Help Falling In Love - Elvis Presley",
    artist: "Elvis Presley",
    thumbnail: "🎵",
    url: "https://youtube.com/watch?v=example5",
    type: "video",
  },
];

export function MusicSelector({
  mode,
  onModeChange,
  selectedMusic,
  onSelect,
  playlistUrl,
  onPlaylistUrlChange,
  translations: t,
}: MusicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MusicItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const filtered = mockSearchResults.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.artist?.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered);
    setIsSearching(false);
  }, []);

  const validatePlaylistUrl = (url: string): boolean => {
    const youtubePlaylistRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(playlist\?list=|watch\?.*list=)[a-zA-Z0-9_-]+/;
    const spotifyPlaylistRegex = /^(https?:\/\/)?(open\.)?spotify\.com\/(playlist|album)\/[a-zA-Z0-9]+/;
    return youtubePlaylistRegex.test(url) || spotifyPlaylistRegex.test(url);
  };

  const isValidPlaylist = playlistUrl ? validatePlaylistUrl(playlistUrl) : false;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
          <span className="text-2xl">🎵</span>
          {t.title}
        </h3>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => onModeChange("single")}
            className={`
              px-6 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${mode === "single"
                ? "bg-white text-pink-600 shadow-md"
                : "text-gray-600 hover:text-gray-800"
              }
            `}
          >
            🎤 {t.single}
          </button>
          <button
            onClick={() => onModeChange("playlist")}
            className={`
              px-6 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${mode === "playlist"
                ? "bg-white text-purple-600 shadow-md"
                : "text-gray-600 hover:text-gray-800"
              }
            `}
          >
            📀 {t.playlist}
          </button>
        </div>
      </div>

      {mode === "single" ? (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full px-5 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
            {isSearching && (
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg
                  className="animate-spin h-5 w-5 text-pink-500"
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

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((music) => (
                <button
                  key={music.id}
                  onClick={() => {
                    onSelect(music);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl
                    transition-all duration-200
                    ${selectedMusic?.id === music.id
                      ? "bg-pink-100 border-2 border-pink-400"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }
                  `}
                >
                  <span className="text-2xl">{music.thumbnail}</span>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-800">{music.title}</div>
                    {music.artist && (
                      <div className="text-sm text-gray-500">{music.artist}</div>
                    )}
                  </div>
                  {selectedMusic?.id === music.id && (
                    <span className="text-pink-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedMusic && !searchResults.length && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎵</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{selectedMusic.title}</div>
                  {selectedMusic.artist && (
                    <div className="text-sm text-gray-500">{selectedMusic.artist}</div>
                  )}
                </div>
                <button
                  onClick={() => onSelect(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="url"
              value={playlistUrl}
              onChange={(e) => onPlaylistUrlChange(e.target.value)}
              placeholder={t.playlistPlaceholder}
              className={`
                w-full px-5 py-3 pl-12 border rounded-xl
                focus:ring-2 focus:border-transparent transition-all
                ${playlistUrl && !isValidPlaylist
                  ? "border-red-300 focus:ring-red-400"
                  : playlistUrl && isValidPlaylist
                  ? "border-green-300 focus:ring-green-400"
                  : "border-gray-200 focus:ring-purple-400"
                }
              `}
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔗
            </span>
            {playlistUrl && (
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {isValidPlaylist ? "✅" : "❌"}
              </span>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-xl">📺</span> YouTube
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-xl">🎧</span> Spotify
            </div>
          </div>

          {isValidPlaylist && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📀</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Playlist adicionada!</div>
                  <div className="text-sm text-gray-500 truncate">{playlistUrl}</div>
                </div>
                <button
                  onClick={() => onPlaylistUrlChange("")}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-3 text-center">Sugestões populares</p>
        <div className="flex flex-wrap justify-center gap-2">
          {["💕 Românticas", "😢 Saudade", "🎉 Alegres", "🌙 Calmas", "🎸 Rock", "🎹 Clássicas"].map(
            (tag) => (
              <button
                key={tag}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors"
              >
                {tag}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default MusicSelector;
