"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardTitle?: string;
}

export function ShareModal({ isOpen, onClose, cardId, cardTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Compute URLs directly without useEffect
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/card/${cardId}`;
  }, [cardId]);

  const qrCodeUrl = useMemo(() => {
    if (!shareUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=ffffff&color=ec4899`;
  }, [shareUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = cardTitle 
      ? `💌 Tenho uma carta especial para você: ${cardTitle}\n\n${shareUrl}`
      : `💌 Tenho uma carta especial para você!\n\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTelegram = () => {
    const text = cardTitle 
      ? `💌 Tenho uma carta especial para você: ${cardTitle}`
      : `💌 Tenho uma carta especial para você!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = "Uma carta especial para você 💌";
    const body = cardTitle 
      ? `Olá!\n\nTenho uma carta especial para você: ${cardTitle}\n\nClique no link para ver:\n${shareUrl}\n\nCom carinho ❤️`
      : `Olá!\n\nTenho uma carta especial para você!\n\nClique no link para ver:\n${shareUrl}\n\nCom carinho ❤️`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = cardTitle 
      ? `💌 Acabei de criar uma carta especial: ${cardTitle}`
      : `💌 Acabei de criar uma carta especial!`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `messagelove-qrcode-${cardId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-3 sm:top-4 right-3 sm:right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-2xl transition-colors rounded-full hover:bg-gray-100"
        >
          ×
        </button>

        <div className="text-center mb-5 sm:mb-6">
          <div className="text-3xl sm:text-4xl mb-2">🔗</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Compartilhar Carta</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Envie sua carta para quem você ama</p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg border-2 border-pink-100 mb-2 sm:mb-3">
            {qrCodeUrl ? (
              <Image 
                src={qrCodeUrl} 
                alt="QR Code" 
                width={140}
                height={140}
                className="rounded-lg w-[120px] h-[120px] sm:w-[160px] sm:h-[160px]"
                unoptimized // External URL
              />
            ) : (
              <div className="w-[120px] h-[120px] sm:w-40 sm:h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">Carregando...</span>
              </div>
            )}
          </div>
          <button
            onClick={handleDownloadQR}
            className="text-xs sm:text-sm text-pink-500 hover:text-pink-600 font-medium flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar QR Code
          </button>
        </div>

        {/* Copy Link */}
        <div className="mb-5 sm:mb-6">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">Link da carta</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-xs sm:text-sm truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${
                copied 
                  ? "bg-green-500 text-white" 
                  : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm font-medium text-gray-700">Compartilhar via</p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button
              onClick={handleShareTelegram}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </button>
            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X (Twitter)
            </button>
            <button
              onClick={handleShareEmail}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              E-mail
            </button>
          </div>
        </div>

        {/* Native Share (mobile) */}
        {typeof navigator !== "undefined" && navigator.share && (
          <button
            onClick={() => {
              navigator.share({
                title: "Carta Especial 💌",
                text: cardTitle || "Tenho uma carta especial para você!",
                url: shareUrl,
              });
            }}
            className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Mais opções de compartilhamento
          </button>
        )}
      </div>
    </div>
  );
}

export default ShareModal;
