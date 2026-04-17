import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingWhatsAppProps {
  phoneNumber: string;
  message?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ 
  phoneNumber, 
  message = 'Olá! Gostaria de saber mais sobre o sistema.' 
}) => {
  if (!phoneNumber) return null;

  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-300 flex items-center justify-center"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white"></span>
      </span>
    </motion.button>
  );
};
