import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, FileAudio } from 'lucide-react';

export const X1AudioPlayer = ({ src }: { src: string }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={toggle} className="gap-1.5 h-7 text-xs">
      {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      <FileAudio className="w-3 h-3" />
      Áudio
    </Button>
  );
};
