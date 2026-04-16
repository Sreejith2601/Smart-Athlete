require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./src/models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findById("69cc058d6f26d16bca0a8b84").lean();
  fs.writeFileSync('user_out.json', JSON.stringify(user, null, 2), 'utf8');
  process.exit(0);
}

test();
