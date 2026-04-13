import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const StudentChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTutor, setSelectedTutor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tutors = [] } = useQuery({
    queryKey: ["student-chat-tutors", user?.id],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from("batch_enrollments").select("batch_id, batches(instructor_id)").eq("student_id", user!.id);
      const instructorIds = [...new Set((enrollments || []).map((e: any) => e.batches?.instructor_id).filter(Boolean))];
      if (!instructorIds.length) return [];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", instructorIds);
      return profiles || [];
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", user?.id, selectedTutor],
    queryFn: async () => {
      if (!selectedTutor) return [];
      const { data, error } = await supabase.from("messages").select("*")
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${selectedTutor}),and(sender_id.eq.${selectedTutor},receiver_id.eq.${user!.id})`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!selectedTutor,
  });

  const { data: unreadCounts = {} } = useQuery({
    queryKey: ["unread-counts", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("sender_id").eq("receiver_id", user!.id).eq("is_read", false);
      const counts: Record<string, number> = {};
      (data || []).forEach((m) => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1; });
      return counts;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("student-messages").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      const msg = payload.new as any;
      if (msg.sender_id === user.id || msg.receiver_id === user.id) {
        queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
        queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user || !selectedTutor) return;
    supabase.from("messages").update({ is_read: true }).eq("receiver_id", user.id).eq("sender_id", selectedTutor).eq("is_read", false)
      .then(() => { queryClient.invalidateQueries({ queryKey: ["unread-counts"] }); });
  }, [selectedTutor, user, queryClient]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !selectedTutor || !user) return;
    setSending(true);
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: selectedTutor, content: message.trim() });
    setMessage("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
  };

  const getInitials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const selectedTutorProfile = tutors.find((t: any) => t.user_id === selectedTutor);

  return (
    <div className="pt-2 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-2rem)]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
        <div className="mb-4">
          <h1 className="font-serif text-2xl font-semibold text-brand-primary">Chat</h1>
          <div className="w-12 h-0.5 bg-brand-gold mt-1" />
          <p className="text-brand-warm-grey text-sm mt-2">Message your tutors</p>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Tutor list - desktop */}
          <Card className="w-72 shrink-0 hidden md:flex flex-col bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
            <CardContent className="p-3 flex-1 overflow-y-auto space-y-1">
              {tutors.length === 0 ? (
                <p className="text-sm text-brand-warm-grey text-center py-8">No tutors assigned yet.</p>
              ) : (
                tutors.map((tutor: any) => (
                  <button
                    key={tutor.user_id}
                    onClick={() => setSelectedTutor(tutor.user_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      selectedTutor === tutor.user_id ? "bg-brand-gold-pale border border-brand-gold/30" : "hover:bg-brand-cream"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-gold-pale flex items-center justify-center text-brand-primary font-bold text-xs shrink-0">
                      {getInitials(tutor.display_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-charcoal-mid truncate">{tutor.display_name}</p>
                      <p className="text-xs text-brand-warm-grey">Tutor</p>
                    </div>
                    {(unreadCounts as any)[tutor.user_id] > 0 && (
                      <Badge className="bg-brand-gold text-brand-charcoal text-[10px] h-5 min-w-[20px] flex items-center justify-center border-0">
                        {(unreadCounts as any)[tutor.user_id]}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Mobile tutor select */}
          <div className="md:hidden w-full">
            {!selectedTutor ? (
              <Card className="flex-1 bg-white rounded-2xl border border-brand-parchment">
                <CardContent className="p-3 space-y-1">
                  {tutors.map((tutor: any) => (
                    <button key={tutor.user_id} onClick={() => setSelectedTutor(tutor.user_id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-cream text-left">
                      <div className="w-10 h-10 rounded-full bg-brand-gold-pale flex items-center justify-center text-brand-primary font-bold text-xs">
                        {getInitials(tutor.display_name)}
                      </div>
                      <div className="flex-1"><p className="text-sm font-medium text-brand-charcoal-mid">{tutor.display_name}</p></div>
                      {(unreadCounts as any)[tutor.user_id] > 0 && (
                        <Badge className="bg-brand-gold text-brand-charcoal text-xs border-0">{(unreadCounts as any)[tutor.user_id]}</Badge>
                      )}
                    </button>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Chat area */}
          {selectedTutor && (
            <Card className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <div className="p-4 border-b border-brand-parchment flex items-center gap-3">
                <button className="md:hidden text-sm text-brand-primary font-medium" onClick={() => setSelectedTutor(null)}>← Back</button>
                <div className="w-8 h-8 rounded-full bg-brand-gold-pale flex items-center justify-center text-brand-primary font-bold text-xs">
                  {getInitials(selectedTutorProfile?.display_name || "")}
                </div>
                <p className="font-semibold text-sm text-brand-charcoal-mid">{selectedTutorProfile?.display_name}</p>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-brand-warm-grey text-sm py-12">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((msg: any) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMine
                              ? "bg-brand-primary text-white rounded-br-md"
                              : "bg-brand-cream-dark text-brand-charcoal-mid rounded-bl-md"
                          }`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-brand-warm-grey"}`}>
                              {format(new Date(msg.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-3 border-t border-brand-parchment flex gap-2">
                <Input
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                />
                <Button onClick={handleSend} disabled={!message.trim() || sending} size="icon" className="bg-brand-primary hover:bg-brand-primary-dark shrink-0 rounded-xl">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {!selectedTutor && (
            <Card className="flex-1 hidden md:flex items-center justify-center bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <CardContent className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-gold-pale flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-brand-gold" />
                </div>
                <p className="font-serif text-brand-primary font-semibold">Select a tutor to start chatting</p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StudentChat;
