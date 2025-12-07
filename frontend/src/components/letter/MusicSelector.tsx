"use client";

import React, { useState, useCallback, useRef } from "react";

export interface MusicItem {
  id: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  duration?: number;
  url: string;
  type: "youtube" | "spotify";
  spotifyUri?: string;
  startTime?: number;
  endTime?: number;
  autoplay?: boolean;
}

interface MusicSelectorProps {
  selectedMusic: MusicItem | null;
  onSelect: (music: MusicItem | null) => void;
  translations: {
    title: string;
    subtitle: string;
  };
}

// Parse YouTube URL (including YouTube Music)
function parseYouTubeUrl(url: string): { videoId: string; startTime?: number } | null {
  const urlParams = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (urlParams) {
    const videoId = urlParams[1];
    const timeMatch = url.match(/[?&]t=(\d+)/);
    const startTime = timeMatch ? parseInt(timeMatch[1]) : undefined;
    return { videoId, startTime };
  }

  const patterns = [
    /(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /music\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      const timeMatch = url.match(/[?&](?:t|start)=(\d+)/);
      const startTime = timeMatch ? parseInt(timeMatch[1]) : undefined;
      return { videoId, startTime };
    }
  }
  return null;
}

// Parse Spotify URL
function parseSpotifyUrl(url: string): { type: "track" | "playlist" | "album"; id: string } | null {
  const patterns = [
    // Standard URLs: open.spotify.com/track/ID
    /open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/,
    // With language prefix: open.spotify.com/intl-pt/track/ID
    /open\.spotify\.com\/intl-[a-z]{2,3}\/(track|playlist|album)\/([a-zA-Z0-9]+)/,
    // Alternative domain
    /spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/,
    // With any path prefix (handles various regional formats)
    /spotify\.com\/.*?\/(track|playlist|album)\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      // Clean the ID - remove any query params that might have been captured
      const cleanId = match[2].split('?')[0].split('&')[0];
      return { type: match[1] as "track" | "playlist" | "album", id: cleanId };
    }
  }
  return null;
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Fetch video info from YouTube (using noembed - no API key needed)
async function fetchYouTubeInfo(videoId: string): Promise<{
  title: string;
  author: string;
  thumbnail: string;
} | null> {
  try {
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    const data = await response.json();
    if (data.title) {
      return {
        title: data.title,
        author: data.author_name || "YouTube",
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      };
    }
  } catch (error) {
    console.error("Error fetching YouTube info:", error);
  }
  return null;
}

