require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const TrainingProgram = require('./src/models/TrainingProgram');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const plans = await TrainingProgram.find().sort({ createdAt: -1 }).limit(10).lean();
  fs.writeFileSync('output_utf8.json', JSON.stringify(plans, null, 2), 'utf8');
  process.exit(0);
}

test();
