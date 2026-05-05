import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text, TextInput, TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "./context";

const API = "https://zuno.ng/api";

const SKILLS = [
  "AC Technician","Electrician","Plumber","Cleaner","Carpenter",
  "Painter","Tiler","Welder","Auto Mechanic","Generator Repair",
  "Fumigation","Locksmith","Electronics Repair","Gardener",
  "Washing Machine Repair","Refrigerator Repair","TV Mounting",
  "Microwave Repair","Borehole / Water","CCTV / Security",
  "Roof Repair","Inverter / Solar","Other",
];

const LGAS = [
  "Lekki","Victoria Island","Ikoyi","Ajah","Ikeja","Surulere",
  "Yaba","Gbagada","Magodo","Ojodu","Ikorodu","Mushin",
  "Oshodi","Agege","Apapa","Badagry","Epe","Alimosho",
  "Kosofe","Shomolu","Other",
];

function ArtisanDashboard({ artisan, onLogout }: any) {
  const [online, setOnline] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <StatusBar barStyle="light-content" />
      <View style={d.topBar}>
        <Text style={d.topBarBrand}>Zuno</Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View style={d.bellBox}>
            <Ionicons name="notifications-outline" size={22} color="#888" />
          </View>
          <View style={d.avatar}>
            {artisan?.photo
              ? <Image source={{ uri: artisan.photo }} style={d.avatarImg} />
              : <Ionicons name="person" size={20} color="#fff" />
            }
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={d.greetCard}>
          <View style={{ flex: 1 }}>
            <Text style={d.greetSmall}>Good day,</Text>
            <Text style={d.greetName}>{artisan?.full_name || artisan?.name || "Artisan"}</Text>
            <Text style={d.greetSub}>{artisan?.category || artisan?.skill || "Technician"} · {artisan?.lga || "Lagos"}</Text>
          </View>
          <View style={d.greetAvatar}>
            <Ionicons name="person" size={36} color="#fff" />
          </View>
        </View>

        <View style={d.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={d.cardTitle}>Availability Status</Text>
            <Switch
              value={online}
              onValueChange={setOnline}
              trackColor={{ false: "#333", true: "#22c55e" }}
              thumbColor="#fff"
            />
          </View>
          <View style={[d.statusBadge, { backgroundColor: online ? "rgba(34,197,94,0.12)" : "rgba(100,100,100,0.12)" }]}>
            <View style={[d.statusDot, { backgroundColor: online ? "#22c55e" : "#666" }]} />
            <Text style={[d.statusTxt, { color: online ? "#22c55e" : "#888" }]}>
              {online ? "You are Online — Receiving job alerts actively" : "You are Offline"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            {["Snooze 1hr", "Snooze 3hrs", "Go Offline"].map((btn, i) => (
              <TouchableOpacity key={i} style={d.snoozeBtn}>
                <Text style={d.snoozeTxt}>{i < 2 ? "⏸ " : "⏺ "}{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 10 }}>
          {[
            { num: artisan?.jobs_completed || "0", lbl: "Jobs Completed", color: "#f97316" },
            { num: artisan?.rating || "0.0", lbl: "Star Rating", color: "#22c55e" },
            { num: artisan?.total_reviews || "0", lbl: "Total Reviews", color: "#fff" },
          ].map((st, i) => (
            <View key={i} style={[d.statBox, { flex: 1 }]}>
              <Text style={[d.statNum, { color: st.color }]}>{st.num}</Text>
              <Text style={d.statLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        <View style={d.premiumCard}>
          <View style={{ flex: 1 }}>
            <Text style={d.premiumTitle}>Premium Plan</Text>
            <Text style={d.premiumSub}>Upgrade to receive priority job alerts</Text>
          </View>
          <TouchableOpacity style={d.upgradeBtn}>
            <Text style={d.upgradeTxt}>Upgrade →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>Recent Job Alerts</Text>
            <Text style={{ color: "#f97316", fontSize: 13 }}>View all</Text>
          </View>
          {alerts.length === 0 ? (
            <View style={d.emptyAlerts}>
              <Text style={{ color: "#888", textAlign: "center" }}>
                No alerts yet. Toggle ON to start receiving jobs.
              </Text>
            </View>
          ) : alerts.map((alert, i) => (
            <View key={i} style={d.alertRow}>
              <Text style={{ color: "#fff", flex: 1 }}>{alert.title}</Text>
              <Text style={{ color: "#888", fontSize: 12 }}>{alert.time}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={{ margin: 16, marginTop: 24, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#333", alignItems: "center" }}
          onPress={onLogout}>
          <Text style={{ color: "#888", fontSize: 15 }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function ArtisanScreen() {
  const { loginArtisan, logoutArtisan, artisanToken, artisanData } = useAuth();
  const [tab, setTab] = useState<"register" | "login">("register");
  const [form, setForm] = useState({ name: "", phone: "", email: "", skill: "", lga: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [msgOk, setMsgOk] = useState(true);
  const [showSkill, setShowSkill] = useState(false);
  const [showLga, setShowLga] = useState(false);

  // ✅ If logged in show dashboard
  if (artisanToken) return (
    <ArtisanDashboard
      artisan={artisanData}
      onLogout={logoutArtisan}
    />
  );

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.skill || !form.lga) {
      setMessage("Please fill all required fields."); setMsgOk(false); return;
    }
    setLoading(true); setMessage("");
    try {
      const res = await fetch(`${API}/artisan/register`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(data.message || "Account created! Please login."); setMsgOk(true);
      setTab("login");
    } catch { setMessage("Could not connect. Check your internet."); setMsgOk(false); }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setMessage("Please enter email and password."); setMsgOk(false); return;
    }
    setLoading(true); setMessage("");
    try {
      const res = await fetch(`${API}/artisan/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.success && data.token) {
        // ✅ This changes the bottom nav to artisan nav
        loginArtisan(data.token, data.artisan);
      } else {
        setMessage(data.message || "Login failed. Check credentials."); setMsgOk(false);
      }
    } catch { setMessage("Could not connect. Check your internet."); setMsgOk(false); }
    setLoading(false);
  };

  const PickerModal = ({ visible, items, onSelect, onClose }: any) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.sheetHdr}>
            <Text style={s.sheetHdrTxt}>Select</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {items.map((item: string, i: number) => (
              <TouchableOpacity key={i} style={s.sheetItem} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={s.sheetItemTxt}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <PickerModal visible={showSkill} items={SKILLS}
        onSelect={(v: string) => setForm({ ...form, skill: v })}
        onClose={() => setShowSkill(false)} />
      <PickerModal visible={showLga} items={LGAS}
        onSelect={(v: string) => setForm({ ...form, lga: v })}
        onClose={() => setShowLga(false)} />

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.headerIcon}>
            <Ionicons name="construct" size={28} color="#fff" />
          </View>
          <Text style={s.headerTitle}>Artisan Portal</Text>
          <Text style={s.headerSub}>Register or login to your artisan account</Text>
        </View>

        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, tab === "register" && s.tabActive]}
            onPress={() => { setTab("register"); setMessage(""); }}>
            <Text style={[s.tabTxt, tab === "register" && s.tabTxtActive]}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, tab === "login" && s.tabActive]}
            onPress={() => { setTab("login"); setMessage(""); }}>
            <Text style={[s.tabTxt, tab === "login" && s.tabTxtActive]}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={s.form}>
          {tab === "register" ? (
            <>
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>FULL NAME</Text>
                  <TextInput style={s.whiteInput} placeholder="Your full name" placeholderTextColor="#aaa"
                    value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>PHONE</Text>
                  <TextInput style={s.whiteInput} placeholder="08012345678" placeholderTextColor="#aaa"
                    keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} />
                </View>
              </View>

              <Text style={s.fieldLabel}>EMAIL</Text>
              <TextInput style={s.whiteInput} placeholder="your@email.com" placeholderTextColor="#aaa"
                keyboardType="email-address" autoCapitalize="none"
                value={form.email} onChangeText={v => setForm({ ...form, email: v })} />

              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>YOUR SKILL</Text>
                  <TouchableOpacity style={s.whiteDropdown} onPress={() => setShowSkill(true)}>
                    <Text style={form.skill ? s.dropdownVal : s.dropdownPh}>{form.skill || "Select skill"}</Text>
                    <Ionicons name="chevron-down" size={18} color="#888" />
                  </TouchableOpacity>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>YOUR LGA</Text>
                  <TouchableOpacity style={s.whiteDropdown} onPress={() => setShowLga(true)}>
                    <Text style={form.lga ? s.dropdownVal : s.dropdownPh}>{form.lga || "Select LGA"}</Text>
                    <Ionicons name="chevron-down" size={18} color="#888" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={s.fieldLabel}>PASSWORD</Text>
              <TextInput style={s.whiteInput} placeholder="Password" placeholderTextColor="#aaa"
                secureTextEntry value={form.password} onChangeText={v => setForm({ ...form, password: v })} />

              {message ? <Text style={[s.msg, { color: msgOk ? "#22c55e" : "#ef4444" }]}>{message}</Text> : null}

              <TouchableOpacity style={s.btnOrange} onPress={handleRegister} disabled={loading}>
                <Text style={s.btnOrangeTxt}>{loading ? "Creating Account..." : "Create Account →"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setTab("login"); setMessage(""); }}>
                <Text style={s.switchTxt}>
                  Already have an account? <Text style={{ color: "#f97316" }}>Login here</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <TextInput style={s.whiteInput} placeholder="your@email.com" placeholderTextColor="#aaa"
                keyboardType="email-address" autoCapitalize="none"
                value={loginForm.email} onChangeText={v => setLoginForm({ ...loginForm, email: v })} />

              <Text style={s.fieldLabel}>PASSWORD</Text>
              <TextInput style={s.whiteInput} placeholder="Your password" placeholderTextColor="#aaa"
                secureTextEntry value={loginForm.password}
                onChangeText={v => setLoginForm({ ...loginForm, password: v })} />

              {message ? <Text style={[s.msg, { color: msgOk ? "#22c55e" : "#ef4444" }]}>{message}</Text> : null}

              <TouchableOpacity style={s.btnOrange} onPress={handleLogin} disabled={loading}>
                <Text style={s.btnOrangeTxt}>{loading ? "Logging in..." : "Login to Dashboard →"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setTab("register"); setMessage(""); }}>
                <Text style={s.switchTxt}>
                  No account? <Text style={{ color: "#f97316" }}>Register here</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const d = StyleSheet.create({
  topBar: { backgroundColor: "#f97316", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  topBarBrand: { color: "#fff", fontSize: 22, fontWeight: "900" },
  bellBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: 40, height: 40 },
  greetCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#161616", margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#222" },
  greetSmall: { color: "#888", fontSize: 13 },
  greetName: { color: "#fff", fontSize: 22, fontWeight: "900" },
  greetSub: { color: "#888", fontSize: 13, marginTop: 2 },
  greetAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "#161616", margin: 16, marginTop: 0, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#222" },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  statusBadge: { borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTxt: { fontSize: 13, fontWeight: "600", flex: 1 },
  snoozeBtn: { backgroundColor: "#222", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "#333" },
  snoozeTxt: { color: "#888", fontSize: 12 },
  statBox: { backgroundColor: "#161616", borderRadius: 14, padding: 18, alignItems: "center", borderWidth: 1, borderColor: "#222" },
  statNum: { fontSize: 26, fontWeight: "900" },
  statLbl: { color: "#888", fontSize: 11, marginTop: 4, textAlign: "center" },
  premiumCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a0800", margin: 16, marginTop: 10, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#f97316" },
  premiumTitle: { color: "#f97316", fontSize: 16, fontWeight: "800" },
  premiumSub: { color: "#888", fontSize: 12, marginTop: 2 },
  upgradeBtn: { backgroundColor: "#f97316", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  upgradeTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  emptyAlerts: { backgroundColor: "#161616", borderRadius: 14, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#222" },
  alertRow: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#161616", borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: "#222" },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { alignItems: "center", paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerIcon: { width: 60, height: 60, borderRadius: 16, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "900" },
  headerSub: { color: "#888", fontSize: 14, marginTop: 4, textAlign: "center" },
  tabRow: { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#161616", borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: "#222" },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#f97316" },
  tabTxt: { color: "#555", fontWeight: "700", fontSize: 15 },
  tabTxtActive: { color: "#fff" },
  form: { paddingHorizontal: 20, paddingBottom: 50 },
  row2: { flexDirection: "row", marginBottom: 4 },
  fieldLabel: { color: "#888", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  whiteInput: { backgroundColor: "#fff", borderRadius: 12, padding: 14, color: "#000", fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: "#ddd" },
  whiteDropdown: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#ddd", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownVal: { color: "#000", fontSize: 15 },
  dropdownPh: { color: "#aaa", fontSize: 15 },
  btnOrange: { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 17, alignItems: "center", marginTop: 8, marginBottom: 16 },
  btnOrangeTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  switchTxt: { color: "#888", textAlign: "center", fontSize: 14 },
  msg: { textAlign: "center", marginBottom: 12, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#161616", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: 30 },
  sheetHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#222" },
  sheetHdrTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
  sheetItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  sheetItemTxt: { color: "#fff", fontSize: 15 },
});