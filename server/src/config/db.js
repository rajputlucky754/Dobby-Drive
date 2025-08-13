import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI in env');
  process.exit(1);
}

mongoose.connect(uri, {
  autoIndex: true
}).then(() => {
  console.log('Mongo connected');
}).catch(err => {
  console.error('Mongo connection error:', err.message);
  process.exit(1);
});
