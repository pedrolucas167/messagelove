"use client";

import React, { useState } from "react";

interface CharacterCounterProps {
  current: number;
  max: number;
}

export function CharacterCounter({ current, max }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage > 80 && percentage < 100;
  const isOver = percentage >= 100;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOver ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-gradient-to-r from-pink-400 to-purple-400"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={`font-medium ${isOver ? "text-red-500" : isWarning ? "text-yellow-600" : "text-gray-500"}`}>
        {current}/{max}
      </span>
    </div>
  );
}

interface TypingIndicatorProps {
  isTyping: boolean;
}

export function TypingIndicator({ isTyping }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-1 text-pink-500">
      <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: string;
  type?: "text" | "email";
  required?: boolean;
}

export function FloatingLabelInput({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  required = false,
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="relative group">
      <div className={`
        absolute left-4 transition-all duration-200 pointer-events-none z-10
        ${isFocused || hasValue 
          ? "-top-2.5 text-xs bg-white px-2 text-pink-500 font-medium" 
          : "top-3.5 text-gray-400"
        }
      `}>
        {icon && <span className="mr-1">{icon}</span>}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? placeholder : ""}
        className={`
          w-full px-4 py-3.5 border-2 rounded-xl text-gray-900
          transition-all duration-200
          focus:outline-none
          ${isFocused 
            ? "border-pink-400 shadow-lg shadow-pink-100" 
            : hasValue 
              ? "border-green-300 bg-green-50/30" 
              : "border-gray-200 hover:border-gray-300"
          }
        `}
      />
      {hasValue && !isFocused && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
          ✓
        </div>
      )}
    </div>
  );
}

interface EnhancedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function EnhancedTextarea({
  value,
  onChange,
  placeholder,
  maxLength = 2000,
  rows = 8,
  suggestions = [],
  onSuggestionClick,
}: EnhancedTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="space-y-3">
      <div className={`
        relative rounded-xl transition-all duration-200
        ${isFocused ? "ring-2 ring-pink-400 ring-offset-2" : ""}
      `}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none resize-none text-lg text-gray-900 transition-colors"
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          {["❤️", "💕", "😊", "🥰", "✨"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onChange(value + emoji)}
              className="p-1.5 hover:bg-pink-100 rounded-lg transition-colors text-lg hover:scale-110 transform"
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <CharacterCounter current={value.length} max={maxLength} />
        
        {value.length > 0 && (
          <div className="text-xs text-gray-400">
            ~{Math.ceil(value.length / 200)} min de leitura
          </div>
        )}
      </div>

      {/* Writing suggestions */}
      {showSuggestions && suggestions.length > 0 && value.length < 50 && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 animate-fadeIn">
          <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
            <span>💡</span> Sugestões para começar:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="px-3 py-1.5 bg-white text-sm text-gray-700 rounded-full border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TipCardProps {
  icon: string;
  title: string;
  tip: string;
  variant?: "info" | "success" | "warning";
}

export function TipCard({ icon, title, tip, variant = "info" }: TipCardProps) {
  const variants = {
    info: "bg-blue-50 border-blue-200 text-blue-700",
    success: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${variants[variant]} animate-fadeIn`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm opacity-80">{tip}</p>
      </div>
    </div>
  );
}

interface ConfettiButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function ConfettiButton({ children, onClick, disabled, className = "" }: ConfettiButtonProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {["🎉", "✨", "💕", "🎊", "⭐"].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-lg animate-confetti"
              style={{
                left: `${20 + i * 15}%`,
                animationDelay: `${i * 100}ms`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedCard({ children, delay = 0, className = "" }: AnimatedCardProps) {
  return (
    <div
      className={`animate-fadeInUp ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

const InteractiveElements = {
  CharacterCounter,
  TypingIndicator,
  FloatingLabelInput,
  EnhancedTextarea,
  TipCard,
  ConfettiButton,
  AnimatedCard,
};

export default InteractiveElements;
