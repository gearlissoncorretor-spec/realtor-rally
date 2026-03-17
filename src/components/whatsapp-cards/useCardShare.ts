import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const buildWhatsAppUrl = (text: string, phone?: string) => {
  const encoded = encodeURIComponent(text);
  return phone
    ? `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
};

export const useCardShare = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const generateCard = useCallback(async (
    cardType: string,
    payload: Record<string, any>,
  ) => {
    setIsGenerating(true);
    setGeneratedImageUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-whatsapp-card', {
        body: { cardType, ...payload },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);

        // Auto-download
        const link = document.createElement('a');
        link.href = data.imageUrl;
        link.download = `axis-card-${cardType}-${Date.now()}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Card gerado e download iniciado!');
      } else {
        throw new Error('Nenhuma imagem retornada');
      }
    } catch (err: any) {
      console.error('Erro ao gerar card:', err);
      toast.error(err.message || 'Erro ao gerar card. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const shareWhatsApp = useCallback((whatsappText: string, phone?: string) => {
    const text = generatedImageUrl
      ? `${whatsappText}\n\n📸 Veja o card: ${generatedImageUrl}`
      : whatsappText;
    window.open(buildWhatsAppUrl(text, phone), '_blank');
  }, [generatedImageUrl]);

  return { isGenerating, generatedImageUrl, generateCard, shareWhatsApp };
};
