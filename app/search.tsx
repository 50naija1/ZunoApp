import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
const API = "https://zuno.ng/api";
const CATS = [
  {e:"❄️",n:"AC Technician"},{e:"⚡",n:"Electrician"},{e:"🔧",n:"Plumber"},
  {e:"🧹",n:"Cleaner"},{e:"🪵",n:"Carpenter"},{e:"🎨",n:"Painter"},
  {e:"🚿",n:"Tiler"},{e:"🔒",n:"Locksmith"},{e:"📺",n:"Electronics"},
  {e:"🌿",n:"Gardener"},{e:"🚗",n:"Auto Mechanic"},{e:"⚡",n:"Generator"},
];
export default function SearchScreen() {
  const [q, setQ] = useState(""); const [results, setResults] = useState<any[]>([]); const [loading, setLoading] = useState(false); const [searched, setSearched] = useState(false); const router = useRouter();
  const search = async (term: string) => {
    if (!term.trim()) return; setLoading(true); setSearched(true);
    try { const r = await fetch(`${API}/artisans?skill=${encodeURIComponent(term)}`); const d = await r.json(); setResults(d.artisans||d||[]); } catch { setResults([]); }
    setLoading(false);
  };
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <Text style={s.title}>Find Artisans</Text>
        <View style={s.searchBox}>
          <Text style={{fontSize:18,marginRight:8}}>🔍</Text>
          <TextInput style={s.input} placeholder="Search by skill e.g. Plumber..." placeholderTextColor="#555" value={q} onChangeText={setQ} onSubmitEditing={()=>search(q)} returnKeyType="search" />
          {q.length>0 && <TouchableOpacity onPress={()=>{setQ("");setResults([]);setSearched(false);}}><Text style={{color:"#555",fontSize:16,padding:4}}>✕</Text></TouchableOpacity>}
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {!searched && <><Text style={s.sectionTitle}>Browse by Category</Text><View style={s.grid}>{CATS.map((c,i)=>(<TouchableOpacity key={i} style={s.catCard} onPress={()=>{setQ(c.n);search(c.n);}}><Text style={{fontSize:28,marginBottom:6}}>{c.e}</Text><Text style={{color:"#aaa",fontSize:10,textAlign:"center",fontWeight:"600"}}>{c.n}</Text></TouchableOpacity>))}</View></>}
        {loading && <View style={s.center}><Text style={{color:"#888"}}>Searching artisans near you...</Text></View>}
        {searched && !loading && results.length===0 && <View style={s.center}><Text style={{fontSize:48,marginBottom:12}}>😕</Text><Text style={{color:"#fff",fontSize:16,fontWeight:"700",textAlign:"center"}}>No artisans found for "{q}"</Text><Text style={{color:"#888",textAlign:"center",marginTop:8}}>Try posting a job — artisans will reach out!</Text><TouchableOpacity style={s.btnOrange} onPress={()=>router.push("/post")}><Text style={s.btnText}>Post a Job →</Text></TouchableOpacity></View>}
        {results.map((a:any,i:number)=>(<View key={i} style={s.artCard}><View style={s.artAvatar}><Text style={{color:"#fff",fontWeight:"900",fontSize:20}}>{a.name?.[0]?.toUpperCase()||"A"}</Text></View><View style={{flex:1}}><Text style={{color:"#fff",fontWeight:"700",fontSize:15}}>{a.name||"Artisan"}</Text><Text style={{color:"#f97316",fontSize:12,marginTop:2}}>{a.skill||q}</Text><Text style={{color:"#888",fontSize:12,marginTop:2}}>📍 {a.lga||"Lagos"}</Text></View><View style={{backgroundColor:"#0d2e1a",paddingHorizontal:8,paddingVertical:4,borderRadius:8}}><Text style={{color:"#22c55e",fontSize:11,fontWeight:"700"}}>✅ Verified</Text></View></View>))}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  root:{flex:1,backgroundColor:"#0d0d0d"}, header:{paddingTop:56,paddingHorizontal:20,paddingBottom:16,borderBottomWidth:1,borderBottomColor:"#1e1e1e"},
  title:{color:"#fff",fontSize:22,fontWeight:"900",marginBottom:14}, searchBox:{flexDirection:"row",alignItems:"center",backgroundColor:"#1a1a1a",borderRadius:12,paddingHorizontal:14,borderWidth:1,borderColor:"#2a2a2a"},
  input:{flex:1,color:"#fff",fontSize:15,paddingVertical:14}, sectionTitle:{color:"#fff",fontSize:18,fontWeight:"800",paddingHorizontal:20,paddingTop:20,marginBottom:14},
  grid:{flexDirection:"row",flexWrap:"wrap",paddingHorizontal:20,gap:10}, catCard:{backgroundColor:"#1a1a1a",borderRadius:14,padding:14,width:"30%",alignItems:"center",borderWidth:1,borderColor:"#2a2a2a"},
  center:{alignItems:"center",paddingTop:60,paddingHorizontal:30}, btnOrange:{backgroundColor:"#f97316",borderRadius:14,paddingVertical:14,paddingHorizontal:30,alignItems:"center",marginTop:16},
  btnText:{color:"#fff",fontWeight:"800",fontSize:15}, artCard:{flexDirection:"row",alignItems:"center",backgroundColor:"#1a1a1a",marginHorizontal:20,marginBottom:10,borderRadius:14,padding:14,borderWidth:1,borderColor:"#2a2a2a"},
  artAvatar:{width:46,height:46,borderRadius:23,backgroundColor:"#f97316",alignItems:"center",justifyContent:"center",marginRight:12},
});