import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API = "https://zuno.ng/api";

const SERVICES = [
  { emoji: "❄️", name: "AC Technician",  count: "48 artisans" },
  { emoji: "🔌", name: "Electrician",    count: "62 artisans" },
  { emoji: "🔧", name: "Plumber",        count: "55 artisans" },
  { emoji: "🧹", name: "Cleaner",        count: "74 artisans" },
  { emoji: "🪵", name: "Carpenter",      count: "31 artisans" },
  { emoji: "🎨", name: "Painter",        count: "29 artisans" },
  { emoji: "🚿", name: "Tiler",          count: "22 artisans" },
  { emoji: "🐛", name: "Fumigation",     count: "18 artisans" },
  { emoji: "🔒", name: "Locksmith",      count: "14 artisans" },
  { emoji: "📺", name: "Electronics",    count: "38 artisans" },
  { emoji: "🌿", name: "Gardener",       count: "16 artisans" },
  { emoji: "🚗", name: "Auto Mechanic",  count: "27 artisans" },
];

const STEPS = [
  { num: "1", emoji: "📋", title: "Post your job",  desc: "Tell us what you need in seconds" },
  { num: "2", emoji: "👷", title: "Get matched",    desc: "Verified artisans near you alerted" },
  { num: "3", emoji: "✅", title: "Hire & done",    desc: "Chat, agree and get it done right" },
];

const DEMO_ARTISANS = [
  { name: "Success", skill: "AC Technician", lga: "Lekki", rating: 5.0, reviews: 2, verified: true, jobs: 5, online: true },
  { name: "Rose prosper", skill: "Cleaner", lga: "Lekki", rating: 0, verified: true, jobs: 0, online: true },
];