// Fetch Spotify track info (using oEmbed - no API key needed)
async function fetchSpotifyInfo(trackUrl: string): Promise<{
  title: string;
  artist: string;
  thumbnail: string;
} | null> {
  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`);
    const data = await response.json();
    if (data.title) {
      // Title format is usually "Song Name - Artist Name" or just "Song Name"
      const parts = data.title.split(" - ");
      return {
        title: parts[0] || data.title,
        artist: parts[1] || "Spotify",
        thumbnail: data.thumbnail_url || "",
      };
    }
  } catch (error) {
    console.error("Error fetching Spotify info:", error);
  }
  return null;
}

export function MusicSelector({
  selectedMusic,
  onSelect,
  translations: t,
}: MusicSelectorProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Use local state that tracks the selected music
  const [startTime, setStartTime] = useState(selectedMusic?.startTime || 0);
  const [endTime, setEndTime] = useState(selectedMusic?.endTime || 180);
  const [autoplay, setAutoplay] = useState(selectedMusic?.autoplay !== false);
  const [duration] = useState(180);

  // Track the last music ID to detect changes
  const lastMusicIdRef = useRef(selectedMusic?.id);
  
  // Reset local state when a different music is selected externally
  if (selectedMusic?.id !== lastMusicIdRef.current) {
    lastMusicIdRef.current = selectedMusic?.id;
    setIsPlaying(false);
    if (selectedMusic?.type === "youtube") {
      // These will be applied on next render
      setStartTime(selectedMusic.startTime || 0);
      setEndTime(selectedMusic.endTime || 180);
      setAutoplay(selectedMusic.autoplay !== false);
    }
  }

  // Update music object when settings change
  const updateMusicSettings = useCallback(() => {
    if (selectedMusic && selectedMusic.type === "youtube") {
      const updated = {
        ...selectedMusic,
        startTime,
        endTime,
        autoplay,
      };
      onSelect(updated);
    }
  }, [selectedMusic, startTime, endTime, autoplay, onSelect]);

  const handleUrlSubmit = useCallback(async () => {
    if (!inputUrl.trim()) {
      setUrlError(null);
      return;
    }

    setIsLoading(true);
    setUrlError(null);

    // Try YouTube first
    const youtubeData = parseYouTubeUrl(inputUrl);
    if (youtubeData) {
      const info = await fetchYouTubeInfo(youtubeData.videoId);
      
      const music: MusicItem = {
        id: youtubeData.videoId,
        title: info?.title || "Vídeo do YouTube",
        artist: info?.author,
        thumbnail: info?.thumbnail || `https://img.youtube.com/vi/${youtubeData.videoId}/mqdefault.jpg`,
        url: inputUrl,
        type: "youtube",
        duration: 180,
        startTime: youtubeData.startTime || 0,
        endTime: 180,
        autoplay: true,
      };
      
      setStartTime(youtubeData.startTime || 0);
      setEndTime(180);
      setAutoplay(true);
      onSelect(music);
      setInputUrl("");
      setIsLoading(false);
      return;
    }

    // Try Spotify
    const spotifyData = parseSpotifyUrl(inputUrl);
    if (spotifyData) {
      // Fetch Spotify metadata
      const info = await fetchSpotifyInfo(inputUrl);
      
      onSelect({
        id: spotifyData.id,
        title: info?.title || (spotifyData.type === "track" ? "Música do Spotify" : "Playlist do Spotify"),
        artist: info?.artist,
        thumbnail: info?.thumbnail,
        url: inputUrl,
        type: "spotify",
        spotifyUri: `spotify:${spotifyData.type}:${spotifyData.id}`,
        autoplay: true,
      });
      setInputUrl("");
      setIsLoading(false);
      return;
    }

    setUrlError("Link inválido. Cole um link do YouTube, YouTube Music ou Spotify.");
    setIsLoading(false);
  }, [inputUrl, onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUrlSubmit();
    }
  };

  const handleRemoveMusic = () => {
    onSelect(null);
    setStartTime(0);
    setEndTime(180);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
        <p className="text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Selected YouTube Music Card */}
      {selectedMusic && selectedMusic.type === "youtube" && (
        <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
          {/* Video Preview / Player */}
          <div className="flex gap-4">
            {/* Left: Thumbnail or Player */}
            <div className="relative flex-shrink-0">
              {isPlaying ? (
                <div className="w-32 h-24 rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedMusic.id}?autoplay=1&start=${startTime}`}
                    title={selectedMusic.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="relative group cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedMusic.thumbnail || `https://img.youtube.com/vi/${selectedMusic.id}/mqdefault.jpg`}
                    alt={selectedMusic.title}
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all rounded-lg">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Duration badge */}
                  <span className="absolute bottom-1 left-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                    {formatTime(duration)}
                  </span>
                </button>
              )}
            </div>

            {/* Right: Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">{selectedMusic.title}</h3>
                <p className="text-gray-400 text-xs mt-1">{selectedMusic.artist}</p>
              </div>
              
              {/* Playback progress indicator */}
              <div className="mt-2">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-white/80 rounded-full" style={{ width: '0%' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500 text-xs font-mono">{formatTime(startTime)}</span>
                  <span className="text-gray-500 text-xs font-mono">{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => { setIsPlaying(false); handleRemoveMusic(); }}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all flex-shrink-0 self-start"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Time Slider Section */}
          <div className="space-y-3 pt-2 border-t border-gray-700">
            <div>
              <p className="text-gray-200 text-sm font-medium">Tempo de música</p>
              <p className="text-gray-500 text-xs">Defina o momento de início e fim da música.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-mono text-sm min-w-[42px]">{formatTime(startTime)}</span>
              
              <div className="flex-1 relative h-6 flex items-center">
                {/* Track background */}
                <div className="absolute inset-x-0 h-1 bg-gray-700 rounded-full" />
                
                {/* Active range */}
                <div 
                  className="absolute h-1 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full"
                  style={{
                    left: `${(startTime / duration) * 100}%`,
                    width: `${((endTime - startTime) / duration) * 100}%`
                  }}
                />
                
                {/* Start slider */}
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={startTime}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < endTime - 5) {
                      setStartTime(val);
                    }
                  }}
                  onMouseUp={updateMusicSettings}
                  onTouchEnd={updateMusicSettings}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
                
                {/* Start handle */}
                <div 
                  className="absolute w-4 h-4 bg-white rounded-full shadow-lg border-2 border-cyan-400 pointer-events-none z-20"
                  style={{ left: `calc(${(startTime / duration) * 100}% - 8px)` }}
                />
                
                {/* End handle */}
                <div 
                  className="absolute w-4 h-4 bg-white rounded-full shadow-lg border-2 border-cyan-400 pointer-events-none z-20"
                  style={{ left: `calc(${(endTime / duration) * 100}% - 8px)` }}
                />
              </div>
              
              <span className="text-cyan-400 font-mono text-sm min-w-[42px]">{formatTime(endTime)}</span>
            </div>

            {/* End time slider */}
            <div className="flex items-center gap-3 -mt-6">
              <span className="min-w-[42px]" />
              <div className="flex-1 relative h-6">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={endTime}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > startTime + 5) {
                      setEndTime(val);
                    }
                  }}
                  onMouseUp={updateMusicSettings}
                  onTouchEnd={updateMusicSettings}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="min-w-[42px]" />
            </div>
          </div>

          {/* Autoplay Toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-800/50 rounded-xl">
            <div>
              <p className="text-gray-200 text-sm">A música começará a ser reproduzida</p>
              <p className="text-gray-500 text-xs">automaticamente quando a página carregar.</p>
            </div>
            <button
              onClick={() => {
                setAutoplay(!autoplay);
                setTimeout(updateMusicSettings, 0);
              }}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                autoplay ? "bg-cyan-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  autoplay ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Spotify Card */}
      {selectedMusic && selectedMusic.type === "spotify" && (
        <div className="space-y-3">
          {/* Spotify Embed - Full Player */}
          <div className="relative">
            <iframe
              src={`https://open.spotify.com/embed/track/${selectedMusic.id}?utm_source=generator`}
              width="100%"
              height="152"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
            
            {/* Remove Button - Floating */}
            <button
              onClick={handleRemoveMusic}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500 text-white rounded-full transition-all z-10"
              title="Remover música"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* URL Input Section - Only show when no music selected */}
      {!selectedMusic && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => { setInputUrl(e.target.value); setUrlError(null); }}
              onKeyDown={handleKeyDown}
              placeholder="Cole o link do YouTube, YouTube Music ou Spotify..."
              className="w-full px-5 py-4 pl-12 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all outline-none"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">
              🔗
            </span>
            {isLoading && (
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </span>
            )}
          </div>

          {urlError && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <span>⚠️</span>
              <span>{urlError}</span>
            </div>
          )}

          <button
            onClick={handleUrlSubmit}
            disabled={!inputUrl.trim() || isLoading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Carregando..." : "Adicionar Música"}
          </button>

          {/* Platform badges */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full">
              <span className="text-sm">📺</span>
              <span className="text-xs text-red-600 font-medium">YouTube</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full">
              <span className="text-sm">🎵</span>
              <span className="text-xs text-red-600 font-medium">YT Music</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full">
              <span className="text-sm">🎧</span>
              <span className="text-xs text-green-600 font-medium">Spotify</span>
            </div>
          </div>
        </div>
      )}

      {/* Change music link */}
      {selectedMusic && (
        <button
          onClick={handleRemoveMusic}
          className="text-pink-500 hover:text-pink-600 font-medium text-sm transition-colors flex items-center gap-1"
        >
          <span>🎵</span> Selecione uma música diferente
        </button>
      )}
    </div>
  );
}

export default MusicSelector;
