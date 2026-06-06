import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../services/context";

const API    = "https://zuno.ng/api";
const SCREEN = Dimensions.get("window");

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

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Ionicons key={i} name={i <= Math.round(rating) ? "star" : "star-outline"} size={13} color="#f59e0b" />
      ))}
    </View>
  );
}

// ─── Artisan Profile Modal ────────────────────────────────────────────────────
function ArtisanProfileModal({ artisanId, visible, onClose }: {
  artisanId: number | null; visible: boolean; onClose: () => void;
}) {
  const router = useRouter();
  const [artisan,  setArtisan]  = useState<any>(null);
  const [reviews,  setReviews]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN.height)).current;

  useEffect(() => {
    if (visible) {
      setArtisan(null); setReviews([]);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
      if (artisanId) loadProfile(artisanId);
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN.height, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, artisanId]);

  const loadProfile = async (id: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/artisan/public/${id}`);
      const data = await res.json();
      if (data.success) { setArtisan(data.artisan); setReviews(data.reviews || []); }
    } catch {}
    setLoading(false);
  };

  const workPhotos: string[] = (() => {
    if (!artisan?.work_photos) return [];
    try {
      const parsed = JSON.parse(artisan.work_photos);
      return Array.isArray(parsed)
        ? parsed.map((ph: string) => ph.startsWith("http") ? ph : `https://zuno.ng${ph}`)
        : [];
    } catch { return []; }
  })();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={m.overlay}>
        <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[m.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={m.dragHandle} />
          <TouchableOpacity style={m.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#888" />
          </TouchableOpacity>
          {loading ? (
            <View style={m.loadingBox}>
              <ActivityIndicator color="#f97316" size="large" />
              <Text style={m.loadingTxt}>Loading profile...</Text>
            </View>
          ) : !artisan ? (
            <View style={m.loadingBox}>
              <Text style={m.loadingTxt}>Could not load profile.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
              {artisan.hero_image
                ? <Image source={{ uri: artisan.hero_image }} style={m.heroImg} resizeMode="cover" />
                : <View style={m.heroFallback}><Ionicons name="construct" size={60} color="#f97316" /></View>
              }
              <View style={m.avatarRow}>
                <View style={m.avatarWrap}>
                  {artisan.profile_photo
                    ? <Image source={{ uri: artisan.profile_photo }} style={m.avatar} resizeMode="cover" />
                    : <View style={[m.avatar, m.avatarFallback]}><Ionicons name="person" size={36} color="#fff" /></View>
                  }
                  {artisan.is_available === 1 && <View style={m.onlineDot} />}
                </View>
                {artisan.subscription_plan && artisan.subscription_plan !== "basic" && (
                  <View style={m.planBadge}>
                    <Text style={m.planBadgeTxt}>
                      {artisan.subscription_plan === "premium" ? "🌟 Premium" : "⭐ Pro"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={m.body}>
                <View style={m.nameRow}>
                  <Text style={m.name}>{artisan.full_name}</Text>
                  {artisan.is_verified === 1 && (
                    <View style={m.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
                      <Text style={m.verifiedTxt}> Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={m.category}>{artisan.category}{artisan.subcategory ? ` · ${artisan.subcategory}` : ""}</Text>
                <Text style={m.location}>📍 {artisan.lga}{artisan.address ? `, ${artisan.address}` : ""}</Text>
                <View style={[m.statusBadge, { backgroundColor: artisan.is_available ? "rgba(34,197,94,0.12)" : "rgba(100,100,100,0.1)" }]}>
                  <View style={[m.statusDot, { backgroundColor: artisan.is_available ? "#22c55e" : "#666" }]} />
                  <Text style={[m.statusTxt, { color: artisan.is_available ? "#22c55e" : "#666" }]}>
                    {artisan.is_available ? "Online — Available now" : "Offline — Not available"}
                  </Text>
                </View>
                <View style={m.statsRow}>
                  {[
                    { num: artisan.jobs_completed ?? 0, lbl: "Jobs Done", color: "#f97316" },
                    { num: (parseFloat(artisan.rating) || 0).toFixed(1) + "★", lbl: "Rating", color: "#f59e0b" },
                    { num: artisan.total_reviews ?? 0, lbl: "Reviews", color: "#60a5fa" },
                    { num: artisan.years_experience ?? 0, lbl: "Yrs Exp", color: "#a78bfa" },
                  ].map((st, i) => (
                    <View key={i} style={m.statBox}>
                      <Text style={[m.statNum, { color: st.color }]}>{st.num}</Text>
                      <Text style={m.statLbl}>{st.lbl}</Text>
                    </View>
                  ))}
                </View>
                {!!artisan.bio && (
                  <>
                    <Text style={m.sectionTitle}>About</Text>
                    <Text style={m.bio}>{artisan.bio}</Text>
                  </>
                )}
                {workPhotos.length > 0 && (
                  <>
                    <Text style={m.sectionTitle}>Work Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                      {workPhotos.map((uri, i) => (
                        <TouchableOpacity key={i} onPress={() => setLightbox(uri)} activeOpacity={0.85}>
                          <Image source={{ uri }} style={m.workPhoto} resizeMode="cover" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
                {reviews.length > 0 && (
                  <>
                    <Text style={m.sectionTitle}>Reviews ({reviews.length})</Text>
                    {reviews.map((r, i) => (
                      <View key={i} style={m.reviewCard}>
                        <View style={m.reviewTop}>
                          <View style={m.reviewAvatar}>
                            <Text style={m.reviewAvatarTxt}>{(r.client_name || "C")[0].toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={m.reviewName}>{r.client_name || "Client"}</Text>
                            <Stars rating={r.rating} />
                          </View>
                          <Text style={m.reviewDate}>
                            {r.created_at ? new Date(r.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }) : ""}
                          </Text>
                        </View>
                        {!!r.comment && <Text style={m.reviewComment}>{r.comment}</Text>}
                      </View>
                    ))}
                  </>
                )}
                <TouchableOpacity
                  style={m.hireBtn}
                  onPress={() => { onClose(); router.push("/post"); }}
                  activeOpacity={0.85}>
                  <Ionicons name="construct" size={18} color="#fff" />
                  <Text style={m.hireBtnTxt}> Hire {artisan.full_name?.split(" ")[0]} Now</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </Animated.View>
        {lightbox && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
            <View style={m.lightbox}>
              <TouchableOpacity style={m.lightboxClose} onPress={() => setLightbox(null)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Image source={{ uri: lightbox }} style={m.lightboxImg} resizeMode="contain" />
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router       = useRouter();
  const insets       = useSafeAreaInsets();
  const { artisanToken, isLoadingAuth } = useAuth();
  const [artisans,   setArtisans]   = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Redirect artisan to their dashboard
  useEffect(() => {
    if (!isLoadingAuth && artisanToken) {
      router.replace("/artisan");
    }
  }, [isLoadingAuth, artisanToken]);

  useEffect(() => {
    fetch(`${API}/artisan/list?featured=1&limit=10`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d.artisans) ? d.artisans : [];
        if (list.length > 0) setArtisans(list);
      })
      .catch(() => {});
  }, []);

  if (isLoadingAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#f97316" size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <ArtisanProfileModal
        artisanId={selectedId}
        visible={selectedId !== null}
        onClose={() => setSelectedId(null)}
      />

      {/* ─── App Header — clean, not website-style ─── */}
      <View style={[s.appHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={s.appHeaderBrand}>Zuno</Text>
        <View style={s.appHeaderRight}>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.livePillTxt}>340+ Live</Text>
          </View>
          <TouchableOpacity
            style={s.postBtn}
            onPress={() => router.push("/post")}
            activeOpacity={0.85}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={s.postBtnTxt}>Post Job</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}>

        {/* HERO */}
        <ImageBackground
          source={{ uri: "https://zuno.ng/images/hero-artisan.png" }}
          style={s.heroBg}
          imageStyle={s.heroBgImg}>
          <View style={s.heroOverlay}>
            <Text style={s.h1White}>Skilled{"\n"}Hands,</Text>
            <Text style={s.h1Orange}>On Demand</Text>
            <Text style={s.heroSub}>
              Get matched with verified artisans near you — AC repair, plumbing, electrical, cleaning and more.
            </Text>
            <TouchableOpacity
              style={s.heroBtn}
              onPress={() => router.push("/post")}
              activeOpacity={0.85}>
              <Text style={s.heroBtnTxt}>Post a Job — It's Free →</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* STATS */}
        <View style={s.statsRow}>
          {[
            { num: "340+", lbl: "Live Artisans", icon: "people" },
            { num: "2k+",  lbl: "Jobs Done",     icon: "checkmark-circle" },
            { num: "100%", lbl: "Verified",       icon: "shield-checkmark" },
          ].map((st, i) => (
            <View key={i} style={s.statCell}>
              <Ionicons name={st.icon as any} size={20} color="#f97316" style={{ marginBottom: 6 }} />
              <Text style={s.statNum}>{st.num}</Text>
              <Text style={s.statLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* SERVICES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>What do you need?</Text>
          <View style={s.grid}>
            {SERVICES.map((svc, i) => (
              <TouchableOpacity key={i} style={s.svcCard} onPress={() => router.push("/post")} activeOpacity={0.8}>
                <Text style={s.svcEmoji}>{svc.emoji}</Text>
                <Text style={s.svcName}>{svc.name}</Text>
                <Text style={s.svcCount}>{svc.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* HOW ZUNO WORKS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>How it Works</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
            {STEPS.map((step, i) => (
              <View key={i} style={s.stepCard}>
                <View style={s.stepCircle}><Text style={s.stepNum}>{step.num}</Text></View>
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
          {artisans.length === 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {[1,2,3].map(i => (
                <View key={i} style={[s.artCard, { opacity: 0.4 }]}>
                  <View style={[s.artImg, { backgroundColor: "#222" }]} />
                  <View style={s.artInfo}>
                    <View style={{ height: 14, backgroundColor: "#222", borderRadius: 6, marginBottom: 8, width: "70%" }} />
                    <View style={{ height: 10, backgroundColor: "#1a1a1a", borderRadius: 6, width: "50%" }} />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {artisans.map((a, i) => (
                <TouchableOpacity
                  key={a.id ?? i}
                  style={s.artCard}
                  onPress={() => setSelectedId(a.id)}
                  activeOpacity={0.85}>
                  <View style={s.artImgBox}>
                    {a.profile_photo
                      ? <Image source={{ uri: a.profile_photo }} style={s.artImg} resizeMode="cover" />
                      : <View style={[s.artImg, s.artImgFallback]}><Ionicons name="construct" size={40} color="#f97316" /></View>
                    }
                    {a.is_available === 1 && (
                      <View style={s.onlineBadge}>
                        <View style={s.onlineDot} />
                        <Text style={s.onlineTxt}>Online</Text>
                      </View>
                    )}
                    {a.subscription_plan && a.subscription_plan !== "basic" && (
                      <View style={s.planBadge}>
                        <Text style={s.planBadgeTxt}>{a.subscription_plan === "premium" ? "⭐ Premium" : "✓ Pro"}</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.artInfo}>
                    <Text style={s.artName}>{a.full_name}</Text>
                    <Text style={s.artSkillLga}>{a.category} · {a.lga}</Text>
                    <View style={s.artMeta}>
                      <Text style={s.artRating}>{a.rating > 0 ? `★ ${a.rating} (${a.total_reviews})` : "★ New"}</Text>
                      {a.is_verified === 1 && <Text style={s.artVerified}>  ✓ Verified</Text>}
                    </View>
                    <View style={s.artJobsBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
                      <Text style={s.artJobsTxt}> {a.jobs_completed ?? 0} jobs completed</Text>
                    </View>
                    <View style={s.artFooter}>
                      <Text style={s.artLga}>📍 {a.lga}</Text>
                      <Text style={s.viewProfile}>View Profile →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* JOIN ARTISAN CARD */}
        <View style={[s.section, { paddingBottom: 10 }]}>
          <View style={s.joinCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.joinTag}>FOR ARTISANS</Text>
              <Text style={s.joinTitle}>Join as an Artisan</Text>
              <Text style={s.joinSub}>Get matched with customers in your area. Build your reputation and grow your income.</Text>
              <TouchableOpacity style={s.joinBtn} onPress={() => router.push("/artisan")} activeOpacity={0.85}>
                <Text style={s.joinBtnTxt}>Join Zuno Today →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.joinAvatarBox}>
              <Ionicons name="construct" size={70} color="rgba(255,255,255,0.2)" />
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Profile Modal Styles ─────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:        { flex: 1, justifyContent: "flex-end" },
  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet:          { backgroundColor: "#0f0f0f", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN.height * 0.93, overflow: "hidden" },
  dragHandle:     { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginTop: 10 },
  closeBtn:       { position: "absolute", top: 16, right: 16, zIndex: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  loadingBox:     { alignItems: "center", paddingVertical: 80, gap: 12 },
  loadingTxt:     { color: "#888", fontSize: 14 },
  heroImg:        { width: "100%", height: 200 },
  heroFallback:   { width: "100%", height: 180, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  avatarRow:      { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, marginTop: -40, marginBottom: 12 },
  avatarWrap:     { position: "relative" },
  avatar:         { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#0f0f0f" },
  avatarFallback: { backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
  onlineDot:      { position: "absolute", bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#0f0f0f" },
  planBadge:      { backgroundColor: "rgba(249,115,22,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#f97316" },
  planBadgeTxt:   { color: "#f97316", fontWeight: "800", fontSize: 12 },
  body:           { paddingHorizontal: 20 },
  nameRow:        { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  name:           { color: "#fff", fontSize: 22, fontWeight: "900" },
  verifiedBadge:  { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(34,197,94,0.12)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedTxt:    { color: "#22c55e", fontSize: 12, fontWeight: "700" },
  category:       { color: "#f97316", fontSize: 14, fontWeight: "700", marginTop: 4 },
  location:       { color: "#888", fontSize: 13, marginTop: 2, marginBottom: 10 },
  statusBadge:    { flexDirection: "row", alignItems: "center", borderRadius: 10, padding: 10, marginBottom: 16 },
  statusDot:      { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTxt:      { fontSize: 13, fontWeight: "600" },
  statsRow:       { flexDirection: "row", gap: 8, marginBottom: 20 },
  statBox:        { flex: 1, backgroundColor: "#161616", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#222" },
  statNum:        { fontSize: 16, fontWeight: "900" },
  statLbl:        { color: "#888", fontSize: 9, marginTop: 3, textAlign: "center" },
  sectionTitle:   { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 10 },
  bio:            { color: "#aaa", fontSize: 14, lineHeight: 22, marginBottom: 20 },
  workPhoto:      { width: 140, height: 110, borderRadius: 12, marginRight: 10, backgroundColor: "#1a1a1a" },
  reviewCard:     { backgroundColor: "#161616", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#222" },
  reviewTop:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  reviewAvatar:   { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
  reviewAvatarTxt:{ color: "#fff", fontWeight: "900", fontSize: 14 },
  reviewName:     { color: "#fff", fontWeight: "700", fontSize: 13, marginBottom: 3 },
  reviewDate:     { color: "#555", fontSize: 11 },
  reviewComment:  { color: "#aaa", fontSize: 13, lineHeight: 20 },
  hireBtn:        { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24 },
  hireBtnTxt:     { color: "#fff", fontWeight: "900", fontSize: 16 },
  lightbox:       { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  lightboxClose:  { position: "absolute", top: 50, right: 20, zIndex: 10 },
  lightboxImg:    { width: SCREEN.width, height: SCREEN.height * 0.7 },
});

// ─── Home Screen Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#0a0a0a" },

  // ─── Clean app header — not website style ─────────────────────────────────
  appHeader:      {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#0a0a0a",
  },
  appHeaderBrand: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  appHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  livePill:       {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
  },
  liveDot:        { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#22c55e", marginRight: 5 },
  livePillTxt:    { color: "#22c55e", fontSize: 12, fontWeight: "700" },
  postBtn:        {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f97316",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  postBtnTxt:     { color: "#fff", fontSize: 13, fontWeight: "800" },

  // ─── Hero ─────────────────────────────────────────────────────────────────
  heroBg:         { width: "100%", minHeight: 340 },
  heroBgImg:      { opacity: 0.45 },
  heroOverlay:    {
    flex: 1,
    padding: 20,
    paddingBottom: 30,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10,10,10,0.4)",
  },
  h1White:        { fontSize: 52, fontWeight: "900", color: "#fff", lineHeight: 56, letterSpacing: -2 },
  h1Orange:       { fontSize: 52, fontWeight: "900", color: "#f97316", fontStyle: "italic", lineHeight: 60, letterSpacing: -2 },
  heroSub:        { color: "#bbb", fontSize: 14, lineHeight: 22, marginTop: 12, marginBottom: 20 },
  heroBtn:        {
    backgroundColor: "#f97316",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  heroBtnTxt:     { color: "#fff", fontWeight: "800", fontSize: 15 },

  // ─── Stats ────────────────────────────────────────────────────────────────
  statsRow:       {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  statCell:       { flex: 1, alignItems: "center" },
  statNum:        { color: "#fff", fontSize: 20, fontWeight: "900" },
  statLbl:        { color: "#888", fontSize: 11, marginTop: 2 },

  // ─── Section ──────────────────────────────────────────────────────────────
  section:        { paddingHorizontal: 16, paddingTop: 26 },
  sectionRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sectionTitle:   { color: "#fff", fontSize: 19, fontWeight: "900", marginBottom: 14 },
  viewAll:        { color: "#f97316", fontSize: 13 },

  // ─── Services grid ────────────────────────────────────────────────────────
  grid:           { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  svcCard:        {
    backgroundColor: "#161616",
    borderRadius: 14,
    padding: 14,
    width: "31%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  svcEmoji:       { fontSize: 26, marginBottom: 6 },
  svcName:        { color: "#fff", fontSize: 11, fontWeight: "700", textAlign: "center" },
  svcCount:       { color: "#666", fontSize: 10, marginTop: 3 },

  // ─── How it works ─────────────────────────────────────────────────────────
  stepCard:       {
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 18,
    marginRight: 12,
    width: 155,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
  },
  stepCircle:     { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  stepNum:        { color: "#fff", fontWeight: "900", fontSize: 16 },
  stepEmoji:      { fontSize: 30, marginBottom: 8 },
  stepTitle:      { color: "#fff", fontWeight: "800", fontSize: 13, textAlign: "center" },
  stepDesc:       { color: "#888", fontSize: 11, textAlign: "center", marginTop: 4, lineHeight: 16 },

  // ─── Artisan cards ────────────────────────────────────────────────────────
  artCard:        { backgroundColor: "#161616", borderRadius: 16, marginRight: 14, width: 210, borderWidth: 1, borderColor: "#222", overflow: "hidden" },
  artImgBox:      { position: "relative" },
  artImg:         { width: "100%", height: 170 },
  artImgFallback: { backgroundColor: "#1e1e1e", alignItems: "center", justifyContent: "center" },
  onlineBadge:    { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  onlineDot:      { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#22c55e", marginRight: 4 },
  onlineTxt:      { color: "#22c55e", fontSize: 11, fontWeight: "700" },
  planBadge:      { position: "absolute", top: 8, left: 8, backgroundColor: "rgba(249,115,22,0.9)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  planBadgeTxt:   { color: "#fff", fontSize: 10, fontWeight: "800" },
  artInfo:        { padding: 12 },
  artName:        { color: "#fff", fontWeight: "800", fontSize: 15 },
  artSkillLga:    { color: "#888", fontSize: 12, marginTop: 2 },
  artMeta:        { flexDirection: "row", marginTop: 6 },
  artRating:      { color: "#f59e0b", fontSize: 12, fontWeight: "600" },
  artVerified:    { color: "#22c55e", fontSize: 12 },
  artJobsBadge:   { flexDirection: "row", alignItems: "center", backgroundColor: "#0d2e1a", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", marginTop: 6 },
  artJobsTxt:     { color: "#22c55e", fontSize: 11 },
  artFooter:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  artLga:         { color: "#555", fontSize: 11 },
  viewProfile:    { color: "#f97316", fontSize: 12, fontWeight: "600" },

  // ─── Join artisan card ────────────────────────────────────────────────────
  joinCard: {
    flexDirection: "row",
    backgroundColor: "#f97316",
    borderRadius: 20,
    padding: 22,
    overflow: "hidden",
  },
  joinTag:        { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 6 },
  joinTitle:      { color: "#fff", fontSize: 24, fontWeight: "900", lineHeight: 30, marginBottom: 8 },
  joinSub:        { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 20, marginBottom: 16 },
  joinBtn:        { backgroundColor: "rgba(0,0,0,0.28)", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignSelf: "flex-start" },
  joinBtnTxt:     { color: "#fff", fontWeight: "700", fontSize: 13 },
  joinAvatarBox:  { justifyContent: "center", paddingLeft: 8 },
});