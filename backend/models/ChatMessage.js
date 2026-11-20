const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system messages
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    messageType: {
      type: String,
      enum: ['text', 'system', 'itinerary_card'],
      default: 'text',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // For itinerary card data, etc.
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient room message queries
chatMessageSchema.index({ roomId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
