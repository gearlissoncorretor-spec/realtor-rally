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
      return;
    }

    setIsGenerating(true);

    try {
      // Make the card visible temporarily for rendering
      const originalPosition = cardRef.style.position;
      const originalLeft = cardRef.style.left;
      const originalTop = cardRef.style.top;

      // Ensure it's in the DOM and renderable
      cardRef.style.position = 'fixed';
      cardRef.style.left = '-9999px';
      cardRef.style.top = '0';

      // Generate PNG
      const dataUrl = await toPng(cardRef, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });

      // Restore position
      cardRef.style.position = originalPosition;
      cardRef.style.left = originalLeft;
      cardRef.style.top = originalTop;

      // Auto-download the image
      const link = document.createElement('a');
      link.download = `axis-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      // Open WhatsApp
      setTimeout(() => {
        window.open(buildWhatsAppUrl(whatsappText, phone), '_blank');
      }, 500);

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
