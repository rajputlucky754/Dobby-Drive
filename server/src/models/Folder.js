import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  path: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

folderSchema.index({ name: 1, user: 1, parent: 1 }, { unique: true });

export default mongoose.model('Folder', folderSchema);
