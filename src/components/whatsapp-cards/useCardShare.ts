import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

const buildWhatsAppUrl = (text: string, phone?: string) => {
  const encoded = encodeURIComponent(text);
  return phone
    ? `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
};

export const useCardShare = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAndShare = useCallback(async (
    cardRef: HTMLDivElement | null,
    whatsappText: string,
    phone?: string,
  ) => {
    if (!cardRef) {
      toast.error('Card não encontrado.');
      window.open(buildWhatsAppUrl(whatsappText, phone), '_blank');
      return;
    }

    setIsGenerating(true);

    try {
      // The card is hidden via a wrapper with overflow:hidden + h-0.
      // We need to temporarily make it visible for html-to-image to capture it.
      const wrapper = cardRef.parentElement;
      
      if (wrapper) {
        wrapper.style.overflow = 'visible';
        wrapper.style.height = 'auto';
        wrapper.style.position = 'fixed';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '0';
        wrapper.style.zIndex = '-1';
      }

      // Give browser a frame to layout
      await new Promise(r => setTimeout(r, 100));

      // Generate PNG
      const dataUrl = await toPng(cardRef, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
        width: 600,
        height: 600,
      });

      // Hide wrapper again
      if (wrapper) {
        wrapper.style.overflow = 'hidden';
        wrapper.style.height = '0';
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '-9999px';
        wrapper.style.zIndex = '';
      }

      // Auto-download the image
      const link = document.createElement('a');
      link.download = `axis-card-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Open WhatsApp after a short delay
      setTimeout(() => {
        window.open(buildWhatsAppUrl(whatsappText, phone), '_blank');
      }, 600);

      toast.success('Card gerado! Anexe a imagem baixada na conversa do WhatsApp.');
    } catch (err) {
      console.error('Erro ao gerar card:', err);
      toast.error('Erro ao gerar card. Abrindo WhatsApp com texto.');
      window.open(buildWhatsAppUrl(whatsappText, phone), '_blank');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { isGenerating, generateAndShare };
};
