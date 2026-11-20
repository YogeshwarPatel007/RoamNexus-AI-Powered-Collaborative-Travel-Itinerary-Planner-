const mongoose = require('mongoose');

const tripPreferenceResponseSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupTripSession',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attending: {
      type: Boolean,
      default: true,
    },

    // Category B — single-select, majority vote
    travellerType: {
      type: String,
      enum: ['solo', 'couple', 'family', 'friends', 'business', ''],
      default: '',
    },
    pace: {
      type: String,
      enum: ['auto', 'relaxed', 'moderate', 'packed', ''],
      default: '',
    },
    budgetTier: {
      type: String,
      enum: ['minimum', 'medium', 'luxury', 'ultra', ''],
      default: '',
    },
    distanceRange: {
      type: String,
      default: '',
    },

    // Category C — multi-select, approval voting
    preferences: [{ type: String }],
    mealPreference: [{ type: String }],
    tripVibe: [{ type: String }],

    // Category D — boolean, any-yes-wins
    hasChildren: {
      type: Boolean,
      default: false,
    },
    hasElderly: {
      type: Boolean,
      default: false,
    },
    accessibilityNeeds: {
      type: Boolean,
      default: false,
    },

    // Category E — free text, concatenate
    specialRequirements: {
      type: String,
      default: '',
      maxlength: [500, 'Special requirements cannot exceed 500 characters'],
    },
    
    // New Group-Specific Additions
    roomSharing: {
      type: String,
      enum: ['same-gender', 'no-preference', 'private-room', ''],
      default: '',
    },
    budgetFlexibility: {
      type: String,
      enum: ['strict', 'flexible', ''],
      default: '',
    },
    mustAvoid: {
      type: String,
      default: '',
      maxlength: [500, 'Must-avoid list cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one response per user per session (upsert on resubmit)
tripPreferenceResponseSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('TripPreferenceResponse', tripPreferenceResponseSchema);
