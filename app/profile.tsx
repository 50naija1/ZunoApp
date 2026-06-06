import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
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
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../services/context";

const API      = "https://zuno.ng/api";
const BASE_URL = "https://zuno.ng";
const ORANGE   = "#FF5C1A";
const GREEN    = "#00C853";
const BLACK    = "#0a0a0a";
const CARD     = "#141414";
const CARD2    = "#1c1c1c";
const WHITE    = "#f8f5f0";
const MUTED    = "rgba(248,245,240,0.45)";
const BORDER   = "rgba(255,255,255,0.08)";
const MAX_WORK = 10;
const { width: SW, height: SH } = Dimensions.get("window");
const THUMB = (SW - 60) / 3;

const LGAS = [
  "Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa",
  "Badagry","Epe","Eti Osa","Ibeju-Lekki","Ifako-Ijaiye",
  "Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland",
  "Lekki","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere","Victoria Island",
];

const CATEGORIES = [
  "AC Technician","Plumber","Electrician","Carpenter","Painter",
  "Welder","Tiler","Generator Technician","CCTV Installer",
  "Satellite Installer","Home Cleaner","Fumigator","Laundry",
  "Fashion Designer","Barber","Make-up Artist","Photographer",
  "Graphic Designer","Web Developer","Other",
];

const toUrl = (p?: string | null) => {
  if (!p) return "";
  return p.startsWith("http") ? p : `${BASE_URL}/${p.replace(/^\/+/, "")}`;
};

const toRelPath = (url: string) =>
  url.startsWith(BASE_URL) ? url.replace(BASE_URL, "") : url;

const fetchWithTimeout = async (url: string, options: any, ms = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
};

const starsStr = (n: number) =>
  "★".repeat(Math.min(5, n)) + "☆".repeat(5 - Math.min(5, n));

const planBadge = (plan: string) => {
  if (plan === "pro" || plan === "premium")
    return { label: "Premium", color: ORANGE, bg: "#2a1500", border: ORANGE };
  if (plan === "standard")
    return { label: "Standard", color: GREEN, bg: "rgba(0,200,83,0.1)", border: "rgba(0,200,83,0.3)" };
  return { label: "Basic", color: MUTED, bg: "rgba(255,255,255,0.05)", border: BORDER };
};

type Review       = { client_name: string; rating: number; comment: string; created_at: string };
type PendingPhoto = { uri: string; name: string; type: string };

