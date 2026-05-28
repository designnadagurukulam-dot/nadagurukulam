import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Shield, Search, Users, Mail, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageBubble } from "@/components/chat/MessageBubble";

const AdminMessages = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = role === "super_admin";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For super_admin: load all conversations (read-only monitor)
  // For admin: load own conversations (can send)
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["admin-chat-contacts", user?.id, role],
    queryFn: async () => {
      if (isSuperAdmin) {
        // Super admin — aggregate all conversations
        const { data: allMessages } = await supabase.from("messages").select("sender_id, receiver_id, content, created_at").order("created_at", { ascending: false }).limit(1000);
        if (!allMessages?.length) return [];
        const convoMap = new Map<string, { partner: string; lastMessage: string; lastAt: string; count: number; unread: number }>();
        const seen = new Set<string>();
        for (const msg of allMessages) {
          const key = [msg.sender_id, msg.receiver_id].sort().join("_");
          if (!seen.has(key)) { seen.add(key); convoMap.set(key, { partner: key, lastMessage: msg.content, lastAt: msg.created_at, count: 1, unread: 0 }); } else { convoMap.get(key)!.count++; }
        }
        const allUserIds = new Set<string>();
        allMessages.forEach(m => { allUserIds.add(m.sender_id); allUserIds.add(m.receiver_id); });
        const [profilesRes, rolesRes] = await Promise.all([
          supabase.from("profiles").select("user_id, display_name").in("user_id", [...allUserIds]),
          supabase.from("user_roles").select("user_id, role").in("user_id", [...allUserIds]),
        ]);
        const nameMap: Record<string, string> = {};
        (profilesRes.data || []).forEach(p => { nameMap[p.user_id] = p.display_name || "User"; });
        const roleMap: Record<string, string> = {};
        (rolesRes.data || []).forEach(r => { roleMap[r.user_id] = r.role; });
        const results: any[] = [];
        convoMap.forEach((c, key) => {
          const [a, b] = key.split("_");
          results.push({ id: key, participantA: a, participantB: b, nameA: nameMap[a] || "User", nameB: nameMap[b] || "User", roleA: roleMap[a] || "user", roleB: roleMap[b] || "user", lastMessage: c.lastMessage, lastAt: c.lastAt, count: c.count, isMonitor: true });
        });
        results.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
        return results;
      } else {
        // Regular admin — show staff & students they can message
        const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("role", ["instructor", "student"]);
        if (!roles?.length) return [];
        const userIds = roles.map(r => r.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url, is_verified").in("user_id", userIds).eq("is_verified", true);
        // Get unread counts
        const { data: unreadMsgs } = await supabase.from("messages").select("sender_id").eq("receiver_id", user!.id).eq("is_read", false);
        const unreadMap: Record<string, number> = {};
        (unreadMsgs || []).forEach(m => { unreadMap[m.sender_id] = (unreadMap[m.sender_id] || 0) + 1; });
        return (profiles || []).map(p => ({
          id: p.user_id, user_id: p.user_id, display_name: p.display_name, avatar_url: p.avatar_url,
          role: roles.find(r => r.user_id === p.user_id)?.role || "student",
          unread: unreadMap[p.user_id] || 0, isMonitor: false,
        }));
      }
    },
    enabled: !!user,
  });

  // Thread messages
  const threadPartners = (() => {
    if (!selectedContact) return null;
    if (isSuperAdmin) {
      const convo = contacts.find((c: any) => c.id === selectedContact);
      return convo ? { a: convo.participantA, b: convo.participantB } : null;
    }
    return { a: user?.id, b: selectedContact };
  })();

  const { data: thread = [] } = useQuery({
    queryKey: ["admin-thread", threadPartners?.a, threadPartners?.b],
    queryFn: async () => {
      if (!threadPartners) return [];
      const { data } = await supabase.from("messages").select("*")
        .or(`and(sender_id.eq.${threadPartners.a},receiver_id.eq.${threadPartners.b}),and(sender_id.eq.${threadPartners.b},receiver_id.eq.${threadPartners.a})`)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!threadPartners,
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("admin-messages-rt").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      const msg = payload.new as any;
      if (msg.sender_id === user.id || msg.receiver_id === user.id) {
        queryClient.invalidateQueries({ queryKey: ["admin-thread"] });
        queryClient.invalidateQueries({ queryKey: ["admin-chat-contacts"] });
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Mark read
  useEffect(() => {
    if (!user || !selectedContact || isSuperAdmin) return;
    supabase.from("messages").update({ is_read: true }).eq("receiver_id", user.id).eq("sender_id", selectedContact).eq("is_read", false)
      .then(() => queryClient.invalidateQueries({ queryKey: ["admin-chat-contacts"] }));
  }, [selectedContact, user, isSuperAdmin, queryClient]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread]);

  const handleSent = () => queryClient.invalidateQueries({ queryKey: ["admin-thread"] });

  const getInitials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const getRoleBadge = (r: string) => {
    const colors: Record<string, string> = {
      student: "bg-accent/10 text-accent-foreground border-accent/20",
      instructor: "bg-brand-gold-pale text-brand-gold-dark border-brand-gold/30",
      admin: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
      super_admin: "bg-secondary/10 text-secondary-foreground border-secondary/20",
    };
    return colors[r] || "bg-brand-cream text-brand-warm-grey border-brand-parchment";
  };

  // Build name/role maps for super admin
  const nameMap: Record<string, string> = {};
  const roleMap: Record<string, string> = {};
  if (isSuperAdmin) {
    contacts.forEach((c: any) => {
      nameMap[c.participantA] = c.nameA;
      nameMap[c.participantB] = c.nameB;
      roleMap[c.participantA] = c.roleA;
      roleMap[c.participantB] = c.roleB;
    });
  }

  const filteredContacts = contacts.filter((c: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (isSuperAdmin) return c.nameA?.toLowerCase().includes(q) || c.nameB?.toLowerCase().includes(q);
    return c.display_name?.toLowerCase().includes(q);
  });

  const totalMessages = isSuperAdmin ? contacts.reduce((s: number, c: any) => s + (c.count || 0), 0) : 0;
  const activeToday = isSuperAdmin ? contacts.filter((c: any) => isToday(new Date(c.lastAt))).length : 0;

  if (isLoading) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-[50vh] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="pt-2 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-2rem)]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
        <div className="mb-3 sm:mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">
              {isSuperAdmin ? "Message Monitor" : "Messages"}
            </h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-0.5" />
            <p className="text-brand-warm-grey text-xs sm:text-sm mt-0.5">
              {isSuperAdmin ? "Read-only view of all conversations" : "Message tutors and students"}
            </p>
          </div>
        </div>

        {/* Super admin stats */}
        {isSuperAdmin && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Conversations", value: contacts.length, icon: Users },
              { label: "Total Messages", value: totalMessages, icon: Mail },
              { label: "Active Today", value: activeToday, icon: Clock },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)] p-3 sm:p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-brand-gold" />
                </div>
                <div>
                  <p className="font-serif text-lg sm:text-xl font-bold text-brand-primary">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-brand-warm-grey">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0">
          {/* Contact list - desktop */}
          <Card className={`w-full lg:w-80 shrink-0 hidden ${selectedContact ? 'lg:flex' : 'md:flex'} flex-col bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)] ${isSuperAdmin ? 'max-h-[50vh] lg:max-h-none' : ''}`}>
            <div className="p-3 pb-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-warm-grey" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isSuperAdmin ? "Search conversations..." : "Search contacts..."} className="pl-9 h-10 rounded-xl border-brand-parchment focus:border-brand-gold text-sm" />
              </div>
            </div>
            <CardContent className="p-3 flex-1 overflow-y-auto space-y-1">
              {filteredContacts.length === 0 ? (
                <p className="text-sm text-brand-warm-grey text-center py-8">No conversations found.</p>
              ) : filteredContacts.map((c: any) => {
                if (isSuperAdmin) {
                  const isSelected = selectedContact === c.id;
                  return (
                    <button key={c.id} onClick={() => setSelectedContact(c.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all min-h-[48px] ${isSelected ? "bg-gradient-to-r from-brand-gold-pale to-brand-cream border border-brand-gold/30" : "hover:bg-brand-cream"}`}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-brand-charcoal-mid truncate">{c.nameA}</span>
                        <Badge className={`${getRoleBadge(c.roleA)} text-[8px] px-1 py-0 h-4`}>{c.roleA}</Badge>
                        <span className="text-[10px] text-brand-warm-grey">↔</span>
                        <span className="text-xs font-semibold text-brand-charcoal-mid truncate">{c.nameB}</span>
                        <Badge className={`${getRoleBadge(c.roleB)} text-[8px] px-1 py-0 h-4`}>{c.roleB}</Badge>
                      </div>
                      <p className="text-[11px] text-brand-warm-grey truncate">{c.lastMessage}</p>
                      <p className="text-[10px] text-brand-warm-grey/60 mt-0.5">{format(new Date(c.lastAt), "MMM dd, h:mm a")}</p>
                    </button>
                  );
                }
                // Regular admin contact
                return (
                  <button key={c.user_id} onClick={() => setSelectedContact(c.user_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all min-h-[48px] ${selectedContact === c.user_id ? "bg-gradient-to-r from-brand-gold-pale to-brand-cream border border-brand-gold/30" : "hover:bg-brand-cream"}`}>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center text-brand-primary font-bold text-xs shrink-0 border border-brand-gold/20">
                        {getInitials(c.display_name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-charcoal-mid truncate">{c.display_name}</p>
                      <Badge className={`${getRoleBadge(c.role)} text-[8px] px-1 py-0 h-4 mt-0.5`}>{c.role}</Badge>
                    </div>
                    {c.unread > 0 && (
                      <Badge className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-primary-foreground text-[10px] h-5 min-w-[20px] flex items-center justify-center border-0">{c.unread}</Badge>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Mobile contact list */}
          <div className={`${selectedContact ? 'hidden' : 'flex'} md:hidden w-full`}>
            <Card className="flex-1 bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)]">
              <div className="p-2 pb-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-warm-grey" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 h-10 rounded-xl border-brand-parchment focus:border-brand-gold text-sm" />
                </div>
              </div>
              <CardContent className="p-2 space-y-1">
                {filteredContacts.map((c: any) => {
                  if (isSuperAdmin) {
                    return (
                      <button key={c.id} onClick={() => setSelectedContact(c.id)} className="w-full text-left p-3 rounded-xl hover:bg-brand-cream min-h-[52px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-brand-charcoal-mid">{c.nameA}</span>
                          <span className="text-xs text-brand-warm-grey">↔</span>
                          <span className="text-sm font-semibold text-brand-charcoal-mid">{c.nameB}</span>
                        </div>
                        <p className="text-xs text-brand-warm-grey truncate mt-1">{c.lastMessage}</p>
                      </button>
                    );
                  }
                  return (
                    <button key={c.user_id} onClick={() => setSelectedContact(c.user_id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-cream min-h-[52px]">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center text-brand-primary font-bold text-xs">{getInitials(c.display_name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-charcoal-mid">{c.display_name}</p>
                        <Badge className={`${getRoleBadge(c.role)} text-[8px] px-1 py-0 h-4 mt-0.5`}>{c.role}</Badge>
                      </div>
                      {c.unread > 0 && <Badge className="bg-brand-primary text-primary-foreground text-xs border-0">{c.unread}</Badge>}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Thread */}
          {selectedContact ? (
            <Card className="flex-1 flex flex-col min-h-0 bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)] overflow-hidden">
              <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark p-3 sm:p-4 flex items-center gap-3">
                <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-primary-foreground" onClick={() => setSelectedContact(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light flex items-center justify-center text-brand-primary font-bold text-xs shrink-0">
                  {isSuperAdmin ? "M" : getInitials(contacts.find((c: any) => c.user_id === selectedContact)?.display_name || "")}
                </div>
                <div className="min-w-0">
                  {isSuperAdmin ? (
                    <>
                      <p className="font-semibold text-sm text-primary-foreground truncate">
                        {nameMap[threadPartners?.a || ""] || "User"} ↔ {nameMap[threadPartners?.b || ""] || "User"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={`${getRoleBadge(roleMap[threadPartners?.a || ""])} text-[8px] px-1 py-0 h-4`}>{roleMap[threadPartners?.a || ""]}</Badge>
                        <span className="text-primary-foreground/40 text-[10px]">↔</span>
                        <Badge className={`${getRoleBadge(roleMap[threadPartners?.b || ""])} text-[8px] px-1 py-0 h-4`}>{roleMap[threadPartners?.b || ""]}</Badge>
                        <span className="text-[10px] text-primary-foreground/50 ml-1">· {thread.length} messages</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-sm text-primary-foreground truncate">{contacts.find((c: any) => c.user_id === selectedContact)?.display_name}</p>
                      <p className="text-[10px] text-primary-foreground/50">{contacts.find((c: any) => c.user_id === selectedContact)?.role} · Online</p>
                    </>
                  )}
                </div>
              </div>
              <ScrollArea className="flex-1 p-3 sm:p-4">
                <div className="space-y-3">
                  {thread.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-5 h-5 text-brand-gold" />
                      </div>
                      <p className="text-brand-warm-grey text-sm">No messages yet.</p>
                    </div>
                  ) : thread.map((msg: any) => {
                    const isLeft = isSuperAdmin ? msg.sender_id === threadPartners?.a : msg.sender_id !== user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${isLeft ? "bg-brand-cream-dark text-brand-charcoal-mid rounded-bl-md" : "bg-gradient-to-br from-brand-primary/80 to-brand-primary-dark text-primary-foreground rounded-br-md"}`}>
                          {isSuperAdmin && <p className={`text-[10px] font-semibold mb-0.5 ${isLeft ? "text-brand-primary" : "text-brand-gold-light"}`}>{nameMap[msg.sender_id] || "User"}</p>}
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isLeft ? "text-brand-warm-grey" : "text-primary-foreground/50"}`}>{format(new Date(msg.created_at), "h:mm a")}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              {isSuperAdmin ? (
                <div className="p-3 border-t border-brand-parchment bg-brand-cream/50 text-center">
                  <p className="text-[11px] text-brand-warm-grey flex items-center justify-center gap-1.5">
                    <Shield className="h-3 w-3" /> Read-only — Super Admin cannot send messages
                  </p>
                </div>
              ) : (
                <div className="p-2.5 sm:p-3 border-t border-brand-parchment flex gap-2 bg-card">
                  <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20 h-11" onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} />
                  <Button onClick={handleSend} disabled={!message.trim() || sending} size="icon" className="bg-gradient-to-r from-brand-primary to-brand-primary-dark shrink-0 rounded-xl w-11 h-11 shadow-lg"><Send className="h-4 w-4" /></Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex-1 hidden md:flex items-center justify-center bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)]">
              <CardContent className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-7 w-7 text-brand-gold" />
                </div>
                <p className="font-serif text-brand-primary font-semibold">
                  {isSuperAdmin ? "Select a conversation to view" : "Select a contact to message"}
                </p>
                <p className="text-xs text-brand-warm-grey mt-1">
                  {isSuperAdmin ? "All messages are visible in read-only mode" : "Your conversations are private and secure"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminMessages;
