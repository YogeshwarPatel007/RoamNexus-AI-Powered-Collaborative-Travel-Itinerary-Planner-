const mongoose = require('mongoose');
const crypto = require('crypto');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      minlength: [2, 'Room name must be at least 2 characters'],
      maxlength: [50, 'Room name cannot exceed 50 characters'],
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Generate a unique 6-character alphanumeric room code.
 * Retries up to 10 times on collision.
 */
roomSchema.statics.generateCode = async function () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    const existing = await this.findOne({ code });
    if (!existing) return code;
  }
  throw new Error('Failed to generate unique room code after 10 attempts');
};

module.exports = mongoose.model('Room', roomSchema);
