import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "./context";

const API    = "https://zuno.ng/api";
const WS_URL = "https://zuno.ng";

function fmtTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function SupportScreen() {
  const { artisanToken, artisanData } = useAuth();
  const [messages,  setMessages]  = useState<any[]>([]);
  const [text,      setText]      = useState("");
  const [sending,   setSending]   = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [clearing,  setClearing]  = useState(false);
  const scrollRef   = useRef<ScrollView>(null);
  const socketRef   = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadHistory();
    connectSocket();
    return () => {
      socketRef.current?.disconnect?.();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const WELCOME = {
    id: "welcome", sender: "Zuno Support",
    text: "👋 Welcome to Zuno Support! How can we help you today?",
    time: fmtTime(new Date()), isMe: false,
  };

  const loadHistory = async () => {
    try {
      const res  = await fetch(`${API}/artisan/support/messages`, {
        headers: { Authorization: `Bearer ${artisanToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages);
      } else {
        setMessages([WELCOME]);
      }
    } catch {
      setMessages([WELCOME]);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    try {
      const { io } = require("socket.io-client");
      const artisanId = artisanData?.id;
      const room = `artisan_${artisanId}`;
      const socket = io(WS_URL, {
        transports: ["websocket", "polling"],
        auth: { token: artisanToken },
        reconnection: true, reconnectionAttempts: 5, timeout: 10000,
      });
      socket.on("connect", () => {
        setConnected(true);
        socket.emit("join_room", `room_${room}`);
      });
      socket.on("disconnect", () => setConnected(false));
      socket.on("new_chat_message", (msg: any) => {
        if (msg.room !== room) return;
        if (msg.sender_type === "artisan") return;
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, {
            id: msg.id, sender: msg.sender_name || "Zuno Support",
            text: msg.message,
            time: fmtTime(new Date(msg.created_at || Date.now())),
            isMe: false,
          }];
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      });
      socketRef.current = socket;
    } catch {
      setConnected(false);
      intervalRef.current = setInterval(loadHistory, 10000);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, sender: artisanData?.full_name || "Me",
      text: text.trim(), time: fmtTime(new Date()), isMe: true,
      delivered: false, failed: false,
    }]);
    const msgText = text.trim();
    setText("");
    setSending(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      const res = await fetch(`${API}/artisan/support/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${artisanToken}` },
        body: JSON.stringify({ message: msgText }),
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, delivered: true } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true } : m));
    } finally {
      setSending(false);
    }
  };

  // ── Delete single message — removes from server so refresh won't show it
  const deleteMessage = (id: any) => {
    if (id === "welcome") return; // can't delete welcome message
    Alert.alert("Delete Message", "Remove this message permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setMessages(prev => prev.filter(m => m.id !== id));
          try {
            await fetch(`${API}/artisan/support/messages/${id}`, {
              method:  "DELETE",
              headers: { Authorization: `Bearer ${artisanToken}` },
            });
          } catch {}
        },
      },
    ]);
  };

  // ── Clear all — removes from server permanently
  const clearChat = () => {
    Alert.alert("Clear Chat", "This will permanently delete all messages. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear Chat", style: "destructive",
        onPress: async () => {
          setClearing(true);
          setMessages([WELCOME]);
          try {
            await fetch(`${API}/artisan/support/clear/all`, {
              method:  "DELETE",
              headers: { Authorization: `Bearer ${artisanToken}` },
            });
          } catch {}
          setClearing(false);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.avatarBox}><Text style={s.avatarZ}>Z</Text></View>
          <View>
            <Text style={s.headerTitle}>Zuno Support</Text>
            <View style={s.statusRow}>
              <View style={[s.statusDot, connected ? s.dotOnline : s.dotOffline]} />
              <Text style={s.statusText}>{connected ? "Online" : "Connecting..."}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={s.clearBtn} onPress={clearChat} disabled={clearing}>
          {clearing
            ? <ActivityIndicator color="#ef4444" size="small" />
            : <Text style={s.clearBtnTxt}>🗑 Clear</Text>
          }
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color="#f97316" />
          <Text style={s.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={s.messages}
          contentContainerStyle={s.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((msg, i) => (
            <View key={msg.id ?? i} style={[s.msgRow, msg.isMe && s.msgRowMe]}>
              {!msg.isMe && (
                <View style={s.supportAvatar}><Text style={s.supportAvatarTxt}>Z</Text></View>
              )}
              <TouchableOpacity
                style={[s.bubble, msg.isMe ? s.bubbleMe : s.bubbleThem]}
                onLongPress={() => deleteMessage(msg.id)}
                activeOpacity={0.9}>
                {!msg.isMe && <Text style={s.bubbleSender}>{msg.sender || "Zuno Support"}</Text>}
                <Text style={[s.bubbleText, msg.isMe && s.bubbleTextMe]}>
                  {msg.text || msg.message || ""}
                </Text>
                <View style={s.bubbleMeta}>
                  <Text style={[s.bubbleTime, msg.isMe && s.bubbleTimeMe]}>{msg.time || ""}</Text>
                  {msg.isMe && (
                    <Text style={s.tick}>{msg.failed ? " ❌" : msg.delivered ? " ✓✓" : " ✓"}</Text>
                  )}
                </View>
              </TouchableOpacity>
              {/* ✕ delete button — only my messages, not welcome */}
              {msg.isMe && msg.id !== "welcome" && (
                <TouchableOpacity
                  style={s.msgDeleteBtn}
                  onPress={() => deleteMessage(msg.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={s.msgDeleteTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={s.noticeBanner}>
        <Text style={s.noticeText}>⚠️ Responses within a few hours. Long-press bubble to delete.</Text>
      </View>
      <View style={s.inputBar}>
        <TextInput
          style={s.input} placeholder="Type a message..."
          placeholderTextColor="#888" value={text}
          onChangeText={setText} multiline maxLength={500} />
        <TouchableOpacity
          style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnOff]}
          onPress={sendMessage} disabled={!text.trim() || sending}>
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.sendBtnText}>➤</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#111" },
  header:           { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#1a1a1a", borderBottomWidth: 1, borderBottomColor: "#222", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft:       { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBox:        { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
  avatarZ:          { color: "#fff", fontWeight: "900", fontSize: 20 },
  headerTitle:      { color: "#fff", fontSize: 17, fontWeight: "800" },
  statusRow:        { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  statusDot:        { width: 7, height: 7, borderRadius: 4 },
  dotOnline:        { backgroundColor: "#22c55e" },
  dotOffline:       { backgroundColor: "#888" },
  statusText:       { color: "#888", fontSize: 12 },
  clearBtn:         { backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  clearBtnTxt:      { color: "#ef4444", fontSize: 12, fontWeight: "700" },
  loadingBox:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:      { color: "#888", fontSize: 13 },
  messages:         { flex: 1 },
  messagesContent:  { padding: 16, paddingBottom: 8 },
  msgRow:           { flexDirection: "row", alignItems: "flex-end", marginBottom: 14, gap: 8 },
  msgRowMe:         { flexDirection: "row-reverse" },
  supportAvatar:    { width: 30, height: 30, borderRadius: 15, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", marginBottom: 2 },
  supportAvatarTxt: { color: "#fff", fontWeight: "900", fontSize: 13 },
  bubble:           { maxWidth: "78%", borderRadius: 18, padding: 12, paddingHorizontal: 14 },
  bubbleThem:       { backgroundColor: "#1e1e1e", borderTopLeftRadius: 4, borderWidth: 1, borderColor: "#2a2a2a" },
  bubbleMe:         { backgroundColor: "#f97316", borderTopRightRadius: 4 },
  bubbleSender:     { color: "#f97316", fontSize: 11, fontWeight: "700", marginBottom: 3 },
  bubbleText:       { color: "#eee", fontSize: 15, lineHeight: 21 },
  bubbleTextMe:     { color: "#fff" },
  bubbleMeta:       { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 },
  bubbleTime:       { color: "#666", fontSize: 11 },
  bubbleTimeMe:     { color: "rgba(255,255,255,0.7)" },
  tick:             { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  msgDeleteBtn:     { width: 24, height: 24, borderRadius: 12, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  msgDeleteTxt:     { color: "#fff", fontSize: 11, fontWeight: "900" },
  noticeBanner:     { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#1a0a00", borderTopWidth: 1, borderTopColor: "#2a1800" },
  noticeText:       { color: "#f97316aa", fontSize: 11, textAlign: "center" },
  inputBar:         { flexDirection: "row", alignItems: "flex-end", padding: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#1e1e1e", gap: 10, backgroundColor: "#111" },
  input:            { flex: 1, backgroundColor: "#1e1e1e", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#2a2a2a", maxHeight: 100 },
  sendBtn:          { width: 48, height: 48, borderRadius: 24, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
  sendBtnOff:       { backgroundColor: "#2a2a2a" },
  sendBtnText:      { color: "#fff", fontSize: 18, fontWeight: "700" },
});