export default function HomeScreen() {
  const router = useRouter();
  const [artisans, setArtisans] = useState<any[]>(DEMO_ARTISANS);

  useEffect(() => {
    fetch(`${API}/artisans/top`)
      .then(r => r.json())
      .then(d => { if (d && (d.artisans || d).length > 0) setArtisans(d.artisans || d); })
      .catch(() => {});
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* TOP NAV */}
      <View style={s.topNav}>
        <Text style={s.logo}>
          Zu<Text style={s.logoStrike}>n</Text>o
        </Text>
        <View style={s.topNavBtns}>
          <TouchableOpacity style={s.ghostBtn} onPress={() => router.push("/artisan")}>
            <Text style={s.ghostBtnTxt}>Artisan Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.orangeBtn} onPress={() => router.push("/post")}>
            <Text style={s.orangeBtnTxt}>Post a Job</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* HERO with full background image */}
        <ImageBackground
          source={{ uri: "https://zuno.ng/images/hero-artisan.png" }}
          style={s.heroBg}
          imageStyle={s.heroBgImg}
        >
          <View style={s.heroOverlay}>
            <View style={s.liveBadge}>
              <View style={s.greenDot} />
              <Text style={s.liveBadgeTxt}>340+ Artisans Live in Lagos Right Now</Text>
            </View>
            <Text style={s.h1White}>Skilled{"\n"}Hands,</Text>
            <Text style={s.h1Orange}>On Demand</Text>
            <Text style={s.heroSub}>
              Post your job and get matched with verified, trusted artisans near you — AC repair, plumbing, electrical, cleaning and more.
            </Text>
          </View>
        </ImageBackground>

        {/* JOIN ARTISAN CARD — full orange */}
        <View style={s.joinCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.joinTag}>FOR ARTISANS</Text>
            <Text style={s.joinTitle}>Join as{"\n"}an Artisan</Text>
            <Text style={s.joinSub}>
              Get matched with customers in your area. Build your reputation and grow your income.
            </Text>
            <TouchableOpacity style={s.joinBtn} onPress={() => router.push("/artisan")}>
              <Text style={s.joinBtnTxt}>Join Zuno Today  →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.joinAvatarBox}>
            <Ionicons name="person" size={90} color="rgba(255,255,255,0.25)" />
          </View>
        </View>

        {/* STATS */}
        <View style={s.statsRow}>
          {[
            { num: "340+", lbl: "Live Artisans" },
            { num: "2k+",  lbl: "Jobs Done" },
            { num: "100%", lbl: "Verified" },
          ].map((st, i) => (
            <View key={i} style={s.statCell}>
              <Text style={s.statNum}>{st.num}</Text>
              <Text style={s.statLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* SERVICES */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Services</Text>
            <Text style={s.viewAll}>View all →</Text>
          </View>
          <View style={s.grid}>
            {SERVICES.map((svc, i) => (
              <TouchableOpacity key={i} style={s.svcCard} onPress={() => router.push("/post")}>
                <Text style={s.svcEmoji}>{svc.emoji}</Text>
                <Text style={s.svcName}>{svc.name}</Text>
                <Text style={s.svcCount}>{svc.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* HOW ZUNO WORKS — horizontal scroll */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>How Zuno Works</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
            {STEPS.map((step, i) => (
              <View key={i} style={s.stepCard}>
                <View style={s.stepCircle}>
                  <Text style={s.stepNum}>{step.num}</Text>
                </View>
                <Text style={s.stepEmoji}>{step.emoji}</Text>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* TOP ARTISANS */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Top Artisans</Text>
            <Text style={s.viewAll}>Browse all →</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {artisans.map((a, i) => (
              <View key={i} style={s.artCard}>
                <View style={s.artImgBox}>
                  {a.photo
                    ? <Image source={{ uri: a.photo }} style={s.artImg} />
                    : <View style={[s.artImg, s.artImgFallback]}>
                        <Ionicons name="construct" size={40} color="#f97316" />
                      </View>
                  }
                  {a.online && (
                    <View style={s.onlineBadge}>
                      <View style={s.onlineDot} />
                      <Text style={s.onlineTxt}>Online</Text>
                    </View>
                  )}
                </View>
                <View style={s.artInfo}>
                  <Text style={s.artName}>{a.name}</Text>
                  <Text style={s.artSkillLga}>{a.skill} · {a.lga}</Text>
                  <View style={s.artMeta}>
                    <Text style={s.artRating}>
                      {a.rating > 0 ? `★ ${a.rating} (${a.reviews})` : "★ New"}
                    </Text>
                    {a.verified && <Text style={s.artVerified}>  ✓ Verified</Text>}
                  </View>
                  <View style={s.artJobsBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
                    <Text style={s.artJobsTxt}> {a.jobs} jobs completed</Text>
                  </View>
                  <View style={s.artFooter}>
                    <Text style={s.artLga}>↑ {a.lga}</Text>
                    <Text style={s.viewProfile}>View Profile →</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* BOTTOM CTA */}
        <View style={s.bottomCta}>
          <Text style={s.bottomCtaTitle}>
            Ready to get{" "}
            <Text style={s.bottomCtaOrange}>something{"\n"}fixed?</Text>
          </Text>
          <Text style={s.bottomCtaSub}>
            Join thousands of Lagos residents who trust Zuno for fast, reliable home services.
          </Text>
          <TouchableOpacity style={s.btnOrangeFull} onPress={() => router.push("/post")}>
            <Text style={s.btnOrangeFullTxt}>Post a Job — It's Free</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnOutline} onPress={() => router.push("/artisan")}>
            <Text style={s.btnOutlineTxt}>Join as Artisan</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text style={s.footerBrand}>Zuno</Text>
          <Text style={s.footerSub}>
            Nigeria's fastest artisan marketplace. Skilled hands, on demand. Proudly serving Lagos.
          </Text>
          <View style={s.footerGrid}>
            {[
              ["About Zuno",     "How it Works"],
              ["Post a Job",     "Join as Artisan"],
              ["Help Center",    "WhatsApp Us"],
              ["Privacy Policy", "Terms of Use"],
            ].map(([l, r], i) => (
              <View key={i} style={s.footerRow}>
                <Text style={s.footerLink}>{l}</Text>
                <Text style={s.footerLink}>{r}</Text>
              </View>
            ))}
          </View>
          <Text style={s.footerCopy}>© 2026 Zuno.ng — Built for Lagos 🇳🇬</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },

  /* Top Nav */
  topNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: "#0a0a0a", zIndex: 10 },
  logo: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  logoStrike: { textDecorationLine: "line-through" },
  topNavBtns: { flexDirection: "row", gap: 8, alignItems: "center" },
  ghostBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#444" },
  ghostBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
  orangeBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: "#f97316" },
  orangeBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },

  /* Hero */
  heroBg: { width: "100%", minHeight: 380 },
  heroBgImg: { opacity: 0.5 },
  heroOverlay: { flex: 1, padding: 20, paddingTop: 20, paddingBottom: 36, justifyContent: "flex-end", backgroundColor: "rgba(10,10,10,0.35)" },
  liveBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(20,20,20,0.85)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 18 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e", marginRight: 7 },
  liveBadgeTxt: { color: "#ccc", fontSize: 12 },
  h1White: { fontSize: 56, fontWeight: "900", color: "#fff", lineHeight: 60, letterSpacing: -2 },
  h1Orange: { fontSize: 56, fontWeight: "900", color: "#f97316", fontStyle: "italic", lineHeight: 64, letterSpacing: -2 },
  heroSub: { color: "#bbb", fontSize: 15, lineHeight: 23, marginTop: 14 },

  /* Join card */
  joinCard: { flexDirection: "row", backgroundColor: "#f97316", margin: 16, borderRadius: 20, padding: 24, overflow: "hidden" },
  joinTag: { color: "rgba(0,0,0,0.5)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" },
  joinTitle: { color: "#fff", fontSize: 32, fontWeight: "900", lineHeight: 38, marginBottom: 10 },
  joinSub: { color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 20, marginBottom: 18 },
  joinBtn: { backgroundColor: "rgba(0,0,0,0.18)", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignSelf: "flex-start" },
  joinBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  joinAvatarBox: { justifyContent: "center", paddingLeft: 8 },

  /* Stats */
  statsRow: { flexDirection: "row", marginHorizontal: 16, backgroundColor: "#161616", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#222" },
  statCell: { flex: 1, alignItems: "center" },
  statNum: { color: "#f97316", fontSize: 26, fontWeight: "900" },
  statLbl: { color: "#888", fontSize: 12, marginTop: 3 },

  /* Section */
  section: { paddingHorizontal: 16, paddingTop: 30 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  viewAll: { color: "#f97316", fontSize: 14 },

  /* Services */
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  svcCard: { backgroundColor: "#161616", borderRadius: 14, padding: 14, width: "31%", alignItems: "center", borderWidth: 1, borderColor: "#222" },
  svcEmoji: { fontSize: 28, marginBottom: 7 },
  svcName: { color: "#fff", fontSize: 11, fontWeight: "700", textAlign: "center" },
  svcCount: { color: "#666", fontSize: 10, marginTop: 3 },

  /* Steps */
  stepCard: { backgroundColor: "#161616", borderRadius: 16, padding: 20, marginRight: 12, width: 160, borderWidth: 1, borderColor: "#222", alignItems: "center" },
  stepCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  stepNum: { color: "#fff", fontWeight: "900", fontSize: 17 },
  stepEmoji: { fontSize: 32, marginBottom: 8 },
  stepTitle: { color: "#fff", fontWeight: "800", fontSize: 14, textAlign: "center" },
  stepDesc: { color: "#888", fontSize: 11, textAlign: "center", marginTop: 4, lineHeight: 16 },

  /* Artisan cards */
  artCard: { backgroundColor: "#161616", borderRadius: 16, marginRight: 14, width: 210, borderWidth: 1, borderColor: "#222", overflow: "hidden" },
  artImgBox: { position: "relative" },
  artImg: { width: "100%", height: 170 },
  artImgFallback: { backgroundColor: "#1e1e1e", alignItems: "center", justifyContent: "center" },
  onlineBadge: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#22c55e", marginRight: 4 },
  onlineTxt: { color: "#22c55e", fontSize: 11, fontWeight: "700" },
  artInfo: { padding: 12 },
  artName: { color: "#fff", fontWeight: "800", fontSize: 15 },
  artSkillLga: { color: "#888", fontSize: 12, marginTop: 2 },
  artMeta: { flexDirection: "row", marginTop: 6 },
  artRating: { color: "#f59e0b", fontSize: 12, fontWeight: "600" },
  artVerified: { color: "#22c55e", fontSize: 12 },
  artJobsBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#0d2e1a", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", marginTop: 6 },
  artJobsTxt: { color: "#22c55e", fontSize: 11 },
  artFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  artLga: { color: "#555", fontSize: 11 },
  viewProfile: { color: "#f97316", fontSize: 12, fontWeight: "600" },

  /* Bottom CTA */
  bottomCta: { margin: 16, marginTop: 30, padding: 24, backgroundColor: "#161616", borderRadius: 20, borderWidth: 1, borderColor: "#222" },
  bottomCtaTitle: { color: "#fff", fontSize: 28, fontWeight: "900", lineHeight: 36, marginBottom: 10 },
  bottomCtaOrange: { color: "#f97316" },
  bottomCtaSub: { color: "#888", fontSize: 14, lineHeight: 22, marginBottom: 20 },
  btnOrangeFull: { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 17, alignItems: "center", marginBottom: 12 },
  btnOrangeFullTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnOutline: { borderRadius: 14, paddingVertical: 16, alignItems: "center", borderWidth: 1.5, borderColor: "#f97316" },
  btnOutlineTxt: { color: "#f97316", fontWeight: "700", fontSize: 16 },

  /* Footer */
  footer: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20, borderTopWidth: 1, borderTopColor: "#1a1a1a" },
  footerBrand: { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 10 },
  footerSub: { color: "#666", fontSize: 13, lineHeight: 20, marginBottom: 20 },
  footerGrid: { marginBottom: 16 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  footerLink: { color: "#888", fontSize: 14 },
  footerCopy: { color: "#444", fontSize: 12 },
});