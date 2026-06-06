import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../services/context";

const API    = "https://zuno.ng/api";
const WS_URL = "https://zuno.ng";

function fmtTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Customer Support Popup ───────────────────────────────────────────────────
function CustomerSupportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [email,     setEmail]     = useState("");
  const [message,   setMessage]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setName(""); setPhone(""); setEmail(""); setMessage("");
    setSubmitted(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !message.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields before submitting.");
      return;
    }
    setSending(true);
    try {
      const res  = await fetch(`${API}/user/support/ticket`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        Alert.alert("Error", data.message || "Could not send. Please try again.");
      }
    } catch {
      Alert.alert("Error", "No internet connection. Please try again.");
    }
    setSending(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={cs.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={cs.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={cs.sheet}>

          <View style={cs.sheetHandle} />
          <View style={cs.sheetHeader}>
            <View style={cs.sheetHeaderLeft}>
              <View style={cs.sheetAvatar}><Text style={cs.sheetAvatarTxt}>Z</Text></View>
              <View>
                <Text style={cs.sheetTitle}>Zuno Support</Text>
                <Text style={cs.sheetSub}>We reply within a few hours</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={cs.closeBtn}>
              <Ionicons name="close" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={cs.successBox}>
              <View style={cs.successIcon}>
                <Ionicons name="checkmark-circle" size={52} color="#22c55e" />
              </View>
              <Text style={cs.successTitle}>Message Sent!</Text>
              <Text style={cs.successSub}>
                Thank you {name.split(" ")[0]}! Our team will contact you on {phone} or {email} shortly.
              </Text>
              <TouchableOpacity style={cs.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={cs.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={cs.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={cs.formIntro}>
                Have a question or complaint? Fill the form below and we will get back to you.
              </Text>

              <Text style={cs.label}>Full Name</Text>
              <TextInput
                style={cs.input}
                placeholder="Your full name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text style={cs.label}>Phone Number</Text>
              <TextInput
                style={cs.input}
                placeholder="08012345678"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={cs.label}>Email Address</Text>
              <TextInput
                style={cs.input}
                placeholder="your@email.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={cs.label}>Your Message / Complaint</Text>
              <TextInput
                style={[cs.input, cs.textArea]}
                placeholder="Tell us how we can help you..."
                placeholderTextColor="#666"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                maxLength={1000}
              />
              <Text style={cs.charCount}>{message.length}/1000</Text>

              <TouchableOpacity
                style={[cs.submitBtn, sending && cs.submitBtnOff]}
                onPress={handleSubmit}
                disabled={sending}
                activeOpacity={0.85}>
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="send" size={16} color="#fff" />
                      <Text style={cs.submitBtnTxt}> Send Message</Text>
                    </>
                }
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Support Screen ──────────────────────────────────────────────────────
export default function SupportScreen() {
  const { artisanToken, artisanData } = useAuth();
  const insets = useSafeAreaInsets();

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [messages,  setMessages]  = useState<any[]>([]);
  const [text,      setText]      = useState("");
  const [sending,   setSending]   = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [clearing,  setClearing]  = useState(false);
  const scrollRef   = useRef<ScrollView>(null);
  const socketRef   = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    if (!artisanToken) return;
    loadHistory();
    connectSocket();
    return () => {
      socketRef.current?.disconnect?.();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── CUSTOMER screen ───────────────────────────────────────────────────────
  if (!artisanToken) {
    return (
      <View style={[s.customerRoot, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

        <CustomerSupportModal
          visible={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
        />

        {/* Header */}
        <View style={s.customerHeader}>
          <View style={s.customerAvatar}><Text style={s.customerAvatarTxt}>Z</Text></View>
          <View>
            <Text style={s.customerHeaderTitle}>Zuno Support</Text>
            <Text style={s.customerHeaderSub}>We're here to help</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.customerContent}>

          <View style={s.customerHero}>
            <Text style={s.customerHeroEmoji}>💬</Text>
            <Text style={s.customerHeroTitle}>How can we help you?</Text>
            <Text style={s.customerHeroSub}>
              Got a question, complaint or feedback? Our support team is ready to assist you.
            </Text>
          </View>

          {/* ── 4 Support Options ── */}
          {[
            {
              icon: "help-circle-outline" as const,
              iconBg: "rgba(59,130,246,0.12)",
              iconColor: "#3b82f6",
              title: "FAQ",
              sub: "Browse frequently asked questions",
              onPress: () => Linking.openURL("https://zuno.ng/help"),
            },
            {
              icon: "document-text-outline" as const,
              iconBg: "rgba(168,85,247,0.12)",
              iconColor: "#a855f7",
              title: "Terms & Conditions",
              sub: "Read our terms of use",
              onPress: () => Linking.openURL("https://zuno.ng/terms"),
            },
            {
              icon: "mail-outline" as const,
              iconBg: "rgba(249,115,22,0.12)",
              iconColor: "#f97316",
              title: "Send a Message",
              sub: "Fill a form and we reply within a few hours",
              onPress: () => setShowCustomerModal(true),
            },
            {
              icon: "logo-whatsapp" as const,
              iconBg: "rgba(37,211,102,0.12)",
              iconColor: "#25D366",
              title: "WhatsApp Support",
              sub: "Message us directly on WhatsApp",
              onPress: () => Linking.openURL("https://zuno.ng/whatsapp"),
            },
          ].map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={s.supportOption}
              onPress={opt.onPress}
              activeOpacity={0.85}>
              <View style={[s.optionIcon, { backgroundColor: opt.iconBg }]}>
                <Ionicons name={opt.icon} size={24} color={opt.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.optionTitle}>{opt.title}</Text>
                <Text style={s.optionSub}>{opt.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>
          ))}

          <View style={s.divider} />

          <View style={s.infoCard}>
            <Ionicons name="time-outline" size={18} color="#f97316" />
            <Text style={s.infoCardTxt}>Support hours: Monday – Saturday, 8am – 8pm (WAT)</Text>
          </View>

          <View style={s.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#22c55e" />
            <Text style={s.infoCardTxt}>All complaints are reviewed by our team within 24 hours</Text>
          </View>

        </ScrollView>
      </View>
    );
  }

  // ── ARTISAN — full live chat (UNCHANGED) ──────────────────────────────────
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

  const deleteMessage = (id: any) => {
    if (id === "welcome") return;
    Alert.alert("Delete Message", "Remove this message permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setMessages(prev => prev.filter(m => m.id !== id));
          try {
            await fetch(`${API}/artisan/support/messages/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${artisanToken}` },
            });
          } catch {}
        },
      },
    ]);
  };

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
              method: "DELETE",
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
          style={s.input}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnOff]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}>
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.sendBtnText}>➤</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Customer Support Modal Styles ────────────────────────────────────────────
const cs = StyleSheet.create({
  overlay:       { flex: 1, justifyContent: "flex-end" },
  backdrop:      { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet:         { backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", paddingBottom: 10 },
  sheetHandle:   { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  sheetHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#222" },
  sheetHeaderLeft:{ flexDirection: "row", alignItems: "center", gap: 12 },
  sheetAvatar:   { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
  sheetAvatarTxt:{ color: "#fff", fontWeight: "900", fontSize: 20 },
  sheetTitle:    { color: "#fff", fontSize: 16, fontWeight: "800" },
  sheetSub:      { color: "#888", fontSize: 12, marginTop: 2 },
  closeBtn:      { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1e1e1e", alignItems: "center", justifyContent: "center" },
  form:          { paddingHorizontal: 20, paddingTop: 16 },
  formIntro:     { color: "#aaa", fontSize: 14, lineHeight: 22, marginBottom: 20 },
  label:         { color: "#888", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input:         { backgroundColor: "#1e1e1e", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: "#2a2a2a" },
  textArea:      { height: 120, textAlignVertical: "top" },
  charCount:     { color: "#555", fontSize: 11, textAlign: "right", marginTop: -10, marginBottom: 16 },
  submitBtn:     { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 },
  submitBtnOff:  { backgroundColor: "#333" },
  submitBtnTxt:  { color: "#fff", fontWeight: "800", fontSize: 16 },
  successBox:    { alignItems: "center", padding: 40, gap: 12 },
  successIcon:   { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(34,197,94,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  successTitle:  { color: "#fff", fontSize: 22, fontWeight: "900" },
  successSub:    { color: "#aaa", fontSize: 14, lineHeight: 22, textAlign: "center" },
  doneBtn:       { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 16 },
  doneBtnTxt:    { color: "#fff", fontWeight: "800", fontSize: 16 },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Customer screen ───────────────────────────────────────────────────────
  customerRoot:        { flex: 1, backgroundColor: "#0a0a0a" },
  customerHeader:      { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  customerAvatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
  customerAvatarTxt:   { color: "#fff", fontWeight: "900", fontSize: 20 },
  customerHeaderTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  customerHeaderSub:   { color: "#888", fontSize: 12, marginTop: 2 },
  customerContent:     { padding: 20, gap: 0 },
  customerHero:        { alignItems: "center", paddingVertical: 24, gap: 10 },
  customerHeroEmoji:   { fontSize: 52 },
  customerHeroTitle:   { color: "#fff", fontSize: 22, fontWeight: "900", textAlign: "center" },
  customerHeroSub:     { color: "#888", fontSize: 14, lineHeight: 22, textAlign: "center" },
  supportOption:       { flexDirection: "row", alignItems: "center", backgroundColor: "#161616", borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: "#222", marginBottom: 10 },
  optionIcon:          { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  optionTitle:         { color: "#fff", fontWeight: "700", fontSize: 15, marginBottom: 3 },
  optionSub:           { color: "#888", fontSize: 12 },
  divider:             { height: 1, backgroundColor: "#1e1e1e", marginVertical: 16 },
  infoCard:            { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#161616", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#222", marginBottom: 10 },
  infoCardTxt:         { color: "#888", fontSize: 13, lineHeight: 20, flex: 1 },

  // ── Artisan live chat ─────────────────────────────────────────────────────
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