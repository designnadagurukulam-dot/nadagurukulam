import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";
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
        <div className="mb-3 sm:mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Chat</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-0.5" />
            <p className="text-brand-warm-grey text-xs sm:text-sm mt-0.5">Message your tutors</p>
          </div>
        </div>

        <div className="flex-1 flex gap-3 sm:gap-4 min-h-0">
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
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all min-h-[48px] ${
                      selectedTutor === tutor.user_id ? "bg-gradient-to-r from-brand-gold-pale to-brand-cream border border-brand-gold/30" : "hover:bg-brand-cream"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center text-brand-primary font-bold text-xs shrink-0 border border-brand-gold/20">
                        {getInitials(tutor.display_name)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-charcoal-mid truncate">{tutor.display_name}</p>
                      <p className="text-xs text-brand-warm-grey">Tutor</p>
                    </div>
                    {(unreadCounts as any)[tutor.user_id] > 0 && (
                      <Badge className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white text-[10px] h-5 min-w-[20px] flex items-center justify-center border-0">
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
                <CardContent className="p-2 space-y-1">
                  {tutors.length === 0 ? (
                    <p className="text-sm text-brand-warm-grey text-center py-8">No tutors assigned yet.</p>
                  ) : (
                    tutors.map((tutor: any) => (
                      <button key={tutor.user_id} onClick={() => setSelectedTutor(tutor.user_id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-cream text-left min-h-[52px]">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center text-brand-primary font-bold text-xs shrink-0 border border-brand-gold/20">
                            {getInitials(tutor.display_name)}
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-charcoal-mid truncate">{tutor.display_name}</p>
                          <p className="text-xs text-brand-warm-grey">Tutor</p>
                        </div>
                        {(unreadCounts as any)[tutor.user_id] > 0 && (
                          <Badge className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white text-xs border-0">{(unreadCounts as any)[tutor.user_id]}</Badge>
                        )}
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Chat area */}
          {selectedTutor && (
            <Card className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
              {/* Gradient chat header */}
              <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark p-3 sm:p-4 flex items-center gap-3">
                <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white" onClick={() => setSelectedTutor(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light flex items-center justify-center text-brand-primary font-bold text-xs shrink-0">
                    {getInitials(selectedTutorProfile?.display_name || "")}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-brand-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white truncate">{selectedTutorProfile?.display_name}</p>
                  <p className="text-[10px] text-white/50">Tutor · Online</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-3 sm:p-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 sm:py-12">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-5 h-5 text-brand-gold" />
                      </div>
                      <p className="text-brand-warm-grey text-sm">No messages yet. Say hello! 👋</p>
                    </div>
                  ) : (
                    messages.map((msg: any) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 sm:px-4 py-2.5 rounded-2xl text-sm ${
                            isMine
                              ? "bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white rounded-br-md"
                              : "bg-brand-cream-dark text-brand-charcoal-mid rounded-bl-md"
                          }`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-white/50" : "text-brand-warm-grey"}`}>
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
              <div className="p-2.5 sm:p-3 border-t border-brand-parchment flex gap-2 bg-white">
                <Input
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20 h-11"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                />
                <Button onClick={handleSend} disabled={!message.trim() || sending} size="icon" className="bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary shrink-0 rounded-xl w-11 h-11 shadow-lg">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {!selectedTutor && (
            <Card className="flex-1 hidden md:flex items-center justify-center bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <CardContent className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-7 w-7 text-brand-gold" />
                </div>
                <p className="font-serif text-brand-primary font-semibold">Select a tutor to start chatting</p>
                <p className="text-xs text-brand-warm-grey mt-1">Your conversations are private and secure</p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StudentChat;