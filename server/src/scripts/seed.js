import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

const email = process.env.SEED_EMAIL || 'test@dobbyads.com';
const password = process.env.SEED_PASSWORD || 'Passw0rd!';
const name = process.env.SEED_NAME || 'Test User';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, password });
    console.log('Created user:', email);
  } else {
    console.log('User already exists:', email);
  }
  await mongoose.disconnect();
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
