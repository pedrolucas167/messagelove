"use client";

import React from "react";

export interface Category {
  id: string;
  name: string;
  description: string;
  emoji: string;
  gradient: string;
  icon: string;
}

export const categories: Category[] = [
  {
    id: "love",
    name: "Amor",
    description: "Para seu amor, namorado(a), esposo(a) ou crush",
    emoji: "💕",
    gradient: "from-pink-500 to-rose-500",
    icon: "💕",
  },
  {
    id: "friendship",
    name: "Amizade",
    description: "Para aquele amigo especial que está longe ou perto",
    emoji: "🤝",
    gradient: "from-blue-500 to-cyan-500",
    icon: "🤝",
  },
  {
    id: "family",
    name: "Família",
    description: "Para pais, avós, irmãos e toda a família",
    emoji: "👨‍👩‍👧‍👦",
    gradient: "from-amber-500 to-orange-500",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    id: "gratitude",
    name: "Gratidão",
    description: "Para agradecer alguém que fez diferença em sua vida",
    emoji: "🙏",
    gradient: "from-emerald-500 to-teal-500",
    icon: "🙏",
  },
  {
    id: "missing",
    name: "Saudades",
    description: "Para quem está longe mas sempre no coração",
    emoji: "💭",
    gradient: "from-purple-500 to-violet-500",
    icon: "💭",
  },
  {
    id: "celebration",
    name: "Celebração",
    description: "Aniversários, conquistas e momentos especiais",
    emoji: "🎉",
    gradient: "from-yellow-500 to-amber-500",
    icon: "🎉",
  },
];

interface CategorySelectorProps {
  selected: string | null;
  onSelect: (category: Category) => void;
  translations: {
    title: string;
    subtitle: string;
    categories: Record<string, { name: string; description: string }>;
  };
}

export function CategorySelector({
  selected,
  onSelect,
  translations: t,
}: CategorySelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          {t.title}
        </h2>
        <p className="text-gray-500">{t.subtitle}</p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const isSelected = selected === category.id;
          const categoryTranslation = t.categories[category.id] || {
            name: category.name,
            description: category.description,
          };

          return (
            <button
              key={category.id}
              onClick={() => onSelect(category)}
              className={`
                relative group
                p-6 rounded-2xl
                transition-all duration-300
                text-left
                overflow-hidden
                ${isSelected
                  ? `bg-gradient-to-br ${category.gradient} text-white shadow-xl scale-[1.02]`
                  : "bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg"
                }
              `}
            >
              {/* Background decoration */}
              <div
                className={`
                  absolute top-0 right-0
                  w-24 h-24
                  rounded-full
                  opacity-20
                  transform translate-x-8 -translate-y-8
                  transition-transform duration-300
                  group-hover:scale-150
                  ${isSelected ? "bg-white" : `bg-gradient-to-br ${category.gradient}`}
                `}
              />

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}

              {/* Emoji */}
              <div
                className={`
                  text-4xl mb-4
                  transition-transform duration-300
                  group-hover:scale-110
                `}
              >
                {category.emoji}
              </div>

              {/* Title */}
              <h3
                className={`
                  text-lg font-bold mb-2
                  ${isSelected ? "text-white" : "text-gray-800"}
                `}
              >
                {categoryTranslation.name}
              </h3>

              {/* Description */}
              <p
                className={`
                  text-sm
                  ${isSelected ? "text-white/80" : "text-gray-500"}
                `}
              >
                {categoryTranslation.description}
              </p>

              {/* Arrow indicator */}
              <div
                className={`
                  absolute bottom-4 right-4
                  w-8 h-8 rounded-full
                  flex items-center justify-center
                  transition-all duration-300
                  opacity-0 group-hover:opacity-100
                  transform translate-x-2 group-hover:translate-x-0
                  ${isSelected ? "bg-white/20" : "bg-gray-100"}
                `}
              >
                <span className={isSelected ? "text-white" : "text-gray-600"}>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick tips */}
      <div className="text-center pt-4">
        <p className="text-sm text-gray-400">
          💡 Escolha uma categoria para personalizar sua carta com temas especiais
        </p>
      </div>
    </div>
  );
}

// Compact version for inline use
interface CategoryBadgesProps {
  selected: string | null;
  onSelect: (categoryId: string) => void;
}

export function CategoryBadges({ selected, onSelect }: CategoryBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`
            inline-flex items-center gap-2
            px-4 py-2 rounded-full
            text-sm font-medium
            transition-all duration-200
            ${selected === category.id
              ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg`
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }
          `}
        >
          <span>{category.emoji}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
}

export default CategorySelector;
