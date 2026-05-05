import { useEffect, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
const API = "https://zuno.ng/api";
const DEMO = [
  {type:"job",title:"New Job Near You!",message:"AC Technician needed in Lekki Phase 1",time:"2 mins ago",read:false},
  {type:"accepted",title:"Job Accepted",message:"An artisan has accepted your plumbing request",time:"15 mins ago",read:false},
  {type:"info",title:"Welcome to Zuno!",message:"Your account is verified. You're now live.",time:"1 hour ago",read:true},
];
export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { fetchAlerts(); const t = setInterval(fetchAlerts,30000); return () => clearInterval(t); }, []);
  const fetchAlerts = async () => {
    try { const r = await fetch(`${API}/alerts`); const d = await r.json(); setAlerts(d.alerts||d||DEMO); } catch { setAlerts(DEMO); }
    setLoading(false);
  };
  const icon = (t:string) => t==="job"?"🔔":t==="accepted"?"✅":"ℹ️";
  const col  = (t:string) => t==="job"?"#f97316":t==="accepted"?"#22c55e":"#3b82f6";
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <Text style={s.title}>Alerts</Text>
        {alerts.filter(a=>!a.read).length>0 && <View style={s.badge}><Text style={s.badgeText}>{alerts.filter(a=>!a.read).length} new</Text></View>}
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && <View style={s.center}><Text style={{color:"#888"}}>Loading alerts...</Text></View>}
        {!loading && alerts.length===0 && <View style={s.center}><Text style={{fontSize:48,marginBottom:12}}>🔕</Text><Text style={{color:"#fff",fontSize:18,fontWeight:"800",marginBottom:8}}>No Alerts Yet</Text><Text style={{color:"#888",textAlign:"center",lineHeight:20}}>When artisans accept your jobs, you'll see them here.</Text></View>}
        {alerts.map((a,i)=>(
          <TouchableOpacity key={i} style={[s.card,!a.read&&s.cardUnread]}>
            <View style={[s.iconBox,{backgroundColor:col(a.type)+"22"}]}><Text style={{fontSize:20}}>{icon(a.type)}</Text></View>
            <View style={{flex:1}}>
              <View style={{flexDirection:"row",alignItems:"center",marginBottom:4}}>
                <Text style={s.alertTitle}>{a.title}</Text>
                {!a.read&&<View style={s.dot}/>}
              </View>
              <Text style={s.alertMsg}>{a.message}</Text>
              <Text style={s.alertTime}>{a.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{margin:20,backgroundColor:"#1a1a1a",borderRadius:12,padding:14,borderWidth:1,borderColor:"#2a2a2a"}}>
          <Text style={{color:"#555",fontSize:12,lineHeight:18}}>🔄 Alerts refresh every 30 seconds automatically.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  root:{flex:1,backgroundColor:"#0d0d0d"}, header:{paddingTop:56,paddingHorizontal:20,paddingBottom:16,borderBottomWidth:1,borderBottomColor:"#1e1e1e",flexDirection:"row",alignItems:"center"},
  title:{color:"#fff",fontSize:22,fontWeight:"900",flex:1}, badge:{backgroundColor:"#f97316",borderRadius:12,paddingHorizontal:10,paddingVertical:4},
  badgeText:{color:"#fff",fontSize:12,fontWeight:"700"}, center:{alignItems:"center",paddingTop:80,paddingHorizontal:30},
  card:{flexDirection:"row",padding:16,marginHorizontal:16,marginTop:10,backgroundColor:"#1a1a1a",borderRadius:14,borderWidth:1,borderColor:"#2a2a2a"},
  cardUnread:{borderLeftWidth:3,borderLeftColor:"#f97316"}, iconBox:{width:44,height:44,borderRadius:22,alignItems:"center",justifyContent:"center",marginRight:12},
  alertTitle:{color:"#fff",fontWeight:"700",fontSize:14,flex:1}, dot:{width:8,height:8,borderRadius:4,backgroundColor:"#f97316"},
  alertMsg:{color:"#aaa",fontSize:13,lineHeight:18,marginBottom:6}, alertTime:{color:"#555",fontSize:12},
});