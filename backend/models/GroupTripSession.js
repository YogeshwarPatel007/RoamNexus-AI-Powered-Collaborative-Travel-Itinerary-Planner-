const mongoose = require('mongoose');

const groupTripSessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['collecting', 'finalized', 'cancelled'],
      default: 'collecting',
    },
    logisticsData: {
      source: { type: String, default: '' },
      destination: { type: String, default: '' },
      travelMode: {
        type: String,
        enum: ['flight', 'train', 'bus', 'car', ''],
        default: '',
      },
      startDate: { type: String, default: '' },
      endDate: { type: String, default: '' },
      days: { type: Number, default: 0 },
      people: { type: Number, default: 0 },
    },
    responseDeadline: {
      type: Date,
      default: null,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
    aggregatedPreferences: {
      type: mongoose.Schema.Types.Mixed, // Stored after finalization
      default: null,
    },
    tieBreakLog: [
      {
        field: String,
        tiedOptions: [String],
        winner: String,
        reason: String,
      },
    ],
    resultTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GroupTripSession', groupTripSessionSchema);
