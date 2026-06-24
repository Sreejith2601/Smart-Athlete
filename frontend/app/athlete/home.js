import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser, getSessions } from "../../utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile, getTrainingByAthlete, getWeeklyAnalytics, getCPIMetrics, getCPITrendMetrics, getSmartInsights, saveOnboardingMetrics } from "../../services/api";
import watchService from "../../services/watchService";



export default function AthleteHome() {
  const router = useRouter();

  const [athlete, setAthlete] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [cpiData, setCpiData] = useState(null);
  const [cpiLoading, setCpiLoading] = useState(true);
  const [cpiTrend, setCpiTrend] = useState([]);
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  
  // Quick Setup States
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [restingHR, setRestingHR] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [setupAge, setSetupAge] = useState("");

  const loadAthlete = useCallback(async () => {
    try {
      let user = null;
      let backendSessions = null;

      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          console.log("[Home] Loading profile from backend...");
          const backendUser = await getProfile(token);
          
          // --- NEW: ONBOARDING LOGIC ---
          const isNew = !backendUser.restingHR;
          if (isNew) {
            setShowQuickSetup(true);
          }
          // --- END NEW LOGIC ---

          setIsOnboardingComplete(!!backendUser.LTHR);

          
          if (backendUser.age) setSetupAge(backendUser.age.toString());
      
      if (backendUser.role && backendUser.role !== 'athlete') {
            console.log("[Home] Role mismatch in Athlete Home. Redirecting to appropriate dashboard.");
            router.replace(`/${backendUser.role}/home`);
            return;
          }
          
          user = {
            ...backendUser,
            id: backendUser._id,
            profile: backendUser.profile || {},
          };
          console.log("[Home] Loaded from backend:", user.name);

          // Update local storage so other screens (like Training) have the latest data
          await AsyncStorage.setItem("currentUser", JSON.stringify(user));
          
          // const userId = backendUser._id || backendUser.id;
          
          const data = await getTrainingByAthlete(token);
          backendSessions = (Array.isArray(data) ? data : []);

          const currentMode = backendUser.trainingMode || (backendUser.profile && backendUser.profile.trainingMode) || "self";

          // NEW: Load Weekly Analytics
          setAnalyticsLoading(true);
          const analyticsData = await getWeeklyAnalytics(token);
          setWeeklyAnalytics(analyticsData);
          setAnalyticsLoading(false);

          // NEW: Load CPI Metrics
          setCpiLoading(true);
          const cpiRes = await getCPIMetrics(token, null, currentMode);
          setCpiData(cpiRes);
          setCpiLoading(false);

          // NEW: Load CPI Trend
          const trendRes = await getCPITrendMetrics(token, null, currentMode);
          setCpiTrend(trendRes || []);

          // NEW: Load Smart Insights
          setInsightsLoading(true);
          const insightsRes = await getSmartInsights(token, null, currentMode);
          setInsightsData(insightsRes);
          setInsightsLoading(false);

          
          /* 
          // Check for REAL live active sessions (from ActiveSession collection)
          const liveData = await getLiveActiveSessions(token);
          const myLive = (Array.isArray(liveData) ? liveData : []).find(
            a => String(a.athlete) === String(userId) || 
                 String(a.athlete?._id) === String(userId)
          );
          setActiveSession(myLive || null);
          */
        }
      } catch (error) {
        console.log("[Home] Backend load failed, using local:", error.message);
      }

      // Fallback to local storage
      if (!user) {
        user = await getCurrentUser();
      }

      const allSessions = backendSessions ? backendSessions : await getSessions();

      setAthlete(user || {
        name: "Athlete",
        profile: { trainingMode: "self", gender: "male" },
      });

      if (backendSessions) {
        allSessions.reverse();
      }

      setSessions(Array.isArray(allSessions) ? allSessions : []);

    } catch (error) {
      console.log("Error loading athlete:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handlePerformanceTest = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      setTestLoading(true);
      setTestError(null);

      // 1. Initialize and request permissions
      await watchService.initialize();
      const granted = await watchService.requestPermissions();
      if (!granted) {
        throw new Error("Health Connect permissions were not granted.");
      }

      // 2. Fetch history (35 mins)
      const rawRecords = await watchService.getHeartRateHistory(35);
      if (!rawRecords || rawRecords.length === 0) {
        throw new Error("No heart rate data found for the last 30 minutes. Ensure your watch is syncing with Health Connect.");
      }

      // 3. Process data
      const processedHR = watchService.prepareOnboardingHRData(rawRecords);
      const mockData = { 
        hrReadings: processedHR, 
        distanceKm: 5.5 // Simplified distance for now, assuming 30 min run
      };

      // 4. Call API
      await saveOnboardingMetrics(token, mockData);
      
      setIsOnboardingComplete(true);
      setShowQuickSetup(false);
      alert("Performance Test Completed! Your HR zones have been calculated.");

      // 3. Refresh user data
      await loadAthlete();
    } catch (err) {
      setTestError(err.message);
      alert("Test failed: " + err.message);
    } finally {
      setTestLoading(false);
    }
  };

  const handleQuickSetup = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const currentAge = setupAge ? parseInt(setupAge) : athlete?.age;
      
      if (!currentAge) {
        alert("Age is required for estimation. Please provide your age.");
        return;
      }

      setTestLoading(true);
      setTestError(null);

      const setupData = {
        age: currentAge,
        restingHR: restingHR ? parseInt(restingHR) : undefined,
        fitnessLevel: fitnessLevel
      };

      await saveOnboardingMetrics(token, setupData);

      setIsOnboardingComplete(true);
      setShowQuickSetup(false);
      alert("Quick Setup Completed! Your HR zones have been estimated.");
      await loadAthlete();
    } catch (err) {
      setTestError(err.message);
      alert("Setup failed: " + err.message);
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => { loadAthlete(); }, [loadAthlete]);

  useFocusEffect(useCallback(() => { loadAthlete(); }, [loadAthlete]));

  if (loading) {
    return (
      <LinearGradient
        colors={["#FFF5F5", "#FFE4E1"]}
        style={styles.center}
      >
        <Text style={{ color: "#1E293B" }}>Loading...</Text>
      </LinearGradient>
    );
  }

  const athleteName = athlete?.name || "Athlete";
  const firstLetter = athleteName.charAt(0).toUpperCase();
  const trainingMode = athlete?.trainingMode || athlete?.profile?.trainingMode || "self";
  const gender = athlete?.profile?.gender || "male";
  const lastPeriod = athlete?.cycle?.lastPeriodStart;

  // Session-based logic
  const lastSession = sessions.length > 0
    ? sessions[sessions.length - 1]
    : null;

  const lastFatigue = lastSession?.fatigue || 0;
 
  // Find Today's Workout (Coach Assigned)
  const todayWorkout = (trainingMode === "coach") 
    ? sessions.find(s => s.status === 'pending' || s.status === 'active') 
    : null;

  console.log(`[Home] Mode: ${trainingMode}, Sessions: ${sessions.length}, Today: ${!!todayWorkout}`);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const sessionsThisWeek = (Array.isArray(sessions) ? sessions : []).filter((s) => {
    const d = new Date(s.date);
    return d >= weekStart;
  });

  const sessionsCompleted = sessionsThisWeek.length;
  const targetSessions = 6;

  // Streak
  let streakDays = 0;
  let currentDate = new Date();

  for (let i = sessions.length - 1; i >= 0; i--) {
    const sessionDate = new Date(sessions[i].date);
    const diffDays = Math.floor(
      (currentDate - sessionDate) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0 || diffDays === 1) {
      streakDays++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }

  // Condition
  let conditionText = "Ready";
  let conditionColor = "#b7ff3c";

  if (lastFatigue >= 7) {
    conditionText = "High";
    conditionColor = "#ef4444";
  } else if (lastFatigue >= 5) {
    conditionText = "Moderate";
    conditionColor = "#f59e0b";
  }
  // Trend info is now handled by the backend getSmartInsights API
  
  // const trend = getTrendInfo(); // Removed



  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        {/* Quick Setup Modal */}
        <Modal visible={showQuickSetup} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 500, alignSelf: 'center', width: '100%' }]}>
              <LinearGradient colors={['#FFFFFF', '#FFF0F5']} style={styles.modalGradient}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={styles.welcomeIconContainer}>
                    <Ionicons name="sparkles" size={32} color="#FF6B6B" />
                  </View>
                  <Text style={styles.welcomeTitle}>Welcome, {athleteName}!</Text>
                  <Text style={styles.welcomeSubtitle}>Let's calibrate your Smart Athlete engine.</Text>
                </View>

                <View style={styles.welcomeInstructionBox}>
                  <Text style={styles.instructionText}>
                    To provide your Chronic Performance Index (CPI) and custom training zones, we need your resting heart rate.
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modalLabel}>Your Current Age</Text>
                  <TextInput
                    style={styles.modalInput} placeholder="e.g. 25" placeholderTextColor="#64748b"
                    keyboardType="number-pad" value={setupAge} onChangeText={setSetupAge}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modalLabel}>Resting Heart Rate (BPM)</Text>
                  <TextInput
                    style={styles.modalInput} placeholder="e.g. 58" placeholderTextColor="#64748b"
                    keyboardType="number-pad" value={restingHR} onChangeText={setRestingHR}
                  />
                  <Text style={styles.inputHint}>Tip: Check your watch or pulse.</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modalLabel}>Current Fitness Level</Text>
                  <View style={styles.fitnessToggle}>
                    {["beginner", "intermediate", "advanced"].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.levelBtn, fitnessLevel === level && styles.levelBtnActive]}
                        onPress={() => setFitnessLevel(level)}
                      >
                        <Text style={[styles.levelText, fitnessLevel === level && styles.levelTextActive]}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.setupCompleteBtn, (!restingHR || !setupAge || testLoading) && { opacity: 0.5 }]} 
                  onPress={handleQuickSetup} disabled={!restingHR || !setupAge || testLoading}
                >
                  <LinearGradient colors={['#FF8E8B', '#FF6B6B']} style={styles.setupCompleteGradient}>
                    <Text style={styles.setupCompleteText}>{testLoading ? "Calibrating..." : "Finish Onboarding"}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 16 }} onPress={handlePerformanceTest} disabled={testLoading}>
                  <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Expert: Calculate via 30-min HR Test
                  </Text>
                </TouchableOpacity>

                {testError && <Text style={styles.modalError}>{testError}</Text>}
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {!isOnboardingComplete && !showQuickSetup && !loading && (
          <TouchableOpacity 
            style={[styles.premiumCard, { borderColor: 'rgba(255, 107, 107, 0.4)', borderStyle: 'dashed', width: '100%', marginBottom: 24 }]}
            onPress={() => setShowQuickSetup(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
              <Text style={[styles.cardHeading, { color: '#FF6B6B', marginLeft: 8 }]}>Finish Setup Required</Text>
            </View>
            <Text style={[styles.cardSubText, { marginTop: 8 }]}>
              Tap to enter your vitals and unlock your personalized AI training plans.
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.webWelcomeRow}>
          <Text style={styles.webGreeting}>Welcome back, <Text style={{color: '#FF6B6B'}}>{athleteName}</Text>!</Text>
          <Text style={styles.webSubGreeting}>Let's look at your training analytics and health diagnostics today.</Text>
        </View>

        <View style={styles.webColumns}>
          {/* Main Column */}
          <View style={styles.webLeftColumn}>
            {/* Today's Workout Hero Card (COACH) */}
            {trainingMode === "coach" && todayWorkout && (
              <View style={styles.heroCard}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/athlete/training-overview')}>
                  <View style={styles.heroHeader}>
                    <Text style={styles.heroTitle}>Today's Workout</Text>
                    <Ionicons name="walk-outline" size={20} color="#0ea5e9" />
                  </View>

                  <Text style={styles.workoutTypeActive}>
                    {(todayWorkout.trainingType || "General Training").toUpperCase()}
                  </Text>

                  <View style={styles.workoutRow}>
                    <View style={styles.workoutDetails}>
                      <View style={styles.detailGroup}>
                        <Text style={styles.detailLabel}>DURATION</Text>
                        <Text style={styles.detailValue}>
                          {todayWorkout.duration || "--"}
                        </Text>
                      </View>
                      <View style={[styles.detailGroup, { marginTop: 16 }]}>
                        <Text style={styles.detailLabel}>INTENSITY</Text>
                        <Text style={styles.detailValue}>
                          {todayWorkout.intensity || "--"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.mapMapContainer}>
                       <View style={styles.abstractMapPath}>
                         <Ionicons name="navigate" size={36} color="#FF6B6B" style={{transform:[{rotate:'45deg'}]}} />
                       </View>
                       <View style={styles.mapFooter}>
                         <Text style={{color:'#64748B', fontSize:9}}>COACH ASSIGNED</Text>
                       </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Smart Insights Hero Card (SELF-TRAINED) */}
            {trainingMode === "self" && (
              <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <Text style={styles.heroTitle}>Smart Insights</Text>
                  <Ionicons name="sparkles" size={20} color="#FF6B6B" />
                </View>

                {cpiData?.mlPrediction && cpiData.mlPrediction !== 'unknown' ? (
                  <View style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor:
                      cpiData.mlPrediction === 'overtraining'  ? 'rgba(239,68,68,0.15)' :
                      cpiData.mlPrediction === 'undertraining' ? 'rgba(245,158,11,0.15)' :
                                                                 'rgba(34,197,94,0.15)',
                    borderWidth: 1,
                    borderColor:
                      cpiData.mlPrediction === 'overtraining'  ? '#ef4444' :
                      cpiData.mlPrediction === 'undertraining' ? '#f59e0b' :
                                                                 '#22c55e',
                    marginBottom: 16
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '800',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color:
                        cpiData.mlPrediction === 'overtraining'  ? '#ef4444' :
                        cpiData.mlPrediction === 'undertraining' ? '#f59e0b' :
                                                                   '#22c55e',
                    }}>
                      {cpiData.mlPrediction}
                    </Text>
                  </View>
                ) : (
                    <Text style={styles.workoutTypeActive}>DAILY OVERVIEW</Text>
                )}

                <View style={styles.workoutRow}>
                  <View style={styles.workoutDetails}>
                    <Text style={{color: '#1E293B', fontSize: 15, lineHeight: 22, fontWeight: '600'}}>
                      {insightsLoading ? "Analyzing training context..." : (insightsData?.insight || "Gathering baseline data for personalized insights.")}
                    </Text>
                    
                    {insightsData?.recommendation && (
                      <Text style={{color: '#64748B', fontSize: 13, lineHeight: 20, marginTop: 12, fontStyle: 'italic'}}>
                        "{insightsData.recommendation}"
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Performance Trend Chart */}
            <View style={styles.trendCard}>
              <Text style={styles.cardHeading}>PERFORMANCE TREND</Text>
              
              {cpiTrend && cpiTrend.length > 0 ? (
                <View style={styles.chartArea}>
                  <View style={{ height: 160, width: '100%', marginTop: 24 }}>
                    {(() => {
                      const data = cpiTrend.slice(-6);
                      // Use a fixed wide layout chart width on web
                      const width = 760;
                      const height = 120;
                      const maxVal = Math.max(...data.map(d => d.cpi), 100) + 10;
                      const minVal = Math.max(0, Math.min(...data.map(d => d.cpi)) - 10);
                      const range = maxVal - minVal || 1;
                      
                      const points = data.map((d, i) => ({
                        x: (i / (Math.max(1, data.length - 1))) * width,
                        y: height - ((d.cpi - minVal) / range) * height,
                        cpi: d.cpi,
                        date: d.weekStart
                      }));

                      return (
                        <View style={{ width: width, height: height + 40 }}>
                          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.03)' }} />
                          <View style={{ position: 'absolute', top: height/2, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.03)' }} />
                          <View style={{ position: 'absolute', top: height, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />

                          {/* Line Segments */}
                          {points.map((p, i) => {
                            if (i === points.length - 1) return null;
                            const pnext = points[i+1];
                            const dx = pnext.x - p.x;
                            const dy = pnext.y - p.y;
                            const dist = Math.sqrt(dx*dx + dy*dy);
                            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                            
                            return (
                              <View 
                                key={`line-${i}`}
                                style={{
                                  position: 'absolute',
                                  left: p.x + dx/2 - dist/2,
                                  top: p.y + dy/2,
                                  width: dist,
                                  height: 3,
                                  backgroundColor: '#FF6B6B',
                                  opacity: 0.8,
                                  transform: [{ rotate: `${angle}deg` }],
                                }}
                              />
                            );
                          })}

                          {/* Points */}
                          {points.map((p, i) => {
                             const isLatest = i === points.length - 1;
                             const isStart = i === 0;
                             const ptSize = isLatest ? 8 : 6;
                             const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                             
                             return (
                               <View key={`pt-${i}`} style={{ position:'absolute', left: p.x - ptSize/2, top: p.y - ptSize/2}}>
                                  <View style={{
                                     width: ptSize, height: ptSize, borderRadius: ptSize/2, 
                                     backgroundColor: isLatest ? '#FFFFFF' : '#FF6B6B',
                                     borderWidth: 2, borderColor: '#FF6B6B',
                                  }} />
                                  
                                  <Text style={{ position:'absolute', bottom:10, left: -15, width:30, textAlign:'center', color: isLatest ? '#FF6B6B' : '#1E293B', fontSize:10, fontWeight:'700'}}>
                                     {Math.round(p.cpi)}
                                  </Text>

                                  {(isLatest || isStart) && (
                                    <Text style={{ position:'absolute', top: height - p.y + 10, left: -20, width: 40, textAlign:'center', color: '#64748B', fontSize:9 }}>
                                       {(() => {
                                         const d = new Date(p.date); return `${months[d.getMonth()]} ${d.getDate()}`;
                                       })()}
                                    </Text>
                                  )}
                               </View>
                             );
                          })}
                        </View>
                      );
                    })()}
                  </View>
                </View>
              ) : (
                <View style={styles.placeholderBox}>
                  <Text style={{color:'#64748B'}}>Analyzing history...</Text>
                </View>
              )}
            </View>
          </View>

          {/* Sidebar Column */}
          <View style={styles.webRightColumn}>
            {/* CPI PERFORMANCE SCORE */}
            <View style={styles.metricCardWeb}>
               <View style={styles.metricTop}>
                  <Text style={styles.metricLabelLine}>CPI PERFORMANCE SCORE</Text>
                  <Ionicons name="bar-chart" size={16} color="#38BDF8" style={{position:'absolute', right:0, top:0}} />
               </View>
               <Text style={[styles.metricValueLarge, { fontSize: 32, marginTop: 8 }]}>{cpiLoading ? "..." : (cpiData?.cpi || "--")}</Text>
               <Text style={[styles.metricTrendUp, { color: (cpiTrend && cpiTrend.length >= 2 && cpiTrend[cpiTrend.length-1].cpi >= cpiTrend[cpiTrend.length-2].cpi) ? '#22c55e' : '#ef4444', marginTop: 4 }]}>
                 {cpiTrend && cpiTrend.length >= 2 
                   ? `${cpiTrend[cpiTrend.length-1].cpi >= cpiTrend[cpiTrend.length-2].cpi ? '↑' : '↓'} ${Math.abs(((cpiTrend[cpiTrend.length-1].cpi - cpiTrend[cpiTrend.length-2].cpi) / cpiTrend[cpiTrend.length-2].cpi * 100).toFixed(1))}% vs last week`
                   : "Stable"}
               </Text>
               <View style={[styles.miniProgressBar, { marginTop: 12 }]}>
                 <View style={[styles.miniProgressFill, { width: `${Math.min(100, cpiData?.cpi || 0)}%`, backgroundColor: '#38BDF8' }]} />
               </View>
            </View>

            {/* RESTING HR */}
            <View style={[styles.metricCardWeb, { borderColor: 'rgba(6,182,212,0.3)' }]}>
               <View style={styles.metricTop}>
                  <Text style={styles.metricLabelLine}>RESTING HEART RATE</Text>
                  <Ionicons name="heart" size={16} color="#06b6d4" style={{position:'absolute', right:0, top:0}} />
               </View>
               <Text style={[styles.metricValueLarge, { fontSize: 32, marginTop: 8 }]}>
                 {athlete?.restingHR || "54"}
                 <Text style={styles.metricUnit}> bpm</Text>
               </Text>
               <Text style={[styles.metricTrendUp, {color:'#06b6d4', marginTop: 4}]}>Stable physiological baseline</Text>
            </View>

            {/* FATIGUE LEVEL */}
            <View style={[styles.metricCardWeb, { borderColor: 'rgba(234,179,8,0.3)' }]}>
               <View style={styles.metricTop}>
                  <Text style={styles.metricLabelLine}>FATIGUE LEVEL</Text>
                  <Ionicons name="flash-outline" size={16} color="#eab308" style={{position:'absolute', right:0, top:0}} />
               </View>
               <Text style={[styles.metricValueLarge, { color: '#eab308', fontSize: 24, marginTop: 8, textTransform:'capitalize' }]}>
                 {conditionText}
               </Text>
               <Text style={[styles.metricTrendUp, {color:'#94a3b8', marginTop: 4}]}>{lastFatigue || 6}/10 Index</Text>
               <View style={[styles.miniProgressBar, { marginTop: 12 }]}>
                 <View style={[styles.miniProgressFill, { width: `${(lastFatigue || 6)*10}%`, backgroundColor: '#eab308' }]} />
               </View>
            </View>

            {/* Quick Actions Card */}
            <View style={styles.quickActionsCardWeb}>
               <Text style={[styles.cardHeading, { marginBottom: 12 }]}>QUICK WORKFLOWS</Text>
               <View style={styles.webActionsGrid}>
                 <TouchableOpacity style={styles.actionBtnWeb} onPress={() => router.push('/athlete/log-session')}>
                   <Ionicons name="add-circle" size={18} color="#FF6B6B" />
                   <Text style={styles.actionBtnTextWeb}>Log Training Session</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.actionBtnWeb} onPress={() => router.push('/athlete/history')}>
                   <Ionicons name="time" size={18} color="#FF6B6B" />
                   <Text style={styles.actionBtnTextWeb}>View Workout History</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.actionBtnWeb} onPress={() => router.push('/athlete/training-overview')}>
                   <Ionicons name="calendar" size={18} color="#FF6B6B" />
                   <Text style={styles.actionBtnTextWeb}>Review Training Calendar</Text>
                 </TouchableOpacity>
                 {trainingMode === "coach" && (
                   <TouchableOpacity style={styles.actionBtnWeb} onPress={() => router.push('/athlete/coach-chat')}>
                     <Ionicons name="chatbubbles" size={18} color="#FF6B6B" />
                     <Text style={styles.actionBtnTextWeb}>Message Coach</Text>
                   </TouchableOpacity>
                 )}
               </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#FFF5F5", "#FFE4E1"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* 1. Header (Redesigned) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.profileCircle}
              onPress={() => router.push('/athlete/profile')}
            >
              {typeof athlete?.profile?.profilePicture === 'string' ? (
                 <Text style={styles.profileLetter}>{firstLetter}</Text>
              ) : (
                <Text style={styles.profileLetter}>{firstLetter}</Text>
              )}
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greetingSub}>Welcome back,</Text>
              <Text style={styles.greetingMain}>{athleteName}!</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="search-outline" size={22} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Setup Modal (Unchanged structurally, just theme) */}
        <Modal visible={showQuickSetup} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient colors={['#FFFFFF', '#FFF0F5']} style={styles.modalGradient}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={styles.welcomeIconContainer}>
                    <Ionicons name="sparkles" size={32} color="#FF6B6B" />
                  </View>
                  <Text style={styles.welcomeTitle}>Welcome, {athleteName}!</Text>
                  <Text style={styles.welcomeSubtitle}>Let&apos;s calibrate your Smart Athlete engine.</Text>
                </View>

                <View style={styles.welcomeInstructionBox}>
                  <Text style={styles.instructionText}>
                    To provide your Chronic Performance Index (CPI) and custom training zones, we need your resting heart rate.
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modalLabel}>Your Current Age</Text>
                  <TextInput
                    style={styles.modalInput} placeholder="e.g. 25" placeholderTextColor="#64748b"
                    keyboardType="number-pad" value={setupAge} onChangeText={setSetupAge}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modalLabel}>Resting Heart Rate (BPM)</Text>
                  <TextInput
                    style={styles.modalInput} placeholder="e.g. 58" placeholderTextColor="#64748b"
                    keyboardType="number-pad" value={restingHR} onChangeText={setRestingHR}
                  />
                  <Text style={styles.inputHint}>Tip: Check your watch or pulse.</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modalLabel}>Current Fitness Level</Text>
                  <View style={styles.fitnessToggle}>
                    {["beginner", "intermediate", "advanced"].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.levelBtn, fitnessLevel === level && styles.levelBtnActive]}
                        onPress={() => setFitnessLevel(level)}
                      >
                        <Text style={[styles.levelText, fitnessLevel === level && styles.levelTextActive]}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.setupCompleteBtn, (!restingHR || !setupAge || testLoading) && { opacity: 0.5 }]} 
                  onPress={handleQuickSetup} disabled={!restingHR || !setupAge || testLoading}
                >
                  <LinearGradient colors={['#FF8E8B', '#FF6B6B']} style={styles.setupCompleteGradient}>
                    <Text style={styles.setupCompleteText}>{testLoading ? "Calibrating..." : "Finish Onboarding"}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 16 }} onPress={handlePerformanceTest} disabled={testLoading}>
                  <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Expert: Calculate via 30-min HR Test
                  </Text>
                </TouchableOpacity>

                {testError && <Text style={styles.modalError}>{testError}</Text>}
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {!isOnboardingComplete && !showQuickSetup && !loading && (
          <TouchableOpacity 
            style={[styles.premiumCard, { borderColor: 'rgba(255, 107, 107, 0.4)', borderStyle: 'dashed' }]}
            onPress={() => setShowQuickSetup(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
              <Text style={[styles.cardHeading, { color: '#FF6B6B', marginLeft: 8 }]}>Finish Setup Required</Text>
            </View>
            <Text style={[styles.cardSubText, { marginTop: 8 }]}>
              Tap to enter your vitals and unlock your personalized AI training plans.
            </Text>
          </TouchableOpacity>
        )}

        {/* 2. Today's Workout Hero Card (COACH) */}
        {trainingMode === "coach" && todayWorkout && (
          <View style={styles.heroCard}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/athlete/training-overview')}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroTitle}>Today&apos;s Workout</Text>
                <Ionicons name="walk-outline" size={20} color="#0ea5e9" />
              </View>

              <Text style={styles.workoutTypeActive}>
                {(todayWorkout.trainingType || "General Training").toUpperCase()}
              </Text>

              <View style={styles.workoutRow}>
                <View style={styles.workoutDetails}>
                  <View style={styles.detailGroup}>
                    <Text style={styles.detailLabel}>DURATION</Text>
                    <Text style={styles.detailValue}>
                      {todayWorkout.duration || "--"}
                    </Text>
                  </View>
                  <View style={[styles.detailGroup, { marginTop: 16 }]}>
                    <Text style={styles.detailLabel}>INTENSITY</Text>
                    <Text style={styles.detailValue}>
                      {todayWorkout.intensity || "--"}
                    </Text>
                  </View>
                </View>

                <View style={styles.mapMapContainer}>
                   <View style={styles.abstractMapPath}>
                     <Ionicons name="navigate" size={36} color="#FF6B6B" style={{transform:[{rotate:'45deg'}]}} />
                   </View>
                   <View style={styles.mapFooter}>
                     <Text style={{color:'#64748B', fontSize:9}}>COACH ASSIGNED</Text>
                   </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Smart Insights Hero Card (SELF-TRAINED) */}
        {trainingMode === "self" && (
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroTitle}>Smart Insights</Text>
              <Ionicons name="sparkles" size={20} color="#FF6B6B" />
            </View>

            {/* AI Status Badge */}
            {cpiData?.mlPrediction && cpiData.mlPrediction !== 'unknown' ? (
              <View style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor:
                  cpiData.mlPrediction === 'overtraining'  ? 'rgba(239,68,68,0.15)' :
                  cpiData.mlPrediction === 'undertraining' ? 'rgba(245,158,11,0.15)' :
                                                             'rgba(34,197,94,0.15)',
                borderWidth: 1,
                borderColor:
                  cpiData.mlPrediction === 'overtraining'  ? '#ef4444' :
                  cpiData.mlPrediction === 'undertraining' ? '#f59e0b' :
                                                             '#22c55e',
                marginBottom: 16
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '800',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color:
                    cpiData.mlPrediction === 'overtraining'  ? '#ef4444' :
                    cpiData.mlPrediction === 'undertraining' ? '#f59e0b' :
                                                               '#22c55e',
                }}>
                  {cpiData.mlPrediction}
                </Text>
              </View>
            ) : (
                <Text style={styles.workoutTypeActive}>DAILY OVERVIEW</Text>
            )}

            <View style={styles.workoutRow}>
              <View style={styles.workoutDetails}>
                <Text style={{color: '#1E293B', fontSize: 15, lineHeight: 22, fontWeight: '600'}}>
                  {insightsLoading ? "Analyzing training context..." : (insightsData?.insight || "Gathering baseline data for personalized insights.")}
                </Text>
                
                {insightsData?.recommendation && (
                  <Text style={{color: '#64748B', fontSize: 13, lineHeight: 20, marginTop: 12, fontStyle: 'italic'}}>
                    &quot;{insightsData.recommendation}&quot;
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
        {/* 3. Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* CPI PERFORMANCE SCORE */}
          <View style={styles.metricSquare}>
             <View style={styles.metricTop}>
                <Text style={styles.metricLabelLine}>CPI</Text>
                <Text style={styles.metricLabelLine}>PERFORMANCE</Text>
                <Text style={styles.metricLabelLine}>SCORE</Text>
                <Ionicons name="bar-chart" size={16} color="#38BDF8" style={{position:'absolute', right:0, top:0}} />
             </View>
             <Text style={styles.metricValueLarge}>{cpiLoading ? "..." : (cpiData?.cpi || "--")}</Text>
             <Text style={[styles.metricTrendUp, { color: (cpiTrend && cpiTrend.length >= 2 && cpiTrend[cpiTrend.length-1].cpi >= cpiTrend[cpiTrend.length-2].cpi) ? '#22c55e' : '#ef4444' }]}>
               {cpiTrend && cpiTrend.length >= 2 
                 ? `${cpiTrend[cpiTrend.length-1].cpi >= cpiTrend[cpiTrend.length-2].cpi ? '↑' : '↓'} ${Math.abs(((cpiTrend[cpiTrend.length-1].cpi - cpiTrend[cpiTrend.length-2].cpi) / cpiTrend[cpiTrend.length-2].cpi * 100).toFixed(1))}%`
                 : "Stable"}
             </Text>
             <View style={[styles.miniProgressBar, { marginTop: 4 }]}>
               <View style={[styles.miniProgressFill, { width: `${Math.min(100, cpiData?.cpi || 0)}%`, backgroundColor: '#38BDF8' }]} />
             </View>
          </View>

          {/* RESTING HR */}
          <View style={[styles.metricSquare, { borderColor: 'rgba(6,182,212,0.3)' }]}>
             <View style={styles.metricTop}>
                <Text style={styles.metricLabelLine}>RESTING</Text>
                <Text style={styles.metricLabelLine}>HR</Text>
                <Ionicons name="heart" size={16} color="#06b6d4" style={{position:'absolute', right:0, top:0}} />
             </View>
             <Text style={styles.metricValueLarge}>
               {athlete?.restingHR || "54"}
               <Text style={styles.metricUnit}> bpm</Text>
             </Text>
             <Text style={[styles.metricTrendUp, {color:'#06b6d4'}]}>Stable</Text>
             <View style={{ marginTop: 'auto', alignItems: 'center' }}>
                <Ionicons name="pulse-outline" size={32} color="#06b6d4" />
             </View>
          </View>

          {/* FATIGUE LEVEL */}
          <View style={[styles.metricSquare, { borderColor: 'rgba(234,179,8,0.3)' }]}>
             <View style={styles.metricTop}>
                <Text style={styles.metricLabelLine}>FATIGUE</Text>
                <Text style={styles.metricLabelLine}>LEVEL</Text>
                <Ionicons name="flash-outline" size={16} color="#eab308" style={{position:'absolute', right:0, top:0}} />
             </View>
             <Text style={[styles.metricValueLarge, { color: '#eab308', fontSize: 18, marginTop: 4, textTransform:'capitalize' }]}>
               {conditionText}
             </Text>
             <Text style={[styles.metricTrendUp, {color:'#94a3b8', marginTop:2}]}>{lastFatigue || 6}/10</Text>
             <View style={[styles.miniProgressBar, { marginTop: 'auto' }]}>
               <View style={[styles.miniProgressFill, { width: `${(lastFatigue || 6)*10}%`, backgroundColor: '#eab308' }]} />
             </View>
          </View>
        </View>

        {/* 4. PERFORMANCE TREND (Chart) */}
        <View style={styles.trendCard}>
          <Text style={styles.cardHeading}>PERFORMANCE TREND</Text>
          
          {cpiTrend && cpiTrend.length > 0 && Dimensions.get("window").width > 0 ? (
            <View style={styles.chartArea}>
              <View style={{ height: 160, width: '100%', marginTop: 24 }}>
                {(() => {
                  const data = cpiTrend.slice(-6);
                  const width = Dimensions.get("window").width - 80;
                  const height = 120;
                  const maxVal = Math.max(...data.map(d => d.cpi), 100) + 10;
                  const minVal = Math.max(0, Math.min(...data.map(d => d.cpi)) - 10);
                  const range = maxVal - minVal || 1;
                  
                  const points = data.map((d, i) => ({
                    x: (i / (Math.max(1, data.length - 1))) * width,
                    y: height - ((d.cpi - minVal) / range) * height,
                    cpi: d.cpi,
                    date: d.weekStart
                  }));

                  return (
                    <View style={{ width: width, height: height + 40 }}>
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
                      <View style={{ position: 'absolute', top: height/2, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
                      <View style={{ position: 'absolute', top: height, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                      {/* Line Segments */}
                      {points.map((p, i) => {
                        if (i === points.length - 1) return null;
                        const pnext = points[i+1];
                        const dx = pnext.x - p.x;
                        const dy = pnext.y - p.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                        
                        return (
                          <View 
                            key={`line-${i}`}
                            style={{
                              position: 'absolute',
                              left: p.x + dx/2 - dist/2,
                              top: p.y + dy/2,
                              width: dist,
                              height: 3,
                              backgroundColor: '#38BDF8',
                              opacity: 0.8,
                              transform: [{ rotate: `${angle}deg` }],
                              shadowColor: '#38BDF8', shadowRadius: 10, shadowOpacity: 0.4, elevation: 5
                            }}
                          />
                        );
                      })}

                      {/* Points */}
                      {points.map((p, i) => {
                         const isLatest = i === points.length - 1;
                         const isStart = i === 0;
                         const ptSize = isLatest ? 8 : 6;
                         const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                         
                         return (
                           <View key={`pt-${i}`} style={{ position:'absolute', left: p.x - ptSize/2, top: p.y - ptSize/2}}>
                              <View style={{
                                 width: ptSize, height: ptSize, borderRadius: ptSize/2, 
                                 backgroundColor: isLatest ? '#FFFFFF' : '#38BDF8',
                                 borderWidth: 2, borderColor: '#38BDF8',
                                 shadowColor: '#38BDF8', shadowRadius: 5, shadowOpacity: 0.4
                              }} />
                              
                              <Text style={{ position:'absolute', bottom:10, left: -15, width:30, textAlign:'center', color: isLatest ? '#38BDF8' : '#1E293B', fontSize:10, fontWeight:'700'}}>
                                 {Math.round(p.cpi)}
                              </Text>

                              {(isLatest || isStart) && (
                                <Text style={{ position:'absolute', top: height - p.y + 10, left: -20, width: 40, textAlign:'center', color: '#64748B', fontSize:9 }}>
                                   {(() => {
                                     const d = new Date(p.date); return `${months[d.getMonth()]} ${d.getDate()}`;
                                   })()}
                                </Text>
                              )}
                           </View>
                         );
                      })}
                      
                      {/* Gradient glow mockup */}
                      <LinearGradient
                        colors={['rgba(56,189,248,0.1)', 'transparent']}
                        style={{position:'absolute', bottom: 40, width:'100%', height:height/2}}
                      />
                    </View>
                  );
                })()}
              </View>
            </View>
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={{color:'#64748B'}}>Analyzing history...</Text>
            </View>
          )}
        </View>

        {/* Quick Actions (Minimalist Refactor) */}
        {!showQuickSetup && (
           <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8}}>
             <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/athlete/log-session')}>
               <Ionicons name="add" size={16} color="#94A3B8" />
               <Text style={styles.actionPillText}>Log Session</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/athlete/history')}>
               <Ionicons name="time-outline" size={16} color="#94A3B8" />
               <Text style={styles.actionPillText}>History</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/athlete/training-overview')}>
               <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
               <Text style={styles.actionPillText}>Timeline</Text>
             </TouchableOpacity>
             {trainingMode === "coach" && (
                <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/athlete/coach-chat')}>
                 <Ionicons name="chatbubble-outline" size={16} color="#94A3B8" />
                 <Text style={styles.actionPillText}>Chat</Text>
               </TouchableOpacity>
             )}
           </View>
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF8E8B', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  profileLetter: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  greetingSub: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  greetingMain: { color: '#1E293B', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#FFC0CB', shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },

  // Hero Card
  heroCard: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#FFC0CB', shadowOffset: {width:0, height:6}, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  heroTitle: { color: '#1E293B', fontSize: 18, fontWeight: '800' },
  workoutTypeActive: { color: '#0ea5e9', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  workoutRow: { flexDirection: 'row', justifyContent: 'space-between' },
  workoutDetails: { flex: 1 },
  detailGroup: { marginBottom: 12 },
  detailLabel: { color: '#64748B', fontSize: 10, letterSpacing: 1, fontWeight: '600', marginBottom: 2 },
  detailValue: { color: '#1E293B', fontSize: 22, fontWeight: '800' },
  detailUnit: { color: '#475569', fontSize: 14, fontWeight: '600' },
  mapMapContainer: { width: 100, height: 100, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', padding: 4 },
  abstractMapPath: { flex: 1, borderWidth: 2, borderColor: '#FF6B6B', borderRadius: 12, margin: 8, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', opacity: 0.8 },
  mapFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)', padding: 4, alignItems: 'center' },

  // Metrics Grid
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  metricSquare: { flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#FFFFFF', minHeight: 120, shadowColor: '#FFC0CB', shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  metricTop: { position: 'relative', marginBottom: 16 },
  metricLabelLine: { color: '#64748B', fontSize: 9, fontWeight: '600', letterSpacing: 0.5, lineHeight: 12 },
  metricValueLarge: { color: '#1E293B', fontSize: 24, fontWeight: '800' },
  metricUnit: { color: '#475569', fontSize: 12, fontWeight: '500' },
  metricTrendUp: { color: '#38BDF8', fontSize: 11, fontWeight: '700', marginTop: 2 },
  miniProgressBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2 },
  miniProgressFill: { height: '100%', borderRadius: 2 },

  // Trend Chart
  trendCard: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#FFC0CB', shadowOffset: {width:0, height:6}, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  cardHeading: { color: '#1E293B', fontSize: 14, fontWeight: '800', letterSpacing: 1, textTransform:'uppercase' },
  chartArea: { width: '100%', alignItems: 'center' },
  placeholderBox: { height: 100, alignItems: 'center', justifyContent: 'center' },

  // Abstract Globals
  cardSubText: { color: '#475569', fontSize: 13, lineHeight: 20 },
  premiumCard: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#FFC0CB', shadowOffset: {width:0, height:6}, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  actionPill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6, marginBottom: 12,
    borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#FFC0CB', shadowOffset: {width:0, height:2}, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3
  },
  actionPillText: { color: '#1E293B', fontSize: 12, fontWeight: '600' },

  // Modal pastel styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
  modalGradient: { padding: 24, backgroundColor: '#FFFFFF' },
  welcomeIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 107, 107, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcomeTitle: { color: '#1E293B', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  welcomeSubtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginTop: 4 },
  welcomeInstructionBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 24, marginTop: 10, borderLeftWidth: 3, borderLeftColor: '#FF6B6B' },
  instructionText: { color: '#334155', fontSize: 13, lineHeight: 18 },
  formGroup: { marginBottom: 20 },
  modalLabel: { color: '#1E293B', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  modalInput: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, color: '#1E293B', fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  inputHint: { color: '#94A3B8', fontSize: 11, marginTop: 6 },
  fitnessToggle: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  levelBtnActive: { backgroundColor: 'rgba(255, 107, 107, 0.1)', borderColor: '#FF6B6B' },
  levelText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  levelTextActive: { color: '#FF6B6B' },
  setupCompleteBtn: { marginTop: 10, borderRadius: 14, overflow: 'hidden' },
  setupCompleteGradient: { paddingVertical: 16, alignItems: 'center' },
  setupCompleteText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  modalError: { color: '#ef4444', textAlign: 'center', marginTop: 12, fontSize: 13 },

  // Web Styles
  webContainer: { width: '100%' },
  webWelcomeRow: { marginBottom: 24 },
  webGreeting: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  webSubGreeting: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '500' },
  webColumns: { flexDirection: 'row', gap: 24 },
  webLeftColumn: { flex: 7, gap: 24 },
  webRightColumn: { flex: 3.5, gap: 16 },
  metricCardWeb: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#FFC0CB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  quickActionsCardWeb: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#FFC0CB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  webActionsGrid: { flexDirection: 'column', gap: 10 },
  actionBtnWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE4E1',
    cursor: 'pointer',
  },
  actionBtnTextWeb: { color: '#1E293B', fontSize: 13, fontWeight: '700' },
});
