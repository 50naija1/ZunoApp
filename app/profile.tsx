import { useState } from "react";
import {
    Image,
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

export default function ProfileScreen() {
  const { artisanData, artisanToken, logoutArtisan } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: artisanData?.full_name || "",
    phone: artisanData?.phone || "",
    email: artisanData?.email || "",
    lga: artisanData?.lga || "",
    bio: artisanData?.bio || "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/artisan/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${artisanToken}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(data.message || "Profile updated!");
      setEditing(false);
    } catch {
      setMessage("Could not save. Check your internet.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHero}>
          <View style={styles.avatarCircle}>
            {artisanData?.profile_photo ? (
              <Image
                source={{ uri: artisanData.profile_photo }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {(artisanData?.full_name || "A")[0].toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.profileName}>
            {artisanData?.full_name || "Artisan"}
          </Text>
          <Text style={styles.profileSkill}>
            {artisanData?.category || "Technician"} · {artisanData?.lga || "Lagos"}
          </Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {artisanData?.is_verified ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✅ Verified</Text>
              </View>
            ) : null}
            {artisanData?.subscription_plan && artisanData.subscription_plan !== "basic" ? (
              <View style={[styles.badge, styles.badgeOrange]}>
                <Text style={styles.badgeTextOrange}>
                  ⭐ {artisanData.subscription_plan.toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{artisanData?.jobs_completed || "0"}</Text>
            <Text style={styles.statLbl}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: "#22c55e" }]}>
              {artisanData?.rating || "0.0"}
            </Text>
            <Text style={styles.statLbl}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{artisanData?.total_reviews || "0"}</Text>
            <Text style={styles.statLbl}>Reviews</Text>
          </View>
        </View>

        {/* Edit / Save button */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Details</Text>
            <TouchableOpacity onPress={() => editing ? saveProfile() : setEditing(true)}>
              <Text style={styles.editBtn}>
                {editing ? (loading ? "Saving..." : "Save ✓") : "Edit ✏️"}
              </Text>
            </TouchableOpacity>
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          {[
            { label: "Full Name", key: "full_name", placeholder: "Your full name" },
            { label: "Phone", key: "phone", placeholder: "08012345678" },
            { label: "Email", key: "email", placeholder: "your@email.com" },
            { label: "LGA", key: "lga", placeholder: "Your LGA" },
            { label: "Bio", key: "bio", placeholder: "Tell clients about yourself..." },
          ].map((field, i) => (
            <View key={i} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              {editing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={form[field.key as keyof typeof form]}
                  onChangeText={v => setForm({ ...form, [field.key]: v })}
                  placeholder={field.placeholder}
                  placeholderTextColor="#555"
                  multiline={field.key === "bio"}
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {artisanData?.[field.key] || "—"}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutArtisan}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  profileHero: {
    alignItems: "center", paddingTop: 56,
    paddingBottom: 24, backgroundColor: "#1a1a1a",
    borderBottomWidth: 1, borderBottomColor: "#222",
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#f97316", alignItems: "center",
    justifyContent: "center", marginBottom: 12,
    borderWidth: 3, borderColor: "#f97316",
    overflow: "hidden",
  },
  avatarImg: { width: 90, height: 90 },
  avatarInitial: { color: "white", fontSize: 36, fontWeight: "900" },
  profileName: { color: "white", fontSize: 22, fontWeight: "900" },
  profileSkill: { color: "#888", fontSize: 14, marginTop: 4 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  badge: {
    backgroundColor: "#0d2e1a", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeText: { color: "#22c55e", fontSize: 12, fontWeight: "700" },
  badgeOrange: { backgroundColor: "#2a1500" },
  badgeTextOrange: { color: "#f97316", fontSize: 12, fontWeight: "700" },
  statsRow: {
    flexDirection: "row", backgroundColor: "#1a1a1a",
    borderBottomWidth: 1, borderBottomColor: "#222",
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statNum: { color: "#f97316", fontSize: 22, fontWeight: "900" },
  statLbl: { color: "#888", fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#222", marginVertical: 12 },
  section: { padding: 20 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  sectionTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  editBtn: { color: "#f97316", fontSize: 15, fontWeight: "600" },
  message: { color: "#22c55e", fontSize: 13, marginBottom: 12, textAlign: "center" },
  fieldRow: {
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
  },
  fieldLabel: { color: "#666", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  fieldValue: { color: "white", fontSize: 15 },
  fieldInput: {
    color: "white", fontSize: 15,
    backgroundColor: "#1a1a1a", borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: "#333",
  },
  logoutBtn: {
    margin: 20, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: "#333", alignItems: "center",
    marginBottom: 40,
  },
  logoutText: { color: "#888", fontSize: 15 },
});