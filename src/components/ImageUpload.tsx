import React, { useState, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Camera, Upload, X, ZoomIn, RotateCw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string | null) => void;
  placeholder?: string;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = getRotatedSize(image.width, image.height, rotation);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) throw new Error('No 2d context');

  // Output at high quality — 600x600
  const outputSize = 600;
  croppedCanvas.width = outputSize;
  croppedCanvas.height = outputSize;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, outputSize, outputSize
  );

  return croppedCanvas.toDataURL('image/jpeg', 0.92);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

function getRotatedSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  placeholder = "Foto do Corretor"
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Crop state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro no upload", description: "Por favor, selecione apenas arquivos de imagem.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O arquivo deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setRawImage(result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const croppedImage = await getCroppedImg(rawImage, croppedAreaPixels, rotation);
      setPreviewUrl(croppedImage);
      onImageChange(croppedImage);
      setCropDialogOpen(false);
      setRawImage(null);
      toast({ title: "Imagem carregada", description: "A imagem foi recortada e salva com sucesso." });
    } catch (error) {
      console.error('Erro ao recortar:', error);
      toast({ title: "Erro ao recortar", description: "Não foi possível processar a imagem.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setRawImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-2 border-border">
            <AvatarImage src={previewUrl || undefined} className="object-cover" />
            <AvatarFallback className="text-2xl">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          {previewUrl && (
            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6 rounded-full" onClick={handleRemoveImage}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={triggerFileInput} disabled={isUploading}>
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Processando...' : 'Escolher Foto'}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <p className="text-xs text-muted-foreground text-center">
          Formatos aceitos: JPG, PNG, GIF<br />Tamanho máximo: 5MB
        </p>
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => { if (!open) handleCropCancel(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Posicionar Foto</DialogTitle>
          </DialogHeader>

          <div className="relative w-full h-[350px] bg-black/90">
            {rawImage && (
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground w-10">Zoom</span>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(val) => setZoom(val[0])}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <RotateCw className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground w-10">Girar</span>
              <Slider
                value={[rotation]}
                min={0}
                max={360}
                step={1}
                onValueChange={(val) => setRotation(val[0])}
                className="flex-1"
              />
            </div>
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={handleCropCancel}>Cancelar</Button>
            <Button onClick={handleCropConfirm} disabled={isUploading}>
              <Check className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageUpload;
