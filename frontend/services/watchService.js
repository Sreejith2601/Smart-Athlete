// watchService.js
/*
// Disabled for Expo Go Compatibility:
import {
  initialize,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';
*/

// Mock functions to prevent ReferenceErrors and instantly default to 'Denied' logic paths:
const initialize = async () => false;
const requestPermission = async () => false;
const readRecords = async () => ({ records: [] });
// This service will handle Health Connect integration

const watchService = {

  initialize: async () => {
  try {
    const isInitialized = await initialize();

    if (isInitialized) {
      console.log("Health Connect initialized successfully");
    } else {
      console.log("Health Connect not available");
    }

    return isInitialized;

  } catch (error) {
    console.log("Initialization Error:", error);
    return false;
  }
},

  requestPermissions: async () => {
  try {
    const permissions = [
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'Steps' },
    ];

    const granted = await requestPermission(permissions);

    console.log("Permissions granted:", granted);

    return granted;

  } catch (error) {
    console.log("Permission Error:", error);
    return false;
  }
},

  getHeartRate: async () => {
  try {
    console.log("Fetching heart rate...");

    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // last 1 hour

    const result = await readRecords('HeartRate', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
      },
    });

    if (result.records.length === 0) {
      console.log("No heart rate data found");
      return null;
    }

    // Get latest record
    const latest = result.records[result.records.length - 1];

    const heartRate = latest.samples?.[0]?.beatsPerMinute;

    console.log("Heart Rate:", heartRate);

    return heartRate || null;

  } catch (error) {
    console.log("Heart Rate Error:", error);
    return null;
  }
},

  getHeartRateHistory: async (minutes = 35) => {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - minutes * 60 * 1000);

      const result = await readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
        },
      });

      return result.records;
    } catch (error) {
      console.error("getHeartRateHistory Error:", error);
      return [];
    }
  },

 getSteps: async () => {
  try {
    console.log("Fetching steps...");

    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // last 1 hour

    const result = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
      },
    });

    if (result.records.length === 0) {
      console.log("No step data found");
      return 0;
    }

    // Sum all steps
    const totalSteps = result.records.reduce((sum, record) => {
      return sum + (record.count || 0);
    }, 0);

    console.log("Steps:", totalSteps);

    return totalSteps;

  } catch (error) {
    console.log("Steps Error:", error);
    return 0;
  }
},
getWorkoutData: async () => {
  try {
    console.log("Getting full workout data...");

    // 1. Initialize
    const isInitialized = await watchService.initialize();
    if (!isInitialized) {
      return { status: "error", message: "Health Connect not available" };
    }

    // 2. Request permissions
    const permissionGranted = await watchService.requestPermissions();
    if (!permissionGranted) {
      return { status: "error", message: "Permission not granted" };
    }

    // 3. Fetch data
    const heartRate = await watchService.getHeartRate();
    const steps = await watchService.getSteps();

    console.log("=== WATCH DATA DEBUG ===");
    console.log("Heart Rate:", heartRate);
    console.log("Steps:", steps);

    // 4. Return structured response
    return {
      heartRate,
      steps,
      status: "success",
    };

  } catch (error) {
    console.log("Workout Data Error:", error);
    return {
      heartRate: null,
      steps: 0,
      status: "error",
    };
  }
},

  prepareOnboardingHRData: (rawRecords) => {

    if (!rawRecords || rawRecords.length === 0) return [];

    // 1. Flatten all samples from all records
    let allSamples = [];
    rawRecords.forEach(record => {
      if (record.samples) {
        record.samples.forEach(sample => {
          allSamples.push({
            timestamp: new Date(sample.time).getTime(),
            bpm: sample.beatsPerMinute
          });
        });
      }
    });

    if (allSamples.length === 0) return [];

    // 2. Sort by timestamp
    allSamples.sort((a, b) => a.timestamp - b.timestamp);

    // 3. Normalize time (time_sec)
    const firstTimestamp = allSamples[0].timestamp;
    let normalized = allSamples.map(s => ({
      time_sec: Math.round((s.timestamp - firstTimestamp) / 1000),
      bpm: s.bpm
    }));

    // 4. Filter for 30 minutes (0 to 1800 seconds)
    normalized = normalized.filter(s => s.time_sec >= 0 && s.time_sec <= 1800);

    // 5. Gap handling: Ensure every 10 seconds has a value (forward-fill)
    const processed = [];
    let currentIdx = 0;
    let lastKnownBpm = normalized[0].bpm;

    for (let t = 0; t <= 1800; t += 10) {
      // Find samples at or before this time
      while (currentIdx < normalized.length && normalized[currentIdx].time_sec <= t) {
        lastKnownBpm = normalized[currentIdx].bpm;
        currentIdx++;
      }
      processed.push({ time_sec: t, bpm: lastKnownBpm });
    }

    return processed;
  },
};


export default watchService;