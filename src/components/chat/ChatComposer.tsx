import { useState, useRef } from "react";
import { Send, Paperclip, Mic, X, Square, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ChatComposerProps {
  userId: string;
  receiverId: string;
  onSent?: () => void;
}

const MAX_BYTES = 10 * 1024 * 1024;

export const ChatComposer = ({ userId, receiverId, onSent }: ChatComposerProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // recording state
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recStartRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const insertMessage = async (payload: {
    content?: string;
    attachment_url?: string;
    attachment_type?: "image" | "file" | "voice";
    attachment_name?: string;
    attachment_size?: number;
    voice_duration?: number;
  }) => {
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: receiverId,
      content: payload.content || null,
      ...payload,
    } as any);
    if (error) {
      toast.error(error.message || "Failed to send");
      return false;
    }
    onSent?.();
    return true;
  };

  const handleSendText = async () => {
    if (!message.trim()) return;
    setSending(true);
    const ok = await insertMessage({ content: message.trim() });
    if (ok) setMessage("");
    setSending(false);
  };

  const uploadAndSend = async (file: Blob, opts: {
    name: string;
    type: "image" | "file" | "voice";
    size: number;
    duration?: number;
  }) => {
    if (opts.size > MAX_BYTES) {
      toast.error("File too large (max 10 MB)");
      return;
    }
    setSending(true);
    const ext = opts.name.split(".").pop() || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("chat-attachments")
      .upload(path, file, { contentType: (file as any).type || undefined });
    if (upErr) {
      toast.error(upErr.message || "Upload failed");
      setSending(false);
      return;
    }
    await insertMessage({
      attachment_url: path,
      attachment_type: opts.type,
      attachment_name: opts.name,
      attachment_size: opts.size,
      voice_duration: opts.duration,
      content: message.trim() || undefined,
    });
    setMessage("");
    setSending(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    await uploadAndSend(f, {
      name: f.name,
      type: isImage ? "image" : "file",
      size: f.size,
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const dur = Math.round((Date.now() - recStartRef.current) / 1000);
        setRecordedBlob(blob);
        setRecordedDuration(dur);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      recStartRef.current = Date.now();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.round((Date.now() - recStartRef.current) / 1000));
      }, 500);
    } catch (e: any) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const cancelRecording = () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecording(false);
    }
    setRecordedBlob(null);
    setRecordedDuration(0);
    setPreviewPlaying(false);
    if (previewAudioRef.current) previewAudioRef.current.pause();
  };

  const togglePreview = () => {
    if (!recordedBlob) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(URL.createObjectURL(recordedBlob));
      previewAudioRef.current.onended = () => setPreviewPlaying(false);
    }
    if (previewPlaying) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      previewAudioRef.current.play();
      setPreviewPlaying(true);
    }
  };

  const sendRecording = async () => {
    if (!recordedBlob) return;
    await uploadAndSend(recordedBlob, {
      name: `voice-${Date.now()}.webm`,
      type: "voice",
      size: recordedBlob.size,
      duration: recordedDuration,
    });
    cancelRecording();
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Recording active UI
  if (recording) {
    return (
      <div className="p-2.5 sm:p-3 border-t border-brand-parchment flex items-center gap-2 bg-card">
        <Button onClick={cancelRecording} variant="ghost" size="icon" className="shrink-0 rounded-xl w-11 h-11 text-destructive">
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-destructive">Recording... {fmt(recordingTime)}</span>
        </div>
        <Button onClick={stopRecording} size="icon" className="shrink-0 rounded-xl w-11 h-11 bg-destructive hover:bg-destructive/90">
          <Square className="h-4 w-4 fill-current" />
        </Button>
      </div>
    );
  }

  // Preview recorded voice
  if (recordedBlob) {
    return (
      <div className="p-2.5 sm:p-3 border-t border-brand-parchment flex items-center gap-2 bg-card">
        <Button onClick={cancelRecording} variant="ghost" size="icon" className="shrink-0 rounded-xl w-11 h-11">
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-xl bg-brand-cream border border-brand-parchment">
          <button onClick={togglePreview} className="w-8 h-8 rounded-full bg-brand-primary text-primary-foreground flex items-center justify-center">
            {previewPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
          </button>
          <span className="text-sm text-brand-charcoal-mid">Voice note · {fmt(recordedDuration)}</span>
        </div>
        <Button onClick={sendRecording} disabled={sending} size="icon" className="shrink-0 rounded-xl w-11 h-11 bg-gradient-to-r from-brand-primary to-brand-primary-dark">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Default composer
  return (
    <div className="p-2.5 sm:p-3 border-t border-brand-parchment flex gap-2 bg-card">
      <input ref={fileInputRef} type="file" hidden onChange={handleFile} accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,audio/*" />
      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        variant="ghost"
        size="icon"
        disabled={sending}
        className="shrink-0 rounded-xl w-11 h-11 text-brand-warm-grey hover:text-brand-primary hover:bg-brand-cream"
        aria-label="Attach file"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        onClick={startRecording}
        variant="ghost"
        size="icon"
        disabled={sending}
        className="shrink-0 rounded-xl w-11 h-11 text-brand-warm-grey hover:text-brand-primary hover:bg-brand-cream"
        aria-label="Record voice"
      >
        <Mic className="h-5 w-5" />
      </Button>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20 h-11"
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendText()}
      />
      <Button
        onClick={handleSendText}
        disabled={!message.trim() || sending}
        size="icon"
        className="bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary shrink-0 rounded-xl w-11 h-11 shadow-lg"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};
