import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  title?: string;
}

const AudioPlayer = ({ src, title }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  }, [duration]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  }, [duration]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      audio.volume = volume || 0.8;
      setMuted(false);
    } else {
      audio.volume = 0;
      setMuted(true);
    }
  }, [muted, volume]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl p-5 bg-primary text-primary-foreground">
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && (
        <p className="text-sm font-medium mb-3 truncate opacity-90">{title}</p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => seek(-10)} className="p-2 rounded-full hover:bg-primary-foreground/10 transition-colors" title="Rewind 10s">
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>

        <button onClick={() => seek(10)} className="p-2 rounded-full hover:bg-primary-foreground/10 transition-colors" title="Forward 10s">
          <RotateCw className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 bg-primary-foreground/20 rounded-full cursor-pointer mb-2 group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-secondary rounded-full relative transition-all"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-secondary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Time + Volume */}
      <div className="flex items-center justify-between text-xs opacity-75">
        <span>{fmt(currentTime)} / {fmt(duration)}</span>
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="hover:opacity-100 transition-opacity">
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 accent-secondary"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
