import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook that shows a toast when a React Query has an error.
 * Use in pages/components that consume data hooks.
 */
export function useQueryErrorHandler(
  error: Error | null | undefined,
  context?: string
) {
  const { toast } = useToast();

  useEffect(() => {
    if (!error) return;

    const message = error.message || 'Erro desconhecido';
    const isNetworkError = message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch');
    
    toast({
      title: isNetworkError ? 'Erro de conexão' : `Erro${context ? ` em ${context}` : ''}`,
      description: isNetworkError 
        ? 'Verifique sua conexão com a internet e tente novamente.'
        : message.length > 120 ? message.substring(0, 120) + '...' : message,
      variant: 'destructive',
    });
  }, [error?.message]); // Only trigger on new error messages
}
