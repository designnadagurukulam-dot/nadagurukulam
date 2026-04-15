import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Shield, Search, Users, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday } from "date-fns";

interface Conversation {
  participantA: string;
  participantB: string;
  participantAName: string;
  participantBName: string;
  participantARole: string;
  participantBRole: string;
  lastMessage: string;
  lastAt: string;
  messageCount: number;
}

const AdminMessages = () => {
  const { role } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<{ a: string; b: string } | null>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    if (!isSuperAdmin) { setLoading(false); return; }
    const fetchConversations = async () => {
      const { data: allMessages } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, content, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!allMessages?.length) { setLoading(false); return; }

      const convoMap = new Map<string, { a: string; b: string; lastMessage: string; lastAt: string; count: number }>();
      for (const msg of allMessages) {
        const key = [msg.sender_id, msg.receiver_id].sort().join("_");
        if (!convoMap.has(key)) {
          convoMap.set(key, {
            a: [msg.sender_id, msg.receiver_id].sort()[0],
            b: [msg.sender_id, msg.receiver_id].sort()[1],
            lastMessage: msg.content,
            lastAt: msg.created_at,
            count: 1,
          });
        } else {
          convoMap.get(key)!.count++;
        }
      }

      const allUserIds = new Set<string>();
      convoMap.forEach(c => { allUserIds.add(c.a); allUserIds.add(c.b); });

      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name").in("user_id", [...allUserIds]),
        supabase.from("user_roles").select("user_id, role").in("user_id", [...allUserIds]),
      ]);

      const nameMap: Record<string, string> = {};
      (profilesRes.data || []).forEach(p => { nameMap[p.user_id] = p.display_name || "User"; });
      const roleMap: Record<string, string> = {};
      (rolesRes.data || []).forEach(r => { roleMap[r.user_id] = r.role; });

      const convos: Conversation[] = [];
      convoMap.forEach(c => {
        convos.push({
          participantA: c.a, participantB: c.b,
          participantAName: nameMap[c.a] || "User", participantBName: nameMap[c.b] || "User",
          participantARole: roleMap[c.a] || "user", participantBRole: roleMap[c.b] || "user",
          lastMessage: c.lastMessage, lastAt: c.lastAt, messageCount: c.count,
        });
      });
      convos.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
      setConversations(convos);
      setLoading(false);
    };
    fetchConversations();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!selectedConvo) { setThread([]); return; }
    const fetchThread = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${selectedConvo.a},receiver_id.eq.${selectedConvo.b}),and(sender_id.eq.${selectedConvo.b},receiver_id.eq.${selectedConvo.a})`)
        .order("created_at", { ascending: true });
      setThread(data || []);
    };
    fetchThread();
  }, [selectedConvo]);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="font-serif text-xl text-brand-primary font-semibold">Access Denied</h2>
          <p className="text-sm text-brand-warm-grey mt-1">Only Super Admin can access the Message Monitor.</p>
        </div>
      </div>
    );
  }

  const filteredConvos = conversations.filter(c =>
    !searchQuery ||
    c.participantAName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participantBName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMessages = conversations.reduce((s, c) => s + c.messageCount, 0);
  const activeToday = conversations.filter(c => isToday(new Date(c.lastAt))).length;

  const getInitials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const nameMap: Record<string, string> = {};
  const roleMap: Record<string, string> = {};
  conversations.forEach(c => {
    nameMap[c.participantA] = c.participantAName;
    nameMap[c.participantB] = c.participantBName;
    roleMap[c.participantA] = c.participantARole;
    roleMap[c.participantB] = c.participantBRole;
  });

  const getRoleBadge = (r: string) => {
    const colors: Record<string, string> = {
      student: "bg-blue-50 text-blue-700 border-blue-200",
      instructor: "bg-brand-gold-pale text-brand-gold-dark border-brand-gold/30",
      admin: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
      super_admin: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return colors[r] || "bg-brand-cream text-brand-warm-grey border-brand-parchment";
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[50vh] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Message Monitor</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          <p className="text-brand-warm-grey text-xs sm:text-sm">Read-only view of all conversations</p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Conversations", value: conversations.length, icon: Users },
          { label: "Total Messages", value: totalMessages, icon: Mail },
          { label: "Active Today", value: activeToday, icon: Clock },
        ].map((s, i) => (
          <div key={s.label} className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
              <s.icon className="h-4 w-4 text-brand-gold" />
            </div>
            <div>
              <p className="font-serif text-xl font-bold text-brand-primary">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-brand-warm-grey">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat panel — stacks vertically on mobile */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[50vh] lg:h-[calc(100vh-18rem)]">
        <Card className="w-full lg:w-80 shrink-0 flex flex-col bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] max-h-[40vh] lg:max-h-none">
          <div className="p-3 pb-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-warm-grey" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="pl-9 h-10 rounded-xl border-brand-parchment focus:border-brand-gold text-sm" />
            </div>
          </div>
          <CardContent className="p-3 flex-1 overflow-y-auto space-y-1">
            {filteredConvos.length === 0 ? (
              <p className="text-sm text-brand-warm-grey text-center py-8">No conversations found.</p>
            ) : filteredConvos.map((c, i) => {
              const isSelected = selectedConvo?.a === c.participantA && selectedConvo?.b === c.participantB;
              return (
                <button key={i} onClick={() => setSelectedConvo({ a: c.participantA, b: c.participantB })}
                  className={`w-full text-left p-3 rounded-xl transition-all ${isSelected ? "bg-gradient-to-r from-brand-gold-pale to-brand-cream border border-brand-gold/30" : "hover:bg-brand-cream"}`}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-brand-charcoal-mid truncate">{c.participantAName}</span>
                    <Badge className={`${getRoleBadge(c.participantARole)} text-[8px] px-1 py-0 h-4`}>{c.participantARole}</Badge>
                    <span className="text-[10px] text-brand-warm-grey">↔</span>
                    <span className="text-xs font-semibold text-brand-charcoal-mid truncate">{c.participantBName}</span>
                    <Badge className={`${getRoleBadge(c.participantBRole)} text-[8px] px-1 py-0 h-4`}>{c.participantBRole}</Badge>
                  </div>
                  <p className="text-[11px] text-brand-warm-grey truncate">{c.lastMessage}</p>
                  <p className="text-[10px] text-brand-warm-grey/60 mt-0.5">{format(new Date(c.lastAt), "MMM dd, h:mm a")}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {selectedConvo ? (
          <Card className="flex-1 flex flex-col min-h-[40vh] lg:min-h-0 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
            <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark p-3 sm:p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light flex items-center justify-center text-brand-primary font-bold text-xs shrink-0">
                {getInitials(nameMap[selectedConvo.a] || "")}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white truncate">{nameMap[selectedConvo.a]} ↔ {nameMap[selectedConvo.b]}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge className={`${getRoleBadge(roleMap[selectedConvo.a])} text-[8px] px-1 py-0 h-4`}>{roleMap[selectedConvo.a]}</Badge>
                  <span className="text-white/40 text-[10px]">↔</span>
                  <Badge className={`${getRoleBadge(roleMap[selectedConvo.b])} text-[8px] px-1 py-0 h-4`}>{roleMap[selectedConvo.b]}</Badge>
                  <span className="text-[10px] text-white/50 ml-1">· {thread.length} messages</span>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 p-3 sm:p-4">
              <div className="space-y-3">
                {thread.map((msg: any) => {
                  const isA = msg.sender_id === selectedConvo.a;
                  return (
                    <div key={msg.id} className={`flex ${isA ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${isA ? "bg-brand-cream-dark text-brand-charcoal-mid rounded-bl-md" : "bg-gradient-to-br from-brand-primary/80 to-brand-primary-dark text-white rounded-br-md"}`}>
                        <p className={`text-[10px] font-semibold mb-0.5 ${isA ? "text-brand-primary" : "text-brand-gold-light"}`}>{nameMap[msg.sender_id] || "User"}</p>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isA ? "text-brand-warm-grey" : "text-white/50"}`}>{format(new Date(msg.created_at), "MMM dd, h:mm a")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-brand-parchment bg-brand-cream/50 text-center">
              <p className="text-[11px] text-brand-warm-grey flex items-center justify-center gap-1.5">
                <Shield className="h-3 w-3" /> Read-only — Super Admin cannot send messages
              </p>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-brand-parchment">
            <CardContent className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-7 w-7 text-brand-gold" />
              </div>
              <p className="font-serif text-brand-primary font-semibold">Select a conversation to view</p>
              <p className="text-xs text-brand-warm-grey mt-1">All messages are visible in read-only mode</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
