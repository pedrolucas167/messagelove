"use client";

import React from "react";

export interface CuteAnimal {
  id: string;
  emoji: string;
  name: string;
  animation?: string;
}

export const cuteAnimals: CuteAnimal[] = [
  { id: "bear", emoji: "🐻", name: "Ursinho", animation: "animate-bounce" },
  { id: "bunny", emoji: "🐰", name: "Coelhinho", animation: "animate-pulse" },
  { id: "cat", emoji: "🐱", name: "Gatinho", animation: "animate-bounce" },
  { id: "dog", emoji: "🐶", name: "Cachorrinho", animation: "animate-pulse" },
  { id: "panda", emoji: "🐼", name: "Panda", animation: "animate-bounce" },
  { id: "unicorn", emoji: "🦄", name: "Unicórnio", animation: "animate-pulse" },
  { id: "penguin", emoji: "🐧", name: "Pinguim", animation: "animate-bounce" },
  { id: "fox", emoji: "🦊", name: "Raposinha", animation: "animate-pulse" },
  { id: "koala", emoji: "🐨", name: "Coala", animation: "animate-bounce" },
  { id: "hamster", emoji: "🐹", name: "Hamster", animation: "animate-pulse" },
  { id: "owl", emoji: "🦉", name: "Corujinha", animation: "animate-bounce" },
  { id: "deer", emoji: "🦌", name: "Cervinho", animation: "animate-pulse" },
  { id: "butterfly", emoji: "🦋", name: "Borboleta", animation: "animate-bounce" },
  { id: "dolphin", emoji: "🐬", name: "Golfinho", animation: "animate-pulse" },
  { id: "sloth", emoji: "🦥", name: "Preguiça", animation: "animate-bounce" },
  { id: "hedgehog", emoji: "🦔", name: "Porco-espinho", animation: "animate-pulse" },
];

export const heartEmojis = ["💕", "💖", "💗", "💝", "💘", "💓", "💞", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🖤", "🤎"];

export const sparkleEmojis = ["✨", "⭐", "🌟", "💫", "🌸", "🌺", "🌻", "🌷", "🌹", "🏵️", "💐", "🪻", "🪷"];

interface CuteAnimalSelectorProps {
  selected: string | null;
  onSelect: (animal: CuteAnimal | null) => void;
  title?: string;
  subtitle?: string;
}

export function CuteAnimalSelector({
  selected,
  onSelect,
  title = "Escolha um Bichinho Fofo",
  subtitle = "Adicione mais fofura à sua carta",
}: CuteAnimalSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {/* None option */}
        <button
          onClick={() => onSelect(null)}
          className={`
            aspect-square rounded-xl
            flex items-center justify-center
            text-2xl
            transition-all duration-200
            border-2
            ${!selected
              ? "border-pink-400 bg-pink-50 shadow-lg scale-105"
              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            }
          `}
          title="Nenhum"
        >
          <span className="text-gray-400">✕</span>
        </button>

        {cuteAnimals.map((animal) => (
          <button
            key={animal.id}
            onClick={() => onSelect(animal)}
            className={`
              aspect-square rounded-xl
              flex items-center justify-center
              text-3xl
              transition-all duration-200
              border-2
              ${selected === animal.emoji
                ? "border-pink-400 bg-pink-50 shadow-lg scale-110"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:scale-105"
              }
            `}
            title={animal.name}
          >
            <span className={selected === animal.emoji ? animal.animation : ""}>
              {animal.emoji}
            </span>
          </button>
        ))}
      </div>

      {/* Heart emojis section */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-3 text-center">Ou escolha um coração</p>
        <div className="flex flex-wrap justify-center gap-2">
          {heartEmojis.map((emoji, index) => (
            <button
              key={`heart-${index}`}
              onClick={() => onSelect({ id: `heart-${index}`, emoji, name: "Coração" })}
              className={`
                w-10 h-10 rounded-full
                flex items-center justify-center
                text-xl
                transition-all duration-200
                ${selected === emoji
                  ? "bg-pink-100 shadow-lg scale-110"
                  : "bg-gray-50 hover:bg-gray-100 hover:scale-105"
                }
              `}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Sparkle/Nature emojis */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-3 text-center">Ou algo especial</p>
        <div className="flex flex-wrap justify-center gap-2">
          {sparkleEmojis.map((emoji, index) => (
            <button
              key={`sparkle-${index}`}
              onClick={() => onSelect({ id: `sparkle-${index}`, emoji, name: "Especial" })}
              className={`
                w-10 h-10 rounded-full
                flex items-center justify-center
                text-xl
                transition-all duration-200
                ${selected === emoji
                  ? "bg-purple-100 shadow-lg scale-110"
                  : "bg-gray-50 hover:bg-gray-100 hover:scale-105"
                }
              `}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Selected display */}
      {selected && (
        <div className="text-center pt-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full">
            <span className="text-3xl animate-bounce">{selected}</span>
            <span className="text-sm text-gray-600">selecionado</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default CuteAnimalSelector;
