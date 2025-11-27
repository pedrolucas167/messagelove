"use client";

import React, { useState } from "react";

export interface GiftSuggestion {
  id: string;
  type: "chocolate" | "book" | "flowers" | "dinner" | "custom";
  emoji: string;
  selected: boolean;
  customValue?: string;
}

interface GiftSelectorProps {
  gifts: GiftSuggestion[];
  onGiftsChange: (gifts: GiftSuggestion[]) => void;
  translations: {
    title: string;
    subtitle: string;
    chocolate: string;
    chocolateDesc: string;
    book: string;
    bookDesc: string;
    flowers: string;
    flowersDesc: string;
    dinner: string;
    dinnerDesc: string;
    bookInput: string;
  };
}

const defaultGifts: GiftSuggestion[] = [
  { id: "chocolate", type: "chocolate", emoji: "🍫", selected: false },
  { id: "book", type: "book", emoji: "📚", selected: false },
  { id: "flowers", type: "flowers", emoji: "💐", selected: false },
  { id: "dinner", type: "dinner", emoji: "🍽️", selected: false },
];

export function GiftSelector({ gifts, onGiftsChange, translations: t }: GiftSelectorProps) {
  const [bookTitle, setBookTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const toggleGift = (giftId: string) => {
    const updated = gifts.map((g) =>
      g.id === giftId ? { ...g, selected: !g.selected } : g
    );
    onGiftsChange(updated);
  };

  const updateBookTitle = (title: string) => {
    setBookTitle(title);
    const updated = gifts.map((g) =>
      g.type === "book" ? { ...g, customValue: title } : g
    );
    onGiftsChange(updated);
  };

  const giftInfo = {
    chocolate: { name: t.chocolate, desc: t.chocolateDesc },
    book: { name: t.book, desc: t.bookDesc },
    flowers: { name: t.flowers, desc: t.flowersDesc },
    dinner: { name: t.dinner, desc: t.dinnerDesc },
    custom: { name: "Personalizado", desc: "Adicione sua própria sugestão" },
  };

  const selectedCount = gifts.filter((g) => g.selected).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
          <span className="text-2xl">🎁</span>
          {t.title}
        </h3>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {gifts.map((gift) => {
          const info = giftInfo[gift.type];
          return (
            <button
              key={gift.id}
              onClick={() => toggleGift(gift.id)}
              className={`
                relative p-4 rounded-2xl
                transition-all duration-300
                border-2
                text-left
                group
                ${gift.selected
                  ? "border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg scale-[1.02]"
                  : "border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-50/50"
                }
              `}
            >
              {gift.selected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm">
                  ✓
                </div>
              )}

              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {gift.emoji}
              </div>

              <div className="font-medium text-gray-800 mb-1">{info.name}</div>

              <div className="text-xs text-gray-500">{info.desc}</div>
            </button>
          );
        })}
      </div>

      {gifts.find((g) => g.type === "book" && g.selected) && (
        <div className="animate-fadeIn">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📖 {t.bookInput}
          </label>
          <input
            type="text"
            value={bookTitle}
            onChange={(e) => updateBookTitle(e.target.value)}
            placeholder="Ex: O Pequeno Príncipe"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💝 Mensagem especial sobre o presente (opcional)
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Ex: Lembrei de você quando vi esse chocolate..."
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all resize-none"
        />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-3 text-center">Mais ideias de presentes</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { emoji: "🧸", name: "Pelúcia" },
            { emoji: "💌", name: "Carta" },
            { emoji: "🎬", name: "Cinema" },
            { emoji: "🎮", name: "Jogos" },
            { emoji: "💎", name: "Jóia" },
            { emoji: "👗", name: "Roupa" },
            { emoji: "🎨", name: "Arte" },
            { emoji: "🎸", name: "Música" },
          ].map((idea) => (
            <span
              key={idea.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600"
            >
              {idea.emoji} {idea.name}
            </span>
          ))}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <span className="text-sm font-medium text-gray-700">
                {selectedCount} {selectedCount === 1 ? "sugestão" : "sugestões"} de presente
              </span>
            </div>
            <button
              onClick={() => onGiftsChange(defaultGifts)}
              className="text-sm text-pink-600 hover:text-pink-800 transition-colors"
            >
              Limpar
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {gifts
              .filter((g) => g.selected)
              .map((g) => (
                <span key={g.id} className="text-2xl">
                  {g.emoji}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { defaultGifts };
export default GiftSelector;