function PickerRow({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={ps.fieldWrap}>
      <Text style={ps.fieldLabel}>{label}</Text>
      <TouchableOpacity style={ps.pickerBtn} onPress={() => setOpen(true)}>
        <Text style={ps.pickerBtnTxt}>{value || `Select ${label}`}</Text>
        <Text style={{ color: MUTED, fontSize: 12 }}>▼</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <View style={ps.pickerOverlay}>
          <View style={ps.pickerSheet}>
            <Text style={ps.pickerTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: SH * 0.5 }}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[ps.pickerOpt, value === opt && ps.pickerOptActive]}
                  onPress={() => { onChange(opt); setOpen(false); }}>
                  <Text style={[ps.pickerOptTxt, value === opt && { color: ORANGE, fontWeight: "700" }]}>{opt}</Text>
                  {value === opt && <Text style={{ color: ORANGE }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={ps.pickerCancel} onPress={() => setOpen(false)}>
              <Text style={{ color: MUTED, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function ProfileScreen() {
  const { artisanData, artisanToken, logoutArtisan, refreshArtisanData } = useAuth();

  const [editOpen,            setEditOpen]            = useState(false);
  const [saving,              setSaving]              = useState(false);
  const [uploadMsg,           setUploadMsg]           = useState<{ text: string; ok: boolean } | null>(null);
  const [reviews,             setReviews]             = useState<Review[]>([]);
  const [lbOpen,              setLbOpen]              = useState(false);
  const [lbIndex,             setLbIndex]             = useState(0);
  const [lbPhotos,            setLbPhotos]            = useState<string[]>([]);
  const [pending,             setPending]             = useState<PendingPhoto[]>([]);
  const [removedPhotos,       setRemovedPhotos]       = useState<string[]>([]);
  const [newProfilePhoto,     setNewProfilePhoto]     = useState<PendingPhoto | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [newHeroPhoto,        setNewHeroPhoto]        = useState<PendingPhoto | null>(null);
  const [heroPreview,         setHeroPreview]         = useState<string>("");

  const [form, setForm] = useState({
    full_name: "", phone: "", category: "", lga: "",
    bio: "", password: "", years_experience: "",
  });

  const syncForm = (d: any) => {
    setForm({
      full_name:        d?.full_name        || "",
      phone:            d?.phone            || "",
      category:         d?.category         || "",
      lga:              d?.lga              || "",
      bio:              d?.bio              || "",
      password:         "",
      years_experience: String(d?.years_experience || ""),
    });
    setProfilePhotoPreview(toUrl(d?.profile_photo) || "");
    setNewProfilePhoto(null);
    setHeroPreview(toUrl(d?.hero_image) || "");
    setNewHeroPhoto(null);
  };

  useEffect(() => { syncForm(artisanData); }, [artisanData]);

  // ── CHANGED: useFocusEffect replaces useEffect so stats refresh
  //    every time the artisan navigates to this tab ──────────────
  useFocusEffect(
    useCallback(() => {
      refreshArtisanData().catch(() => {});
      loadReviews().catch(() => {});
    }, [artisanToken])
  );

  const loadReviews = async () => {
    if (!artisanToken) return;
    try {
      const res  = await fetchWithTimeout(
        `${API}/artisan/reviews`,
        { headers: { Authorization: `Bearer ${artisanToken}` } },
        12000
      );
      const data = await res.json();
      if (data.success && data.reviews) setReviews(data.reviews);
    } catch {}
  };

  const workPhotos: string[] = (() => {
    try {
      const a = artisanData || {};
      if (!a.work_photos) return [];
      const list: string[] =
        typeof a.work_photos === "string" ? JSON.parse(a.work_photos) : a.work_photos;
      return list.map(toUrl).filter(Boolean);
    } catch { return []; }
  })();

  const keptPhotos = workPhotos.filter((u) => !removedPhotos.includes(u));
  const allPhotos  = [...keptPhotos, ...pending.map((p) => p.uri)];

  const pickProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Allow photo access."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions?.Images ?? "Images",
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      setProfilePhotoPreview(asset.uri);
      setNewProfilePhoto({ uri: asset.uri, name: asset.fileName || `profile_${Date.now()}.jpg`, type: asset.mimeType || "image/jpeg" });
    } catch {}
  };

  const pickHeroPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Allow photo access."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions?.Images ?? "Images",
        allowsEditing: true, aspect: [16, 9], quality: 0.85,
      });
      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      setHeroPreview(asset.uri);
      setNewHeroPhoto({ uri: asset.uri, name: asset.fileName || `hero_${Date.now()}.jpg`, type: asset.mimeType || "image/jpeg" });
    } catch {}
  };

  const pickPhotos = async () => {
    const used = keptPhotos.length + pending.length;
    if (used >= MAX_WORK) { Alert.alert("Limit reached", `Max ${MAX_WORK} photos.`); return; }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Allow photo access."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions?.Images ?? "Images",
        allowsMultipleSelection: true, quality: 0.8, selectionLimit: MAX_WORK - used,
      });
      if (result.canceled || !result.assets.length) return;
      setPending((prev) => [...prev, ...result.assets.map((a) => ({
        uri: a.uri, name: a.fileName || `photo_${Date.now()}.jpg`, type: a.mimeType || "image/jpeg",
      }))]);
    } catch {}
  };

  const saveProfile = async () => {
    if (!form.full_name.trim()) { setUploadMsg({ text: "Full name is required.", ok: false }); return; }
    setSaving(true); setUploadMsg(null);
    try {
      const fd = new FormData();
      fd.append("full_name",        form.full_name.trim());
      fd.append("category",         form.category);
      fd.append("lga",              form.lga);
      fd.append("bio",              form.bio);
      fd.append("years_experience", form.years_experience);
      if (form.phone && form.phone.trim() !== "") fd.append("phone", form.phone.trim());
      if (form.password && form.password.length >= 6) fd.append("password", form.password);

      if (newProfilePhoto) {
        fd.append("profile_photo", {
          uri:  Platform.OS === "android" ? newProfilePhoto.uri : newProfilePhoto.uri.replace("file://", ""),
          name: newProfilePhoto.name, type: newProfilePhoto.type,
        } as any);
      }

      if (newHeroPhoto) {
        fd.append("hero_image", {
          uri:  Platform.OS === "android" ? newHeroPhoto.uri : newHeroPhoto.uri.replace("file://", ""),
          name: newHeroPhoto.name, type: newHeroPhoto.type,
        } as any);
      }

      const profileRes = await fetchWithTimeout(
        `${API}/artisan/profile`,
        { method: "PUT", headers: { Authorization: `Bearer ${artisanToken}` }, body: fd },
        18000
      );
      const profileRaw = await profileRes.text();
      let profileData: any = {};
      try { profileData = JSON.parse(profileRaw); } catch {}

      if (!profileRes.ok) {
        setUploadMsg({ text: profileData.message || `Profile error ${profileRes.status}`, ok: false });
        setSaving(false); return;
      }

      const hasPhotoChanges = pending.length > 0 || removedPhotos.length > 0;
      if (hasPhotoChanges) {
        const photoFd = new FormData();
        const existingRelPaths = keptPhotos.map(toRelPath);
        photoFd.append("existing_photos", JSON.stringify(existingRelPaths));
        pending.forEach((p) => photoFd.append("work_photos", {
          uri:  Platform.OS === "android" ? p.uri : p.uri.replace("file://", ""),
          name: p.name || `photo_${Date.now()}.jpg`, type: p.type || "image/jpeg",
        } as any));
        try {
          await fetchWithTimeout(
            `${API}/artisan/work-photos`,
            { method: "POST", headers: { Authorization: `Bearer ${artisanToken}` }, body: photoFd },
            60000
          );
        } catch {}
      }

      await refreshArtisanData().catch(() => {});
      setUploadMsg({ text: "✅ Profile updated successfully!", ok: true });
      setPending([]); setRemovedPhotos([]); setNewProfilePhoto(null); setNewHeroPhoto(null);
      setEditOpen(false);
    } catch (e: any) {
      setUploadMsg({ text: e?.name === "AbortError" ? "Request timed out." : "Network error: " + e.message, ok: false });
    }
    setSaving(false);
  };

  const openEdit = () => {
    syncForm(artisanData); setPending([]); setRemovedPhotos([]);
    setUploadMsg(null); setEditOpen(true);
  };

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) logoutArtisan(); return;
    }
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logoutArtisan },
    ]);
  };

  const a       = artisanData || {};
  const initial = (a.full_name || "A")[0].toUpperCase();
  const plan    = a.subscription_plan || "basic";
  const badge   = planBadge(plan);
  const openLb  = (photos: string[], i: number) => { setLbPhotos(photos); setLbIndex(i); setLbOpen(true); };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={ORANGE} />

      <View style={s.topBar}>
        <Text style={s.logo}>Zuno</Text>
        <View style={s.topRight}>
          <TouchableOpacity style={s.bellBtn}><Text style={{ fontSize: 18 }}>🔔</Text></TouchableOpacity>
          <View style={s.topAvatar}><Text style={s.topAvatarTxt}>{initial}</Text></View>
        </View>
      </View>

      <View style={s.pageTitleWrap}>
        <Text style={s.pageTag}>MY ACCOUNT</Text>
        <Text style={s.pageTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        <View style={s.profileCard}>
          <View style={s.profileCardInner}>
            <View style={s.smallAvatarWrap}>
              {toUrl(a.profile_photo)
                ? <Image source={{ uri: toUrl(a.profile_photo) }} style={s.smallAvatar} />
                : <Text style={s.smallAvatarTxt}>{initial}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardName}>{a.full_name || "Artisan"}</Text>
              <Text style={s.cardRole}>{a.category || "—"} · {a.lga || "Lagos"}</Text>
              <View style={s.badgeRow}>
                {!!a.is_verified && (
                  <View style={[s.badge, { backgroundColor: "rgba(0,200,83,0.1)", borderColor: "rgba(0,200,83,0.3)" }]}>
                    <Text style={[s.badgeTxt, { color: GREEN }]}>✓ Verified</Text>
                  </View>
                )}
                {plan !== "basic" && (
                  <View style={[s.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[s.badgeTxt, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={s.statsRow}>
            <View style={s.statCell}>
              <Text style={[s.statNum, { color: ORANGE }]}>{a.jobs_completed || 0}</Text>
              <Text style={s.statLbl}>Jobs Done</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCell}>
              <Text style={[s.statNum, { color: "#FFD700" }]}>{parseFloat(a.rating || "0").toFixed(1)}★</Text>
              <Text style={s.statLbl}>Rating</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCell}>
              <Text style={s.statNum}>{a.total_reviews || 0}</Text>
              <Text style={s.statLbl}>Reviews</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.editBtn} onPress={openEdit}>
          <Text style={s.editBtnTxt}>✏️  Edit Profile</Text>
        </TouchableOpacity>

        <View style={s.detailsCard}>
          <Text style={s.detailsTitle}>Account Details</Text>
          {[
            { label: "Email",      val: a.email },
            { label: "Phone",      val: a.phone },
            { label: "Category",   val: a.category },
            { label: "LGA",        val: a.lga },
            { label: "Experience", val: a.years_experience ? `${a.years_experience} years` : null },
          ].map((row, i) => (
            <View key={i} style={[s.detailRow, i === 0 && { borderTopWidth: 0 }]}>
              <Text style={s.detailLabel}>{row.label}</Text>
              <Text style={s.detailValue}>{row.val || "—"}</Text>
            </View>
          ))}
        </View>

        {!!a.bio && (
          <View style={s.bioCard}>
            <Text style={s.bioTitle}>About</Text>
            <Text style={s.bioTxt}>{a.bio}</Text>
          </View>
        )}

        {workPhotos.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Past Work ({workPhotos.length})</Text>
            <View style={s.photoGrid}>
              {workPhotos.map((uri, i) => (
                <TouchableOpacity key={i} style={s.thumb} onPress={() => openLb(workPhotos, i)}>
                  <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <View style={s.emptyBox}><Text style={{ color: MUTED, fontSize: 13 }}>No reviews yet.</Text></View>
          ) : reviews.map((r, i) => (
            <View key={i} style={s.reviewCard}>
              <View style={s.reviewTop}>
                <Text style={s.reviewerName}>{r.client_name || "Client"}</Text>
                <Text style={s.reviewStars}>{starsStr(r.rating)}</Text>
              </View>
              <Text style={s.reviewTxt}>{r.comment || "Great service!"}</Text>
              <Text style={s.reviewDate}>
                {new Date(r.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout}>
          <Text style={s.logoutTxt}>🚪  Logout</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Edit Modal — unchanged */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={em.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%", maxHeight: SH * 0.93 }}>
            <View style={em.sheet}>
              <View style={em.handle} />
              <View style={em.header}>
                <Text style={em.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditOpen(false)}>
                  <Text style={{ color: MUTED, fontSize: 22 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                <View style={ps.heroWrap}>
                  <Text style={ps.fieldLabel}>BANNER / HERO IMAGE</Text>
                  <TouchableOpacity style={ps.heroBtn} onPress={pickHeroPhoto} activeOpacity={0.85}>
                    {heroPreview
                      ? <Image source={{ uri: heroPreview }} style={ps.heroImg} resizeMode="cover" />
                      : <View style={ps.heroPlaceholder}>
                          <Text style={{ fontSize: 32 }}>🖼️</Text>
                          <Text style={ps.heroHint}>Tap to add banner photo</Text>
                          <Text style={[ps.heroHint, { fontSize: 10, marginTop: 2 }]}>Recommended: 16:9 landscape</Text>
                        </View>
                    }
                    <View style={ps.heroCameraOverlay}>
                      <Text style={{ fontSize: 14 }}>📷</Text>
                    </View>
                  </TouchableOpacity>
                  {newHeroPhoto && <Text style={{ color: ORANGE, fontSize: 12, marginTop: 4 }}>✓ New banner selected</Text>}
                </View>
                <View style={ps.profilePhotoWrap}>
                  <TouchableOpacity style={ps.profilePhotoBtn} onPress={pickProfilePhoto} activeOpacity={0.8}>
                    {profilePhotoPreview
                      ? <Image source={{ uri: profilePhotoPreview }} style={ps.profilePhotoImg} />
                      : <View style={ps.profilePhotoPlaceholder}><Text style={ps.profilePhotoInitial}>{initial}</Text></View>
                    }
                    <View style={ps.cameraOverlay}><Text style={{ fontSize: 14 }}>📷</Text></View>
                  </TouchableOpacity>
                  <Text style={ps.profilePhotoHint}>Tap to change profile photo</Text>
                  {newProfilePhoto && <Text style={[ps.profilePhotoHint, { color: ORANGE, marginTop: 2 }]}>✓ New photo selected</Text>}
                </View>
                <PickerRow label="CATEGORY" value={form.category} options={CATEGORIES} onChange={(v) => setForm((p) => ({ ...p, category: v }))} />
                <PickerRow label="LGA" value={form.lga} options={LGAS} onChange={(v) => setForm((p) => ({ ...p, lga: v }))} />
                <View style={ps.fieldWrap}>
                  <Text style={ps.fieldLabel}>FULL NAME</Text>
                  <TextInput style={ps.input} value={form.full_name} autoCapitalize="words"
                    onChangeText={(v) => setForm((p) => ({ ...p, full_name: v }))}
                    placeholderTextColor={MUTED} placeholder="Your full name" />
                </View>
                <View style={ps.fieldWrap}>
                  <Text style={ps.fieldLabel}>PHONE NUMBER</Text>
                  <TextInput style={ps.input} value={form.phone} keyboardType="phone-pad"
                    onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                    placeholderTextColor={MUTED} placeholder="Your phone number" />
                </View>
                <View style={ps.fieldWrap}>
                  <Text style={ps.fieldLabel}>YEARS EXPERIENCE</Text>
                  <TextInput style={ps.input} value={form.years_experience} keyboardType="numeric"
                    onChangeText={(v) => setForm((p) => ({ ...p, years_experience: v }))}
                    placeholderTextColor={MUTED} placeholder="e.g. 5" />
                </View>
                <View style={ps.fieldWrap}>
                  <Text style={ps.fieldLabel}>BIO <Text style={{ color: MUTED, fontWeight: "400" }}>(optional)</Text></Text>
                  <TextInput style={[ps.input, { minHeight: 90, textAlignVertical: "top" }]}
                    value={form.bio} multiline numberOfLines={4} autoCapitalize="sentences"
                    onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
                    placeholderTextColor={MUTED} placeholder="Tell clients about yourself..." />
                </View>
                <View style={ps.fieldWrap}>
                  <Text style={ps.fieldLabel}>NEW PASSWORD <Text style={{ color: MUTED, fontWeight: "400" }}>(leave blank to keep)</Text></Text>
                  <TextInput style={ps.input} value={form.password} secureTextEntry
                    onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
                    placeholderTextColor={MUTED} placeholder="Min 6 characters" autoCapitalize="none" />
                </View>
                <View style={ps.fieldWrap}>
                  <View style={ps.photoLabelRow}>
                    <Text style={ps.fieldLabel}>WORK PHOTOS</Text>
                    <Text style={[ps.fieldLabel, { color: ORANGE }]}>{keptPhotos.length + pending.length}/{MAX_WORK}</Text>
                  </View>
                  {allPhotos.length > 0 && (
                    <View style={ps.thumbGrid}>
                      {allPhotos.map((uri, i) => {
                        const isExisting = i < keptPhotos.length;
                        return (
                          <View key={i} style={ps.thumbWrap}>
                            <Image source={{ uri }} style={ps.thumbImg} />
                            <TouchableOpacity style={ps.removeBtn} onPress={() => {
                              if (isExisting) { setRemovedPhotos((prev) => [...prev, keptPhotos[i]]); }
                              else { const pi = i - keptPhotos.length; setPending((prev) => prev.filter((_, j) => j !== pi)); }
                            }}>
                              <Text style={{ color: WHITE, fontSize: 11, fontWeight: "800" }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  {(keptPhotos.length + pending.length) < MAX_WORK && (
                    <TouchableOpacity style={ps.addPhotoBtn} onPress={pickPhotos}>
                      <Text style={ps.addPhotoBtnTxt}>📷  Add Work Photos</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {!!uploadMsg && (
                  <View style={[ps.msgBox, { borderColor: uploadMsg.ok ? GREEN : "#ff4444" }]}>
                    <Text style={[ps.msgTxt, { color: uploadMsg.ok ? GREEN : "#ff4444" }]}>{uploadMsg.text}</Text>
                  </View>
                )}
                <TouchableOpacity style={ps.saveBtn} onPress={saveProfile} disabled={saving}>
                  {saving
                    ? <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <ActivityIndicator color={WHITE} size="small" />
                        <Text style={ps.saveBtnTxt}>Saving...</Text>
                      </View>
                    : <Text style={ps.saveBtnTxt}>Save Changes</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity style={ps.cancelBtn} onPress={() => {
                  setEditOpen(false); setPending([]); setRemovedPhotos([]);
                  setNewProfilePhoto(null); setNewHeroPhoto(null); setUploadMsg(null);
                }}>
                  <Text style={ps.cancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Lightbox — unchanged */}
      <Modal visible={lbOpen} transparent animationType="fade" onRequestClose={() => setLbOpen(false)}>
        <View style={s.lb}>
          <TouchableOpacity style={s.lbClose} onPress={() => setLbOpen(false)}>
            <Text style={{ color: WHITE, fontSize: 20 }}>✕</Text>
          </TouchableOpacity>
          {lbPhotos[lbIndex] && <Image source={{ uri: lbPhotos[lbIndex] }} style={s.lbImg} resizeMode="contain" />}
          {lbPhotos.length > 1 && (
            <>
              <TouchableOpacity style={[s.lbNav, { left: 12 }]} onPress={() => setLbIndex((p) => (p - 1 + lbPhotos.length) % lbPhotos.length)}>
                <Text style={{ color: WHITE, fontSize: 28 }}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.lbNav, { right: 12 }]} onPress={() => setLbIndex((p) => (p + 1) % lbPhotos.length)}>
                <Text style={{ color: WHITE, fontSize: 28 }}>›</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={s.lbCounter}>{lbIndex + 1} / {lbPhotos.length}</Text>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: BLACK },
  topBar:           { backgroundColor: ORANGE, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo:             { color: WHITE, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  topRight:         { flexDirection: "row", alignItems: "center", gap: 10 },
  bellBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  topAvatar:        { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  topAvatarTxt:     { color: WHITE, fontSize: 15, fontWeight: "800" },
  pageTitleWrap:    { backgroundColor: BLACK, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  pageTag:          { color: ORANGE, fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  pageTitle:        { color: WHITE, fontSize: 32, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 },
  profileCard:      { backgroundColor: CARD, marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  profileCardInner: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  smallAvatarWrap:  { width: 72, height: 72, borderRadius: 10, backgroundColor: ORANGE, alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  smallAvatar:      { width: 72, height: 72 },
  smallAvatarTxt:   { color: WHITE, fontSize: 28, fontWeight: "900" },
  cardName:         { color: WHITE, fontSize: 20, fontWeight: "900", marginBottom: 2 },
  cardRole:         { color: MUTED, fontSize: 13, marginBottom: 8 },
  badgeRow:         { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  badge:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  badgeTxt:         { fontSize: 12, fontWeight: "700" },
  statsRow:         { flexDirection: "row", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 14 },
  statCell:         { flex: 1, alignItems: "center" },
  statNum:          { color: WHITE, fontSize: 22, fontWeight: "900" },
  statLbl:          { color: MUTED, fontSize: 12, marginTop: 2 },
  statDivider:      { width: 1, backgroundColor: BORDER, marginVertical: 4 },
  editBtn:          { backgroundColor: ORANGE, borderRadius: 14, marginHorizontal: 16, marginTop: 14, paddingVertical: 15, alignItems: "center" },
  editBtnTxt:       { color: WHITE, fontSize: 16, fontWeight: "800" },
  detailsCard:      { backgroundColor: ORANGE, marginHorizontal: 16, marginTop: 14, borderRadius: 16, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  detailsTitle:     { color: WHITE, fontSize: 18, fontWeight: "800", marginBottom: 4 },
  detailRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.18)" },
  detailLabel:      { color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "600" },
  detailValue:      { color: WHITE, fontSize: 13, fontWeight: "800", maxWidth: "60%", textAlign: "right" },
  bioCard:          { backgroundColor: CARD, marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  bioTitle:         { color: WHITE, fontSize: 15, fontWeight: "800", marginBottom: 8 },
  bioTxt:           { color: MUTED, fontSize: 14, lineHeight: 22 },
  section:          { marginHorizontal: 16, marginTop: 20 },
  sectionTitle:     { color: WHITE, fontSize: 16, fontWeight: "800", marginBottom: 12 },
  photoGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumb:            { width: THUMB, height: THUMB, borderRadius: 10, overflow: "hidden", backgroundColor: CARD2 },
  emptyBox:         { backgroundColor: CARD, borderRadius: 14, padding: 20, alignItems: "center" },
  reviewCard:       { backgroundColor: "rgba(0,200,83,0.06)", borderWidth: 1, borderColor: "rgba(0,200,83,0.18)", borderRadius: 14, padding: 16, marginBottom: 10 },
  reviewTop:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  reviewerName:     { color: WHITE, fontSize: 14, fontWeight: "800" },
  reviewStars:      { color: "#FFD700", fontSize: 14, letterSpacing: 2 },
  reviewTxt:        { color: MUTED, fontSize: 13, lineHeight: 20 },
  reviewDate:       { color: MUTED, fontSize: 11, marginTop: 6 },
  logoutBtn:        { marginHorizontal: 16, marginTop: 20, backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  logoutTxt:        { color: WHITE, fontSize: 15, fontWeight: "800" },
  lb:               { flex: 1, backgroundColor: "rgba(0,0,0,0.97)", alignItems: "center", justifyContent: "center" },
  lbClose:          { position: "absolute", top: 50, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  lbImg:            { width: SW, height: SW * 1.2 },
  lbNav:            { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  lbCounter:        { position: "absolute", bottom: 40, color: MUTED, fontSize: 13 },
});

const em = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet:       { backgroundColor: "#141414", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, maxHeight: SH * 0.93 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 16 },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { color: WHITE, fontSize: 20, fontWeight: "900" },
});

const ps = StyleSheet.create({
  heroWrap:              { marginBottom: 16 },
  heroBtn:               { width: "100%", height: 140, borderRadius: 14, overflow: "hidden", position: "relative", borderWidth: 1, borderColor: BORDER },
  heroImg:               { width: "100%", height: "100%" },
  heroPlaceholder:       { width: "100%", height: "100%", backgroundColor: "#1e1e1e", alignItems: "center", justifyContent: "center" },
  heroHint:              { color: MUTED, fontSize: 13, marginTop: 6 },
  heroCameraOverlay:     { position: "absolute", bottom: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.7)", borderWidth: 1, borderColor: ORANGE, alignItems: "center", justifyContent: "center" },
  profilePhotoWrap:      { alignItems: "center", marginBottom: 24 },
  profilePhotoBtn:       { width: 90, height: 90, borderRadius: 45, overflow: "visible", position: "relative" },
  profilePhotoImg:       { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: ORANGE },
  profilePhotoPlaceholder:{ width: 90, height: 90, borderRadius: 45, backgroundColor: ORANGE, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: ORANGE },
  profilePhotoInitial:   { color: WHITE, fontSize: 34, fontWeight: "900" },
  cameraOverlay:         { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: CARD, borderWidth: 2, borderColor: ORANGE, alignItems: "center", justifyContent: "center" },
  profilePhotoHint:      { color: MUTED, fontSize: 12, marginTop: 8 },
  fieldWrap:             { marginBottom: 20 },
  fieldLabel:            { color: MUTED, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
  input:                 { backgroundColor: "#1e1e1e", borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: WHITE, fontSize: 15 },
  pickerBtn:             { backgroundColor: "#1e1e1e", borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerBtnTxt:          { color: WHITE, fontSize: 15 },
  pickerOverlay:         { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  pickerSheet:           { backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  pickerTitle:           { color: WHITE, fontSize: 17, fontWeight: "800", marginBottom: 14 },
  pickerOpt:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  pickerOptActive:       { backgroundColor: "rgba(255,92,26,0.06)", marginHorizontal: -20, paddingHorizontal: 20 },
  pickerOptTxt:          { color: WHITE, fontSize: 15 },
  pickerCancel:          { marginTop: 16, alignItems: "center", paddingVertical: 14 },
  photoLabelRow:         { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  thumbGrid:             { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  thumbWrap:             { width: THUMB, height: THUMB, borderRadius: 10, overflow: "hidden", backgroundColor: CARD2, position: "relative" },
  thumbImg:              { width: "100%", height: "100%" },
  removeBtn:             { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", zIndex: 5 },
  addPhotoBtn:           { borderWidth: 2, borderColor: ORANGE, borderStyle: "dashed", borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "rgba(255,92,26,0.05)" },
  addPhotoBtnTxt:        { color: ORANGE, fontSize: 15, fontWeight: "700" },
  msgBox:                { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: "rgba(255,255,255,0.03)" },
  msgTxt:                { textAlign: "center", fontSize: 13, fontWeight: "600" },
  saveBtn:               { backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginBottom: 10, minHeight: 52, justifyContent: "center" },
  saveBtnTxt:            { color: WHITE, fontSize: 16, fontWeight: "800" },
  cancelBtn:             { borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  cancelBtnTxt:          { color: MUTED, fontSize: 15, fontWeight: "600" },
});