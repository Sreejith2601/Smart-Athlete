const fs = require('fs');

const file = fs.readFileSync('app/athlete/home.js', 'utf8');
const lines = file.split('\n');

// Keep logic lines exactly 0 to 313
const topLines = lines.slice(0, 313).join('\n');

const bottomJSX = `
  return (
    <LinearGradient colors={["#0F172A", "#020617"]} style={{ flex: 1 }}>
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
              <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.modalGradient}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={styles.welcomeIconContainer}>
                    <Ionicons name="sparkles" size={32} color="#b7ff3c" />
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
                  <LinearGradient colors={['#b7ff3c', '#8bd12a']} style={styles.setupCompleteGradient}>
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
            style={[styles.premiumCard, { borderColor: 'rgba(183, 255, 60, 0.4)', borderStyle: 'dashed' }]}
            onPress={() => setShowQuickSetup(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={24} color="#b7ff3c" />
              <Text style={[styles.cardHeading, { color: '#b7ff3c', marginLeft: 8 }]}>Finish Setup Required</Text>
            </View>
            <Text style={[styles.cardSubText, { marginTop: 8 }]}>
              Tap to enter your vitals and unlock your personalized AI training plans.
            </Text>
          </TouchableOpacity>
        )}

        {/* 2. Today's Workout Hero Card */}
        <View style={styles.heroCard}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => todayWorkout && router.push('/athlete/training-overview')}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroTitle}>Today's Workout</Text>
              <Ionicons name="walk-outline" size={20} color="#b7ff3c" />
            </View>

            <Text style={styles.workoutTypeActive}>
              {todayWorkout ? (todayWorkout.trainingType || "General Training").toUpperCase() : "ACTIVE RECOVERY RUN"}
            </Text>

            <View style={styles.workoutRow}>
              <View style={styles.workoutDetails}>
                <View style={styles.detailGroup}>
                  <Text style={styles.detailLabel}>DISTANCE</Text>
                  <Text style={styles.detailValue}>
                    {todayWorkout && todayWorkout.duration ? todayWorkout.duration : "12.4"} <Text style={styles.detailUnit}>km</Text>
                  </Text>
                </View>
                <View style={styles.detailGroup}>
                  <Text style={styles.detailLabel}>AVG PACE</Text>
                  <Text style={styles.detailValue}>
                    {todayWorkout && todayWorkout.intensity ? todayWorkout.intensity : "4:15"} <Text style={styles.detailUnit}>/km</Text>
                  </Text>
                </View>
                <View style={[styles.detailGroup, { marginTop: 16 }]}>
                  <Text style={styles.detailLabel}>DURATION</Text>
                  <Text style={styles.detailValue}>
                    {todayWorkout && todayWorkout.duration ? todayWorkout.duration : "52:48"}
                  </Text>
                </View>
              </View>

              <View style={styles.mapMapContainer}>
                 <View style={styles.abstractMapPath}>
                   <Ionicons name="navigate" size={36} color="#b7ff3c" style={{transform:[{rotate:'45deg'}]}} />
                 </View>
                 <View style={styles.mapFooter}>
                   <Text style={{color:'#64748B', fontSize:9}}>{todayWorkout ? \`\${todayWorkout.duration} | \${todayWorkout.intensity}\` : '52:48 | 12.4 km | 4:15 /km'}</Text>
                 </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* CPI PERFORMANCE SCORE */}
          <View style={styles.metricSquare}>
             <View style={styles.metricTop}>
                <Text style={styles.metricLabelLine}>CPI</Text>
                <Text style={styles.metricLabelLine}>PERFORMANCE</Text>
                <Text style={styles.metricLabelLine}>SCORE</Text>
                <Ionicons name="bar-chart" size={16} color="#b7ff3c" style={{position:'absolute', right:0, top:0}} />
             </View>
             <Text style={styles.metricValueLarge}>{cpiLoading ? "..." : (cpiData && cpiData.cpi !== 0 ? cpiData.cpi : "184")}</Text>
             <Text style={styles.metricTrendUp}>↑ 4.2%</Text>
             <View style={[styles.miniProgressBar, { marginTop: 4 }]}>
               <View style={[styles.miniProgressFill, { width: '70%', backgroundColor: '#b7ff3c' }]} />
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
               <View style={[styles.miniProgressFill, { width: \`\${(lastFatigue || 6)*10}%\`, backgroundColor: '#eab308' }]} />
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
                            key={\`line-\${i}\`}
                            style={{
                              position: 'absolute',
                              left: p.x + dx/2 - dist/2,
                              top: p.y + dy/2,
                              width: dist,
                              height: 3,
                              backgroundColor: '#06b6d4',
                              opacity: 0.8,
                              transform: [{ rotate: \`\${angle}deg\` }],
                              shadowColor: '#06b6d4', shadowRadius: 10, shadowOpacity: 1, elevation: 5
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
                           <View key={\`pt-\${i}\`} style={{ position:'absolute', left: p.x - ptSize/2, top: p.y - ptSize/2}}>
                              <View style={{
                                 width: ptSize, height: ptSize, borderRadius: ptSize/2, 
                                 backgroundColor: isLatest ? '#020617' : '#06b6d4',
                                 borderWidth: 2, borderColor: '#06b6d4',
                                 shadowColor: '#06b6d4', shadowRadius: 8, shadowOpacity: 1
                              }} />
                              
                              <Text style={{ position:'absolute', bottom:10, left: -15, width:30, textAlign:'center', color: isLatest ? '#06b6d4' : '#E2E8F0', fontSize:10, fontWeight:'700'}}>
                                 {Math.round(p.cpi)}
                              </Text>

                              {(isLatest || isStart) && (
                                <Text style={{ position:'absolute', top: height - p.y + 10, left: -20, width: 40, textAlign:'center', color: '#64748B', fontSize:9 }}>
                                   {(() => {
                                     const d = new Date(p.date); return \`\${months[d.getMonth()]} \${d.getDate()}\`;
                                   })()}
                                </Text>
                              )}
                           </View>
                         );
                      })}
                      
                      {/* Gradient glow mockup */}
                      <LinearGradient
                        colors={['rgba(6,182,212,0.1)', 'transparent']}
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
  profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#b7ff3c', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  profileLetter: { color: '#020617', fontSize: 18, fontWeight: '800' },
  greetingSub: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  greetingMain: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // Hero Card
  heroCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  heroTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  workoutTypeActive: { color: '#06b6d4', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  workoutRow: { flexDirection: 'row', justifyContent: 'space-between' },
  workoutDetails: { flex: 1 },
  detailGroup: { marginBottom: 12 },
  detailLabel: { color: '#94A3B8', fontSize: 10, letterSpacing: 1, fontWeight: '600', marginBottom: 2 },
  detailValue: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  detailUnit: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  mapMapContainer: { width: 100, height: 100, backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', padding: 4 },
  abstractMapPath: { flex: 1, borderWidth: 2, borderColor: '#b7ff3c', borderRadius: 12, margin: 8, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  mapFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(2,6,23,0.8)', padding: 4, alignItems: 'center' },

  // Metrics Grid
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  metricSquare: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(183, 255, 60, 0.3)', minHeight: 120 },
  metricTop: { position: 'relative', marginBottom: 16 },
  metricLabelLine: { color: '#94A3B8', fontSize: 9, fontWeight: '600', letterSpacing: 0.5, lineHeight: 12 },
  metricValueLarge: { color: '#F8FAFC', fontSize: 24, fontWeight: '800' },
  metricUnit: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
  metricTrendUp: { color: '#b7ff3c', fontSize: 11, fontWeight: '700', marginTop: 2 },
  miniProgressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  miniProgressFill: { height: '100%', borderRadius: 2 },

  // Trend Chart
  trendCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeading: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', letterSpacing: 1, textTransform:'uppercase' },
  chartArea: { width: '100%', alignItems: 'center' },
  placeholderBox: { height: 100, alignItems: 'center', justifyContent: 'center' },

  // Abstract Globals
  cardSubText: { color: '#94A3B8', fontSize: 13, lineHeight: 20 },
  premiumCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionPill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  actionPillText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600' },

  // Modal legacy styles updated for darker aesthetic
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.95)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(183, 255, 60, 0.4)', shadowColor: '#b7ff3c', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 30 },
  modalGradient: { padding: 24 },
  welcomeIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(183, 255, 60, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcomeTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  welcomeSubtitle: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 4 },
  welcomeInstructionBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, marginBottom: 24, marginTop: 10, borderLeftWidth: 3, borderLeftColor: '#b7ff3c' },
  instructionText: { color: '#E2E8F0', fontSize: 13, lineHeight: 18 },
  formGroup: { marginBottom: 20 },
  modalLabel: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inputHint: { color: '#64748b', fontSize: 11, marginTop: 6 },
  fitnessToggle: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  levelBtnActive: { backgroundColor: 'rgba(183, 255, 60, 0.1)', borderColor: '#b7ff3c' },
  levelText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  levelTextActive: { color: '#b7ff3c' },
  setupCompleteBtn: { marginTop: 10, borderRadius: 14, overflow: 'hidden' },
  setupCompleteGradient: { paddingVertical: 16, alignItems: 'center' },
  setupCompleteText: { color: '#020617', fontWeight: '800', fontSize: 16 },
  modalError: { color: '#ef4444', textAlign: 'center', marginTop: 12, fontSize: 13 },
});
`;

fs.writeFileSync('app/athlete/home.js', topLines + '\\n' + bottomJSX, 'utf8');
console.log('Successfully re-wrote home.js UI layout!');
