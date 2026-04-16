const mongoose = require('mongoose');
require('dotenv').config();
const { generateDailyPlan } = require('./src/services/training/orchestrator.service');

async function testAI() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartathlete";
    await mongoose.connect(mongoUri);

    console.log("Connected to MongoDB.");

    const payload = {
      event: "5000m",
      level: "beginner",
      startDate: new Date().toISOString(),
      raceTime: 20.0,
      raceDistance: 5000,
      mlFeatures: {
        fatigue_level: 5,
        rpe_avg: 5,
        hr_lthr_ratio: 0.8,
        weekly_volume_km: 20,
        volume_trend: 1.0,
        chronic_load: 100,
        acute_load: 100,
        load_ratio: 1.0,
        cpi: 80
      }
    };

    console.log("Generating plan...");
    const plan = await generateDailyPlan(payload);
    console.log(JSON.stringify(plan, null, 2));

  } catch (err) {
    console.error("GENERATION ERROR:", err);
  } finally {
    mongoose.connection.close();
  }
}

testAI();
