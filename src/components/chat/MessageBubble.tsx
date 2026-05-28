import { format } from "date-fns";
import { FileText, Download, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MessageBubbleProps {
  message: any;
  isMine: boolean;
  alignLeft?: boolean; // override (super admin view)
  senderLabel?: string; // optional name shown above (super admin)
  variant?: "primary" | "muted"; // styling preset
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec?: number | null) {
  if (!sec && sec !== 0) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function getSignedUrl(path: string): Promise<string | null> {
  // path stored as URL or storage path; if it's a full URL just return
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

export const MessageBubble = ({ message, isMine, alignLeft, senderLabel }: MessageBubbleProps) => {
  const left = alignLeft !== undefined ? alignLeft : !isMine;
  const [signed, setSigned] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const ensureSigned = async () => {
    if (signed) return signed;
    const url = await getSignedUrl(message.attachment_url);
    setSigned(url);
    return url;
  };

  const togglePlay = async () => {
    const url = await ensureSigned();
    if (!url || !audioRef.current) return;
    if (audioRef.current.src !== url) audioRef.current.src = url;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleDownload = async () => {
    const url = await ensureSigned();
    if (!url) return;
    window.open(url, "_blank");
  };

  const bubbleClass = left
    ? "bg-brand-cream-dark text-brand-charcoal-mid rounded-bl-md"
    : "bg-gradient-to-br from-brand-primary to-brand-primary-dark text-primary-foreground rounded-br-md";
  const timeClass = left ? "text-brand-warm-grey" : "text-primary-foreground/50";

  const hasAttachment = !!message.attachment_url;
  const type = message.attachment_type;

  return (
    <div className={`flex ${left ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 sm:px-4 py-2.5 rounded-2xl text-sm shadow-sm ${bubbleClass}`}>
        {senderLabel && (
          <p className={`text-[10px] font-semibold mb-0.5 ${left ? "text-brand-primary" : "text-brand-gold-light"}`}>
            {senderLabel}
          </p>
        )}

        {hasAttachment && type === "image" && (
          <ImageAttachment path={message.attachment_url} name={message.attachment_name} />
        )}

        {hasAttachment && type === "voice" && (
          <div className="flex items-center gap-2.5 py-1 min-w-[160px]">
            <button
              onClick={togglePlay}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${left ? "bg-brand-primary/10 text-brand-primary" : "bg-white/20 text-primary-foreground"}`}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className={`h-1 rounded-full ${left ? "bg-brand-primary/20" : "bg-white/30"}`}>
                <div className={`h-full w-1/3 rounded-full ${left ? "bg-brand-primary" : "bg-white"}`} />
              </div>
              <p className={`text-[10px] mt-1 ${timeClass}`}>Voice · {formatDuration(message.voice_duration)}</p>
            </div>
            <audio ref={audioRef} onEnded={() => setPlaying(false)} className="hidden" />
          </div>
        )}

        {hasAttachment && type === "file" && (
          <button
            onClick={handleDownload}
            className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg w-full text-left ${left ? "bg-brand-primary/5 hover:bg-brand-primary/10" : "bg-white/10 hover:bg-white/20"}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${left ? "bg-brand-primary/15 text-brand-primary" : "bg-white/20 text-primary-foreground"}`}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{message.attachment_name || "Attachment"}</p>
              <p className={`text-[10px] ${timeClass}`}>{formatBytes(message.attachment_size)}</p>
            </div>
            <Download className={`h-4 w-4 shrink-0 ${left ? "text-brand-warm-grey" : "text-primary-foreground/70"}`} />
          </button>
        )}

        {message.content && <p className={hasAttachment ? "mt-1.5" : ""}>{message.content}</p>}

        <p className={`text-[10px] mt-1 ${timeClass}`}>{format(new Date(message.created_at), "h:mm a")}</p>
      </div>
    </div>
  );
};

const ImageAttachment = ({ path, name }: { path: string; name?: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSignedUrl(path).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [path]);
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img src={url} alt={name || "image"} className="rounded-lg max-h-64 max-w-full object-cover" />
    </a>
  ) : (
    <div className="h-32 w-48 rounded-lg bg-black/10 animate-pulse" />
  );
};
