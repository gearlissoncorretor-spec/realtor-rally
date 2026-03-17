import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

        // Auto-download as JPEG
        const response = await fetch(data.imageUrl);
        const blob = await response.blob();
        const jpegBlob = new Blob([blob], { type: 'image/jpeg' });
        const blobUrl = URL.createObjectURL(jpegBlob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `axis-card-${cardType}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

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

  return { isGenerating, generatedImageUrl, generateCard };
};
