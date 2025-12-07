"use client";

import React, { useState, useEffect, useMemo } from "react";

interface RelationshipCounterProps {
  startDate: Date | null;
  onDateChange: (date: Date | null) => void;
  translations?: {
    title?: string;
    subtitle?: string;
    placeholder?: string;
    years?: string;
    months?: string;
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
    together?: string;
  };
}

interface TimeElapsed {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
}

function calculateTimeElapsed(startDate: Date): TimeElapsed {
  const now = new Date();
  const start = new Date(startDate);
  
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  const totalDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return { years, months, days, hours, minutes, seconds, totalDays };
}

function TimeBlock({ value, label, emoji }: { value: number; label: string; emoji: string }) {
  return (
    <div className="flex flex-col items-center p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl min-w-[70px]">
      <span className="text-lg">{emoji}</span>
      <span className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  );
}

export function RelationshipCounter({
  startDate,
  onDateChange,
  translations: t = {},
}: RelationshipCounterProps) {
  const [timeElapsed, setTimeElapsed] = useState<TimeElapsed | null>(null);

  const labels = useMemo(() => ({
    title: t.title || "💑 Tempo Juntos",
    subtitle: t.subtitle || "Desde quando vocês estão juntos?",
    placeholder: t.placeholder || "Selecione a data",
    years: t.years || "anos",
    months: t.months || "meses",
    days: t.days || "dias",
    hours: t.hours || "horas",
    minutes: t.minutes || "min",
    seconds: t.seconds || "seg",
    together: t.together || "juntos",
  }), [t]);

  useEffect(() => {
    let timeoutId: number | undefined;

    if (!startDate) {
      // Defer clearing state to avoid synchronous setState inside effect
      timeoutId = window.setTimeout(() => {
        setTimeElapsed(null);
      }, 0);

      return () => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      };
    }

    const updateTimer = () => {
      setTimeElapsed(calculateTimeElapsed(startDate));
    };

    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [startDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onDateChange(new Date(value));
    } else {
      onDateChange(null);
    }
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
          <span className="text-2xl">💑</span>
          {labels.title}
        </h3>
        <p className="text-sm text-gray-500">{labels.subtitle}</p>
      </div>

      {/* Date Picker */}
      <div className="relative">
        <input
          type="date"
          value={formatDateForInput(startDate)}
          onChange={handleDateChange}
          max={formatDateForInput(new Date())}
          className="w-full px-5 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-gray-700"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">
          📅
        </span>
      </div>

      {/* Time Display */}
      {timeElapsed && (
        <div className="space-y-4">
          {/* Main counter */}
          <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-pink-100 rounded-2xl p-6 text-center">
            <div className="flex flex-wrap justify-center gap-3">
              {timeElapsed.years > 0 && (
                <TimeBlock value={timeElapsed.years} label={labels.years} emoji="🎂" />
              )}
              {(timeElapsed.years > 0 || timeElapsed.months > 0) && (
                <TimeBlock value={timeElapsed.months} label={labels.months} emoji="📆" />
              )}
              <TimeBlock value={timeElapsed.days} label={labels.days} emoji="☀️" />
              <TimeBlock value={timeElapsed.hours} label={labels.hours} emoji="⏰" />
              <TimeBlock value={timeElapsed.minutes} label={labels.minutes} emoji="⏱️" />
              <TimeBlock value={timeElapsed.seconds} label={labels.seconds} emoji="💓" />
            </div>
          </div>

          {/* Total days */}
          <div className="text-center bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl py-4 px-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">💕</span>
              <div>
                <span className="text-3xl font-bold">{timeElapsed.totalDays.toLocaleString()}</span>
                <span className="text-lg ml-2">{labels.days}</span>
              </div>
              <span className="text-lg font-medium ml-2">{labels.together}!</span>
              <span className="text-3xl">💕</span>
            </div>
          </div>

          {/* Fun milestones */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-red-50 rounded-xl p-3">
              <span className="text-2xl">❤️</span>
              <div className="text-xl font-bold text-red-500">
                {Math.floor(timeElapsed.totalDays * 24 * 60).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">minutos de amor</div>
            </div>
            <div className="bg-pink-50 rounded-xl p-3">
              <span className="text-2xl">💋</span>
              <div className="text-xl font-bold text-pink-500">
                {Math.floor(timeElapsed.totalDays * 10).toLocaleString()}+
              </div>
              <div className="text-xs text-gray-500">beijos (estimados)</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <span className="text-2xl">🌙</span>
              <div className="text-xl font-bold text-purple-500">
                {timeElapsed.totalDays.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">noites juntos</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <span className="text-2xl">☕</span>
              <div className="text-xl font-bold text-blue-500">
                {Math.floor(timeElapsed.totalDays * 2).toLocaleString()}+
              </div>
              <div className="text-xs text-gray-500">cafés compartilhados</div>
            </div>
          </div>
        </div>
      )}

      {/* Help text when no date selected */}
      {!startDate && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <span className="text-5xl mb-4 block">💝</span>
          <p className="text-gray-500">Selecione a data para ver quanto tempo vocês estão juntos!</p>
        </div>
      )}
    </div>
  );
}

export default RelationshipCounter;
