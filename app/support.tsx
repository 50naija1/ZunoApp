import { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView, Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "./context";

const API = "https://zuno.ng/api";

export default function SupportScreen() {
  const { artisanToken, artisanData } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/artisan/support/messages`, {
        headers: { Authorization: `Bearer ${artisanToken}` },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // Show welcome message if API not available
      setMessages([
        {
          id: 1,
          sender: "Zuno Support",
          text: "Welcome to zuno.ng home of skills works",
          time: "12:14",
          isMe: false,
        },
      ]);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: artisanData?.full_name || "Me",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setText("");
    setLoading(true);
    try {
      await fetch(`${API}/artisan/support/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${artisanToken}`,
        },
        body: JSON.stringify({ message: newMsg.text }),
      });
    } catch { }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>💬</Text>
        <View>
          <Text style={styles.headerTitle}>Support Chat</Text>
          <Text style={styles.headerSub}>Chat directly with Zuno admin</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>

        {messages.map((msg, i) => (
          <View key={i} style={[styles.msgRow, msg.isMe && styles.msgRowMe]}>
            <View style={[styles.msgBubble, msg.isMe && styles.msgBubbleMe]}>
              {!msg.isMe && (
                <Text style={styles.msgSender}>{msg.sender}</Text>
              )}
              <Text style={[styles.msgText, msg.isMe && styles.msgTextMe]}>
                {msg.text}
              </Text>
              <Text style={[styles.msgTime, msg.isMe && styles.msgTimeMe]}>
                {msg.time}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Report Issue Box */}
      <View style={styles.reportBox}>
        <Text style={styles.reportTitle}>⚠️ Report an Issue</Text>
        <Text style={styles.reportSub}>
          Having a problem? Send a message above and our admin will respond within a few hours.
        </Text>
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim() || loading}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  headerIcon: { fontSize: 28 },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "#888", fontSize: 13, marginTop: 2 },
  messages: { flex: 1 },
  msgRow: { marginBottom: 16, alignItems: "flex-start" },
  msgRowMe: { alignItems: "flex-end" },
  msgBubble: {
    backgroundColor: "#1e1e1e", borderRadius: 16,
    borderTopLeftRadius: 4, padding: 12,
    maxWidth: "80%", borderWidth: 1, borderColor: "#2a2a2a",
  },
  msgBubbleMe: {
    backgroundColor: "#f97316", borderRadius: 16,
    borderTopRightRadius: 4, borderColor: "#f97316",
  },
  msgSender: { color: "#888", fontSize: 11, fontWeight: "700", marginBottom: 4 },
  msgText: { color: "white", fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: "white" },
  msgTime: { color: "#666", fontSize: 11, marginTop: 4, textAlign: "right" },
  msgTimeMe: { color: "rgba(255,255,255,0.7)" },
  reportBox: {
    backgroundColor: "#1a0800", margin: 16, marginTop: 0,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#f9731644",
  },
  reportTitle: { color: "#f97316", fontWeight: "700", fontSize: 14, marginBottom: 4 },
  reportSub: { color: "#888", fontSize: 12, lineHeight: 18 },
  inputRow: {
    flexDirection: "row", padding: 16, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: "#1e1e1e",
    alignItems: "flex-end", gap: 10,
  },
  input: {
    flex: 1, backgroundColor: "#1e1e1e", borderRadius: 12,
    padding: 14, color: "white", fontSize: 15,
    borderWidth: 1, borderColor: "#2a2a2a", maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: "#f97316", borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  sendBtnDisabled: { backgroundColor: "#2a2a2a" },
  sendBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
});