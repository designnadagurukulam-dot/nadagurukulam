import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const TutorMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get students from tutor's batches
  const { data: students = [] } = useQuery({
    queryKey: ["tutor-chat-students", user?.id],
    queryFn: async () => {
      const { data: batches } = await supabase
        .from("batches")
        .select("id")
        .eq("instructor_id", user!.id);
      const batchIds = (batches || []).map((b) => b.id);
      if (!batchIds.length) return [];

      const { data: enrollments } = await supabase
        .from("batch_enrollments")
        .select("student_id")
        .in("batch_id", batchIds);
      const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))];
      if (!studentIds.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", studentIds);
      return profiles || [];
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", user?.id, selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${selectedStudent}),and(sender_id.eq.${selectedStudent},receiver_id.eq.${user!.id})`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!selectedStudent,
  });

  const { data: unreadCounts = {} } = useQuery({
    queryKey: ["tutor-unread-counts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", user!.id)
        .eq("is_read", false);
      const counts: Record<string, number> = {};
      (data || []).forEach((m) => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1; });
      return counts;
    },
    enabled: !!user,
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("tutor-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
          queryClient.invalidateQueries({ queryKey: ["tutor-unread-counts"] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Mark read
  useEffect(() => {
    if (!user || !selectedStudent) return;
    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", selectedStudent)
      .eq("is_read", false)
      .then(() => queryClient.invalidateQueries({ queryKey: ["tutor-unread-counts"] }));
  }, [selectedStudent, user, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !selectedStudent || !user) return;
    setSending(true);
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: selectedStudent, content: message.trim() });
    setMessage("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
  };

  const getInitials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const selectedProfile = students.find((s: any) => s.user_id === selectedStudent);

  return (
    <div className="pt-12 lg:pt-0 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-2rem)]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
        <div className="mb-4">
          <h1 className="font-serif text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground text-sm">Chat with your students</p>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Student list */}
          <Card className="w-72 shrink-0 hidden md:flex flex-col">
            <CardContent className="p-3 flex-1 overflow-y-auto space-y-1">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No students in your batches yet.</p>
              ) : students.map((s: any) => (
                <button
                  key={s.user_id}
                  onClick={() => setSelectedStudent(s.user_id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    selectedStudent === s.user_id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {getInitials(s.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.display_name}</p>
                    <p className="text-xs text-muted-foreground">Student</p>
                  </div>
                  {(unreadCounts as any)[s.user_id] > 0 && (
                    <Badge className="bg-accent text-accent-foreground text-[10px] h-5 min-w-[20px] flex items-center justify-center">
                      {(unreadCounts as any)[s.user_id]}
                    </Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Mobile list */}
          <div className="md:hidden w-full">
            {!selectedStudent && (
              <Card className="flex-1">
                <CardContent className="p-3 space-y-1">
                  {students.map((s: any) => (
                    <button key={s.user_id} onClick={() => setSelectedStudent(s.user_id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-left">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {getInitials(s.display_name)}
                      </div>
                      <div className="flex-1"><p className="text-sm font-medium">{s.display_name}</p></div>
                      {(unreadCounts as any)[s.user_id] > 0 && (
                        <Badge className="bg-accent text-accent-foreground text-xs">{(unreadCounts as any)[s.user_id]}</Badge>
                      )}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat area */}
          {selectedStudent && (
            <Card className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b flex items-center gap-3">
                <button className="md:hidden text-sm text-primary" onClick={() => setSelectedStudent(null)}>← Back</button>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {getInitials(selectedProfile?.display_name || "")}
                </div>
                <p className="font-semibold text-sm">{selectedProfile?.display_name}</p>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-12">No messages yet. Say hello!</p>
                  ) : messages.map((msg: any) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {format(new Date(msg.created_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-3 border-t flex gap-2">
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..."
                  className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} />
                <Button onClick={handleSend} disabled={!message.trim() || sending} size="icon" className="bg-primary shrink-0 rounded-xl">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {!selectedStudent && (
            <Card className="flex-1 hidden md:flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Select a student to start chatting</p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TutorMessages;
