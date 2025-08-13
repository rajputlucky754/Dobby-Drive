import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

imageSchema.index({ name: 'text' });

export default mongoose.model('Image', imageSchema);
