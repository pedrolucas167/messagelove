"use client";

import React from "react";

type PaperStyle = "classic" | "romantic" | "vintage" | "modern" | "handwritten";

interface IntimateLetterProps {
  from: string;
  to: string;
  message: string;
  date?: string;
  paperStyle?: PaperStyle;
  selectedAnimal?: string;
  className?: string;
}

const paperStyleClasses: Record<PaperStyle, string> = {
  classic: "bg-amber-50 border-amber-200 shadow-amber-100",
  romantic: "bg-pink-50 border-pink-200 shadow-pink-100",
  vintage: "bg-yellow-50 border-yellow-700/30 shadow-yellow-100",
  modern: "bg-white border-gray-200 shadow-gray-100",
  handwritten: "bg-blue-50 border-blue-200 shadow-blue-100",
};

const paperBackgroundPatterns: Record<PaperStyle, string> = {
  classic: "bg-[url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 25h100M0 50h100M0 75h100\" fill=\"none\" stroke=\"%23d4a574\" stroke-opacity=\"0.1\" stroke-width=\"1\"/%3E%3C/svg%3E')]",
  romantic: "bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M30 10c-5 0-10 5-10 10s10 15 10 15 10-10 10-15-5-10-10-10z\" fill=\"%23ffc0cb\" fill-opacity=\"0.1\"/%3E%3C/svg%3E')]",
  vintage: "",
  modern: "",
  handwritten: "bg-[linear-gradient(transparent_95%,_rgba(59,130,246,0.1)_95%)] bg-[size:100%_28px]",
};

const fontStyles: Record<PaperStyle, string> = {
  classic: "font-serif",
  romantic: "font-serif italic",
  vintage: "font-serif",
  modern: "font-sans",
  handwritten: "font-cursive",
};

export function IntimateLetter({
  from,
  to,
  message,
  date,
  paperStyle = "classic",
  selectedAnimal,
  className = "",
}: IntimateLetterProps) {
  const formattedDate = date || new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-black/5 rounded-lg transform rotate-1 translate-x-1 translate-y-1" />
      <div className="absolute inset-0 bg-black/3 rounded-lg transform -rotate-0.5 -translate-x-0.5 translate-y-0.5" />
      
      <div
        className={`
          relative
          ${paperStyleClasses[paperStyle]}
          ${paperBackgroundPatterns[paperStyle]}
          ${fontStyles[paperStyle]}
          border-2
          rounded-lg
          p-8 md:p-12
          shadow-xl
          transition-all duration-300
          hover:shadow-2xl hover:-translate-y-1
        `}
      >
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
          <div
            className={`
              absolute top-0 right-0
              w-16 h-16
              transform rotate-45 translate-x-8 -translate-y-8
              ${paperStyle === "romantic" ? "bg-pink-100" : paperStyle === "vintage" ? "bg-yellow-100" : "bg-amber-100"}
              shadow-inner
            `}
          />
        </div>

        {/* Wax seal decoration */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div
            className={`
              w-12 h-12 rounded-full
              ${paperStyle === "romantic" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-red-600 to-red-800"}
              shadow-lg
              flex items-center justify-center
              text-white text-2xl
            `}
          >
            💝
          </div>
        </div>

        <div className="text-right text-sm opacity-60 mb-6 mt-4">
          {formattedDate}
        </div>

        <div className="mb-6">
          <span className="text-gray-600 text-lg">Para: </span>
          <span className="text-xl font-medium border-b border-gray-300 pb-1 inline-block min-w-[200px]">
            {to || "________________"}
          </span>
        </div>

        <div className="relative mb-8">
          <span className="absolute -left-4 -top-2 text-5xl opacity-20 select-none">&ldquo;</span>
          
          <div
            className={`
              text-lg md:text-xl leading-relaxed
              min-h-[200px]
              whitespace-pre-wrap
              px-4
              ${paperStyle === "handwritten" ? "leading-7" : ""}
            `}
          >
            {message || (
              <span className="text-gray-400 italic">
                Escreva aqui sua mensagem do coração...
              </span>
            )}
          </div>

          <span className="absolute -right-4 bottom-0 text-5xl opacity-20 select-none">&rdquo;</span>
        </div>

        {selectedAnimal && (
          <div className="absolute bottom-4 right-4 text-4xl opacity-80 animate-bounce">
            {selectedAnimal}
          </div>
        )}

        <div className="text-right mt-8">
          <span className="text-gray-600 text-lg">Com carinho, </span>
          <div className="text-2xl font-medium mt-1">
            {from || "________________"}
          </div>
        </div>

        {paperStyle === "romantic" && (
          <>
            <div className="absolute bottom-2 left-2 text-2xl opacity-30">💕</div>
            <div className="absolute top-16 right-4 text-xl opacity-20">✨</div>
          </>
        )}

        {paperStyle === "vintage" && (
          <div className="absolute inset-0 pointer-events-none rounded-lg border-4 border-yellow-800/10" />
        )}
      </div>
    </div>
  );
}

interface LetterEditorProps {
  value: {
    from: string;
    to: string;
    message: string;
    paperStyle: PaperStyle;
    selectedAnimal?: string;
  };
  onChange: (value: LetterEditorProps["value"]) => void;
  translations: {
    from: string;
    fromPlaceholder: string;
    to: string;
    toPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    paperStyle: string;
    styles: Record<PaperStyle, string>;
  };
}

export function LetterEditor({ value, onChange, translations: t }: LetterEditorProps) {
  const paperStyles: PaperStyle[] = ["classic", "romantic", "vintage", "modern", "handwritten"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.from}
          </label>
          <input
            type="text"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            placeholder={t.fromPlaceholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.to}
          </label>
          <input
            type="text"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            placeholder={t.toPlaceholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t.paperStyle}
        </label>
        <div className="flex flex-wrap gap-3">
          {paperStyles.map((style) => (
            <button
              key={style}
              onClick={() => onChange({ ...value, paperStyle: style })}
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200
                ${value.paperStyle === style
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              {t.styles[style]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.message}
        </label>
        <div className="relative">
          <textarea
            value={value.message}
            onChange={(e) => onChange({ ...value, message: e.target.value })}
            placeholder={t.messagePlaceholder}
            rows={8}
            className={`
              w-full px-5 py-4
              border border-gray-200 rounded-xl
              focus:ring-2 focus:ring-pink-400 focus:border-transparent
              transition-all
              resize-none
              text-lg
              ${value.paperStyle === "handwritten" ? "font-cursive" : value.paperStyle === "romantic" ? "font-serif italic" : ""}
            `}
          />
          <div className="absolute bottom-3 right-3 text-sm text-gray-400">
            {value.message.length} caracteres
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntimateLetter;
