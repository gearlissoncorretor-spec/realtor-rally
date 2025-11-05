import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Expand, ChevronRight } from "lucide-react";

interface ExpandableCellProps {
  content: string;
  maxLength?: number;
  title?: string;
  className?: string;
}

export const ExpandableCell: React.FC<ExpandableCellProps> = ({
  content,
  maxLength = 50,
  title = "Texto Completo",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const shouldTruncate = content && content.length > maxLength;
  const truncatedContent = shouldTruncate 
    ? `${content.substring(0, maxLength)}...` 
    : content;

  if (!content || content.length <= maxLength) {
    return (
      <div className={className}>
        {content || 'Não informado'}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="truncate flex-1">{truncatedContent}</span>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6 flex-shrink-0"
            aria-label="Ver texto completo"
          >
            <Expand className="w-3 h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {content}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};