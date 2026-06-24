import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { startActiveSession, deleteTrainingPlan, getTrainingByAthlete, getLiveActiveSessions } from "../../services/api";

export default function TrainingOverview() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isNightWindow, setIsNightWindow] = useState(false);
  const [nightTimer, setNightTimer] = useState("");
  const [hasHR, setHasHR] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trainingMode, setTrainingMode] = useState("self");
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [completedTimer, setCompletedTimer] = useState("");

  const fetchPlans = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("currentUser");
      if (token && userStr) {
        let user = JSON.parse(userStr);
        
        // --- NEW: Dynamic sync if local data is stale ---
        if (!user.restingHR) {
          try {
            const { getProfile } = require("../../services/api");
            const freshUser = await getProfile(token);
            if (freshUser && freshUser.restingHR) {
              user = freshUser;
              await AsyncStorage.setItem("currentUser", JSON.stringify(user));
            }
          } catch (_e) {
            console.log("[Training] Profile sync failed, using cached user.");
          }
        }
        // --- END SYNC ---

        const userId = user._id || user.id;
        const mode = user.trainingMode || (user.profile && user.profile.trainingMode) || "self";
        setTrainingMode(mode);

        setHasHR(!!user.restingHR);

        // Night Window Check (9PM - 5AM)
        const now = new Date();
        const currentHour = now.getHours();
        
        if (currentHour >= 21 || currentHour < 5) {
          setIsNightWindow(true);
          const fiveAM = new Date();
          if (fiveAM.getHours() >= 5) fiveAM.setDate(fiveAM.getDate() + 1);
          fiveAM.setHours(5, 0, 0, 0);
          
          const timerInterval = setInterval(() => {
            const diff = fiveAM - new Date();
            if (diff <= 0) {
              setIsNightWindow(false);
              clearInterval(timerInterval);
              return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setNightTimer(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
          }, 1000);
        } else {
          setIsNightWindow(false);
        }

        console.log("[Training] Fetching plans for mode:", mode);

        const data = await getTrainingByAthlete(token);
        const safeData = Array.isArray(data) ? data : [];
        console.log(`[Training] Raw server data count: ${safeData.length}, Mode: ${mode}`);
        
        // COACH-GUIDED: Be more permissive (Show missed too)
        const visibleSessions = mode === "coach" 
          ? safeData.filter(item => item.status === "pending" || item.status === "active" || item.status === "missed")
          : safeData.filter(item => item.status === "pending" || item.status === "active");

        // --- CHECK FOR COMPLETED TODAY ---
        let todaysCompletedAIPlan = null;
        if (mode === "self") {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          todaysCompletedAIPlan = safeData.find(item => {
            if (item.planName !== "AI Daily Plan") return false;
            const d = new Date(item.date);
            return d >= todayStart && item.status === "completed";
          });
          
          if (todaysCompletedAIPlan) {
            setHasCompletedToday(true);
            const tmrw5AM = new Date();
            if (tmrw5AM.getHours() >= 5) tmrw5AM.setDate(tmrw5AM.getDate() + 1);
            tmrw5AM.setHours(5, 0, 0, 0);
            
            const timerInterval = setInterval(() => {
              const diff = tmrw5AM - new Date();
              if (diff <= 0) {
                setHasCompletedToday(false);
                clearInterval(timerInterval);
                return;
              }
              const h = Math.floor(diff / 3600000);
              const m = Math.floor((diff % 3600000) / 60000);
              const s = Math.floor((diff % 60000) / 1000);
              setCompletedTimer(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            }, 1000);
          } else {
            setHasCompletedToday(false);
          }
        }
        
        // --- AUTO AI GENERATION FOR SELF-TRAINED ---
        if (mode === "self" && visibleSessions.length === 0 && !todaysCompletedAIPlan) {
          // GUARD: Only generate if restingHR is provided
          if (!user.restingHR) {
            console.log("[Training] Skipping AI generation: restingHR missing.");
            setPlans([]);
            return;
          }

          console.log("[Training] No plans found for self-trained athlete. Triggering AI generation...");
          try {
            const { getProfile, getCPIMetrics, getDailyAIPlan } = require("../../services/api");
            
            // 1. Get profile and metrics
            const profile = await getProfile(token);
            const analytics = await getCPIMetrics(token);
            
            if (profile && analytics && analytics.mlPayload) {
              const payload = {
                event: profile.specialization || "5000m",
                level: profile.fitnessLevel || "beginner",
                startDate: profile.createdAt,
                raceTime: profile.profile?.raceTime || 20.0,
                raceDistance: profile.profile?.raceDistance || 5000,
                mlFeatures: analytics.mlPayload
              };

              console.log("[Training] AI Payload:", JSON.stringify(payload, null, 2));
              await getDailyAIPlan(token, payload);
              
              // 2. Refresh after creation
              const updatedData = await getTrainingByAthlete(token);
              const updatedSafeData = Array.isArray(updatedData) ? updatedData : [];
              const updatedVisible = updatedSafeData.filter(item => item.status === "pending" || item.status === "active");
              setPlans(updatedVisible);
            }
          } catch (aiError) {
            console.error("[Training] AI auto-generation failed:", aiError.message);
          }
        } else {
          setPlans(visibleSessions);
        }
        // --- END AI GENERATION ---

        // Check for REAL live active sessions
        const liveData = await getLiveActiveSessions(token);
        const myLive = (Array.isArray(liveData) ? liveData : []).find(
          a => String(a.athlete) === String(userId) || 
               String(a.athlete?._id) === String(userId)
        );
        setActiveSession(myLive || null);
      }
    } catch (error) {
      console.error("Error fetching training plans:", error);
    }
  };

  const handleSyncAIPlan = async () => {
    try {
      setIsGenerating(true);
      const token = await AsyncStorage.getItem("token");
      const { getProfile, getCPIMetrics, getDailyAIPlan } = require("../../services/api");
      
      const profile = await getProfile(token);
      const analytics = await getCPIMetrics(token);
      
      if (!profile || !analytics || !analytics.mlPayload) {
        throw new Error("Could not prepare training data. Please try again.");
      }

      const payload = {
        event: profile.specialization || "5000m",
        level: profile.fitnessLevel || "beginner",
        startDate: profile.createdAt || new Date().toISOString(),
        raceTime: profile.profile?.raceTime || 20.0,
        raceDistance: profile.profile?.raceDistance || 5000,
        mlFeatures: analytics.mlPayload
      };

      console.log("[Training] Requesting AI Plan with payload:", JSON.stringify(payload, null, 2));
      await getDailyAIPlan(token, payload);
      
      // Refresh list
      await fetchPlans();
      Alert.alert("Success", "Your AI training program has been generated for today!");

    } catch (error) {
      console.error("[Training] Manual Sync Error:", error.message);
      Alert.alert("Sync Failed", error.message || "Failed to generate AI plan. Ensure your ML service is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [])
  );

  const handleStartSession = async (plan) => {
    try {
      console.log("[Training] Start Session pressed for plan ID:", plan._id || plan.id);
      
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("currentUser");
      const user = userStr ? JSON.parse(userStr) : {};
      
      // Try to get ID from various possible keys
      const athleteId = user.id || user._id || user.userId;

      if (!athleteId) {
        console.warn("[Training] Athlete ID missing from local storage.");
      }

      const sessionData = {
        planId: plan._id || plan.id,
        sessionSlot: plan.sessionSlot || "Training",
        athleteId: athleteId, // Backend might use req.user.id but we send it for good measure
      };

      console.log("[Training] Sending sessionData:", JSON.stringify(sessionData, null, 2));
      
      const result = await startActiveSession(sessionData, token);
      
      console.log("[Training] Session start result:", JSON.stringify(result, null, 2));
      
      if (result) {
        setActiveSession(result);
        Alert.alert("Success", "Live session started!");
      }
    } catch (error) {
      console.error("Error starting session:", error);
      Alert.alert("Error", "Could not start session.");
    }
  };

  const handleEndSession = async () => {
    try {
      if (!activeSession) return;
      
      router.push({
        pathname: "/athlete/log-session",
        params: { 
          sessionId: activeSession._id || activeSession.id,
          startTime: activeSession.startTime
        }
      });
    } catch (error) {
      console.error("Error navigating to log session:", error);
      Alert.alert("Error", "Could not proceed to logging.");
    }
  };

  const handleDeletePlan = async (plan) => {
    Alert.alert(
      "Remove Plan",
      "Are you sure you want to remove this training plan? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (token) {
                await deleteTrainingPlan(plan._id || plan.id, token);
                setPlans((Array.isArray(plans) ? plans : []).filter(p => (p._id || p.id) !== (plan._id || plan.id)));
                Alert.alert("Success", "Training plan removed.");
              }
            } catch (error) {
              console.error("Error deleting plan:", error);
              Alert.alert("Error", "Could not remove plan.");
            }
          }
        }
      ]
    );
  };

  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    const plansData = Array.isArray(plans) ? plans : [];
    const processedPlans = plansData.length > 0 ? (
      plansData.flatMap((plan, pIndex) => {
        if (plan.sessions && plan.sessions.length > 0) {
          const morning = plan.sessions.find(s => s.sessionSlot?.toLowerCase() === 'morning');
          const evening = plan.sessions.find(s => s.sessionSlot?.toLowerCase() === 'evening');

          let nextSession = null;
          if (morning && (morning.status === 'pending' || morning.status === 'active')) {
            nextSession = morning;
          } else if (evening && (evening.status === 'pending' || evening.status === 'active')) {
            nextSession = evening;
          } else {
            nextSession = plan.sessions.find(s => s.status === 'pending' || s.status === 'active');
          }

          if (!nextSession) return [];

          return [{
            ...plan,
            trainingType: nextSession.trainingType || plan.trainingType || "COACH ASSIGNED",
            sessionSlot: nextSession.sessionSlot || plan.sessionSlot || "Today",
            mainWork: nextSession.mainWork || plan.mainWork || "--",
            duration: nextSession.duration || plan.duration || "--",
            intensity: nextSession.intensity || plan.intensity || "--",
            currentSessionId: nextSession._id || nextSession.id
          }];
        }
        return [plan];
      })
    ) : [];

    return (
      <View style={styles.webContainer}>
        {/* Onboarding Setup / Guards */}
        {!hasHR ? (
          <View style={styles.setupCard}>
            <LinearGradient colors={['#FFFFFF', '#FFF0F5']} style={styles.setupGradient}>
              <Ionicons name="settings-outline" size={32} color="#FF6B6B" style={{ marginBottom: 16 }} />
              <Text style={styles.setupTitle}>Setup Required</Text>
              <Text style={styles.setupSub}>Please complete your Quick Setup on the Home dashboard to unlock AI training plans.</Text>
              <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/athlete/home')}>
                <Text style={styles.setupBtnText}>Go to Home</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (trainingMode === "self" && isNightWindow && plansData.length === 0) ? (
          <View style={styles.nightAlert}>
            <LinearGradient colors={['#FFFFFF', '#FFF0F5']} style={styles.nightAlertGradient}>
              <View style={styles.nightAlertContent}>
                <View style={styles.nightAlertLeft}>
                  <Ionicons name="moon" size={24} color="#FF6B6B" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.nightAlertTitle}>Nightly Preparation</Text>
                    <Text style={styles.nightAlertSub}>AI morning session is being tuned.</Text>
                  </View>
                </View>
                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>{nightTimer}</Text>
                  <Text style={styles.timerLabel}>UNTIL 5 AM</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (trainingMode === "self" && hasCompletedToday) ? (
          <View style={styles.setupCard}>
            <LinearGradient colors={['#FFFFFF', '#F0FFF4']} style={styles.setupGradient}>
              <Ionicons name="checkmark-done-circle" size={48} color="#22c55e" style={{ marginBottom: 16 }} />
              <Text style={styles.setupTitle}>Training Complete</Text>
              <Text style={styles.setupSub}>Great job today! Rest up and recover. Your next personalized AI plan will be mapped out tomorrow at 5 AM.</Text>
              <View style={[styles.timerContainer, { marginTop: 24, paddingVertical: 14, paddingHorizontal: 36, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', alignItems: 'center' }]}>
                <Text style={[styles.timerText, { color: '#22c55e' }]}>{completedTimer}</Text>
                <Text style={[styles.timerLabel, { color: '#22c55e' }]}>UNTIL 5 AM</Text>
              </View>
            </LinearGradient>
          </View>
        ) : (trainingMode === "self" && plansData.length === 0) ? (
          <View style={styles.setupCard}>
            <LinearGradient colors={['#FFFFFF', '#FFF0F5']} style={styles.setupGradient}>
              <Ionicons name="rocket-outline" size={32} color="#FF6B6B" style={{ marginBottom: 16 }} />
              <Text style={styles.setupTitle}>Ready to Start?</Text>
              <Text style={styles.setupSub}>Your AI morning and evening training programs are ready to be generated for your current metrics.</Text>
              <TouchableOpacity style={[styles.setupBtn, isGenerating && { opacity: 0.6 }]} onPress={handleSyncAIPlan} disabled={isGenerating}>
                <Text style={styles.setupBtnText}>{isGenerating ? "Syncing AI..." : "Sync AI Program"}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : null}

        {/* Dynamic Plans in Grid */}
        {processedPlans.length > 0 ? (
          <View style={styles.webPlansRow}>
            {processedPlans.map((plan, index) => (
              <View key={index} style={styles.webPlanCardWrapper}>
                <View style={styles.heroCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.heroTitle}>
                        {(!plan.sessions || plan.sessions.length === 0) ? "COACH ASSIGNED" : (plan.trainingType ? plan.trainingType.toUpperCase() : "TRAINING")}
                      </Text>
                      {(!plan.sessions || plan.sessions.length === 0) && (
                        <View style={{ marginLeft: 8, backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                           <Ionicons name="shield-checkmark" size={10} color="#38BDF8" />
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => handleDeletePlan(plan)}>
                      <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600', cursor: 'pointer' }}>Remove</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>WORKOUT DETAILS</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Time</Text>
                      <Text style={[styles.detailValue, {textTransform: 'capitalize'}]}>{plan.sessionSlot || "--"}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Intensity</Text>
                      <Text style={styles.detailValue}>{plan.intensity || "--"}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Pace / Duration</Text>
                      <Text style={styles.detailValue}>{plan.duration || "--"}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={1}>Distance / Work</Text>
                      <Text style={[styles.detailValue, {flexShrink: 1, textAlign: 'right', marginLeft: 10}]}>{plan.mainWork || "--"}</Text>
                    </View>
                  </View>

                  {activeSession ? (
                    <TouchableOpacity style={[styles.stopButton, { cursor: 'pointer' }]} onPress={handleEndSession}>
                      <Text style={styles.stopButtonText}>End Session</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.startButton, { cursor: 'pointer' }]} onPress={() => handleStartSession(plan)}>
                      <Text style={styles.startButtonText}>Start Live Session</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          processedPlans.length === 0 && hasHR && !isNightWindow && !hasCompletedToday && (
            <View style={[styles.heroCard, { width: '100%' }]}>
              <Text style={styles.cardTitle}>NO PLANS</Text>
              <Text style={styles.value}>You have no assigned training plans at the moment.</Text>
            </View>
          )
        )}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Training</Text>
            {trainingMode === 'coach' && (
              <Text style={{ color: '#38BDF8', fontSize: 10, fontWeight: '700' }}>
                COACH AS ATHLETE | {plans.length} PLANS FOUND
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => router.push("/athlete/home")}>
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
        </View>

        {/* Night Registry / Onboarding Guard UI */}
        {!hasHR ? (
          <View style={styles.setupCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF0F5']}
              style={styles.setupGradient}
            >
              <Ionicons name="settings-outline" size={32} color="#FF6B6B" style={{ marginBottom: 16 }} />
              <Text style={styles.setupTitle}>Setup Required</Text>
              <Text style={styles.setupSub}>Please complete your Quick Setup on the Home dashboard to unlock AI training plans.</Text>
              <TouchableOpacity 
                style={styles.setupBtn}
                onPress={() => router.push('/athlete/home')}
              >
                <Text style={styles.setupBtnText}>Go to Home</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (trainingMode === "self" && isNightWindow && (Array.isArray(plans) ? plans : []).length === 0) ? (
          <View style={styles.nightAlert}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF0F5']}
              style={styles.nightAlertGradient}
            >
              <View style={styles.nightAlertContent}>
                <View style={styles.nightAlertLeft}>
                  <Ionicons name="moon" size={24} color="#FF6B6B" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.nightAlertTitle}>Nightly Preparation</Text>
                    <Text style={styles.nightAlertSub}>AI morning session is being tuned.</Text>
                  </View>
                </View>
                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>{nightTimer}</Text>
                  <Text style={styles.timerLabel}>UNTIL 5 AM</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (trainingMode === "self" && hasCompletedToday) ? (
          <View style={styles.setupCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F0FFF4']}
              style={styles.setupGradient}
            >
              <Ionicons name="checkmark-done-circle" size={48} color="#22c55e" style={{ marginBottom: 16 }} />
              <Text style={styles.setupTitle}>Training Complete</Text>
              <Text style={styles.setupSub}>Great job today! Rest up and recover. Your next personalized AI plan will be mapped out tomorrow at 5 AM.</Text>
              <View style={[styles.timerContainer, { marginTop: 24, paddingVertical: 14, paddingHorizontal: 36, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
                <Text style={[styles.timerText, { color: '#22c55e' }]}>{completedTimer}</Text>
                <Text style={[styles.timerLabel, { color: '#22c55e' }]}>UNTIL 5 AM</Text>
              </View>
            </LinearGradient>
          </View>
        ) : (trainingMode === "self" && (Array.isArray(plans) ? plans : []).length === 0) ? (
          <View style={styles.setupCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF0F5']}
              style={styles.setupGradient}
            >
              <Ionicons name="rocket-outline" size={32} color="#FF6B6B" style={{ marginBottom: 16 }} />
              <Text style={styles.setupTitle}>Ready to Start?</Text>
              <Text style={styles.setupSub}>Your AI morning and evening training programs are ready to be generated for your current metrics.</Text>
              <TouchableOpacity 
                style={[styles.setupBtn, isGenerating && { opacity: 0.6 }]}
                onPress={handleSyncAIPlan}
                disabled={isGenerating}
              >
                <Text style={styles.setupBtnText}>{isGenerating ? "Syncing AI..." : "Sync AI Program"}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : null}

        {/* DYNAMIC PLANS */}
        { (Array.isArray(plans) ? plans : []).length > 0 ? (
          (() => {
            console.log("[Training] Current plans array:", plans);
            return (Array.isArray(plans) ? plans : []).flatMap((plan, pIndex) => {
              // New robust detection for coach-assigned sessions
              if (plan.sessions && plan.sessions.length > 0) {
                console.log("[Training] Processing planned sessions for:", plan._id);
                
                // 1. Try to find Morning/Evening (for AI Plan consistency)
                const morning = plan.sessions.find(s => s.sessionSlot?.toLowerCase() === 'morning');
                const evening = plan.sessions.find(s => s.sessionSlot?.toLowerCase() === 'evening');

                let nextSession = null;
                if (morning && (morning.status === 'pending' || morning.status === 'active')) {
                  nextSession = morning;
                } else if (evening && (evening.status === 'pending' || evening.status === 'active')) {
                  nextSession = evening;
                } else {
                  // 2. FALLBACK: Find the VERY FIRST pending/active session (For custom coach slots)
                  nextSession = plan.sessions.find(s => s.status === 'pending' || s.status === 'active');
                }

                if (!nextSession) {
                  console.log("[Training] No pending sessions found in plan:", plan._id);
                  return []; // All sessions completed/missed
                }

                return [{
                  ...plan,
                  trainingType: nextSession.trainingType || plan.trainingType || "COACH ASSIGNED",
                  sessionSlot: nextSession.sessionSlot || plan.sessionSlot || "Today",
                  mainWork: nextSession.mainWork || plan.mainWork || "--",
                  duration: nextSession.duration || plan.duration || "--",
                  intensity: nextSession.intensity || plan.intensity || "--",
                  currentSessionId: nextSession._id || nextSession.id
                }];
              }
              // 3. FLAT PLAN FALLBACK: (Simple coach plans without a sessions array)
              return [plan];
            });
          })().map((plan, index) => (
            <View key={index} style={{ marginBottom: 20 }}>
              <View style={styles.heroCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.heroTitle}>
                      {(!plan.sessions || plan.sessions.length === 0) ? "COACH ASSIGNED" : (plan.trainingType ? plan.trainingType.toUpperCase() : "TRAINING")}
                    </Text>
                    {(!plan.sessions || plan.sessions.length === 0) && (
                      <View style={{ marginLeft: 8, backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                         <Ionicons name="shield-checkmark" size={10} color="#38BDF8" />
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDeletePlan(plan)}>
                    <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>Remove</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>WORKOUT DETAILS</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={[styles.detailValue, {textTransform: 'capitalize'}]}>{plan.sessionSlot || "--"}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Intensity</Text>
                    <Text style={styles.detailValue}>{plan.intensity || "--"}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pace / Duration</Text>
                    <Text style={styles.detailValue}>{plan.duration || "--"}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel} numberOfLines={1}>Distance / Work</Text>
                    <Text style={[styles.detailValue, {flexShrink: 1, textAlign: 'right', marginLeft: 10}]}>{plan.mainWork || "--"}</Text>
                  </View>
                </View>

                {activeSession ? (
                  <TouchableOpacity style={styles.stopButton} onPress={handleEndSession}>
                    <Text style={styles.stopButtonText}>End Session</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.startButton} onPress={() => handleStartSession(plan)}>
                    <Text style={styles.startButtonText}>Start Live Session</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.heroCard}>
            <Text style={styles.cardTitle}>NO PLANS</Text>
            <Text style={styles.value}>You have no assigned training plans at the moment.</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 60,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
  },
  backText: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  heroLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 18,
  },

  startButton: {
    backgroundColor: "#38BDF8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  stopButton: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  stopButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },

  /* Cards */
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 16,
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "800",
  },

  label: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
  },
  value: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "800",
    marginTop: 2,
  },

  /* New Onboarding/Night Styles */
  setupCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  setupGradient: {
    padding: 24,
    alignItems: 'center',
  },
  setupTitle: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  setupSub: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: "500",
  },
  setupBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    cursor: "pointer",
  },
  setupBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  nightAlert: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  nightAlertGradient: {
    padding: 16,
  },
  nightAlertContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nightAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nightAlertTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
  },
  nightAlertSub: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
  timerText: {
    color: '#FF6B6B',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  timerLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },

  // Web Grid Styles
  webContainer: {
    width: '100%',
  },
  webPlansRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  webPlanCardWrapper: {
    flexBasis: 'calc(50% - 8px)',
    minWidth: 320,
    marginBottom: 0,
  },
});
