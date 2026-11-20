const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Room = require('./models/Room');
const ChatMessage = require('./models/ChatMessage');
const GroupTripSession = require('./models/GroupTripSession');
const TripPreferenceResponse = require('./models/TripPreferenceResponse');
const Trip = require('./models/Trip');
const { generateTripFromParams } = require('./controllers/tripController');

// Track online users per room: Map<roomId, Set<userId>>
const roomOnlineUsers = new Map();

function normalizeUserId(value) {
  return value?._id?.toString?.() || value?.toString?.() || '';
}

function getOnlineUsers(roomId) {
  return roomOnlineUsers.get(roomId.toString()) || new Set();
}

function addOnlineUser(roomId, userId) {
  const key = roomId.toString();
  if (!roomOnlineUsers.has(key)) roomOnlineUsers.set(key, new Set());
  roomOnlineUsers.get(key).add(userId.toString());
}

function removeOnlineUser(roomId, userId) {
  const key = roomId.toString();
  const set = roomOnlineUsers.get(key);
  if (set) {
    set.delete(userId.toString());
    if (set.size === 0) roomOnlineUsers.delete(key);
  }
}

/**
 * Build vote tally from all responses for a session
 */
async function buildVoteTally(sessionId) {
  const responses = await TripPreferenceResponse.find({ sessionId }).populate('userId', 'name');
  const respondents = responses.map(r => ({
    userId: normalizeUserId(r.userId),
    name: r.userId.name,
    attending: r.attending !== false,
  }));
  const attendees = respondents.filter(r => r.attending);
  const notComing = respondents.filter(r => !r.attending);

  const tally = {
    respondents,
    attendees,
    notComing,
    respondentCount: responses.length,
    attendeeCount: attendees.length,
    attending: { true: attendees.length, false: notComing.length },
    // Category B tallies
    travellerType: {},
    pace: {},
    budgetTier: {},
    distanceRange: {},
    // Category C tallies
    preferences: {},
    mealPreference: {},
    tripVibe: {},
    // Category D tallies
    hasChildren: { true: 0, false: 0 },
    hasElderly: { true: 0, false: 0 },
    accessibilityNeeds: { true: 0, false: 0 },
    // Category E
    specialRequirements: [],
    // New Additions
    roomSharing: {},
    budgetFlexibility: {},
    mustAvoid: [],
  };

  for (const r of responses) {
    if (r.attending === false) continue;

    // B: single-select
    if (r.travellerType) tally.travellerType[r.travellerType] = (tally.travellerType[r.travellerType] || 0) + 1;
    if (r.pace) tally.pace[r.pace] = (tally.pace[r.pace] || 0) + 1;
    if (r.budgetTier) tally.budgetTier[r.budgetTier] = (tally.budgetTier[r.budgetTier] || 0) + 1;
    if (r.distanceRange) tally.distanceRange[r.distanceRange] = (tally.distanceRange[r.distanceRange] || 0) + 1;

    // C: multi-select
    (r.preferences || []).forEach(p => { tally.preferences[p] = (tally.preferences[p] || 0) + 1; });
    (r.mealPreference || []).forEach(m => { tally.mealPreference[m] = (tally.mealPreference[m] || 0) + 1; });
    (r.tripVibe || []).forEach(v => { tally.tripVibe[v] = (tally.tripVibe[v] || 0) + 1; });

    // D: booleans
    tally.hasChildren[r.hasChildren ? 'true' : 'false']++;
    tally.hasElderly[r.hasElderly ? 'true' : 'false']++;
    tally.accessibilityNeeds[r.accessibilityNeeds ? 'true' : 'false']++;

    // E: free text
    if (r.specialRequirements && r.specialRequirements.trim()) {
      tally.specialRequirements.push({ userId: normalizeUserId(r.userId), name: r.userId.name, text: r.specialRequirements.trim() });
    }
    
    // New fields
    if (r.roomSharing) tally.roomSharing[r.roomSharing] = (tally.roomSharing[r.roomSharing] || 0) + 1;
    if (r.budgetFlexibility) tally.budgetFlexibility[r.budgetFlexibility] = (tally.budgetFlexibility[r.budgetFlexibility] || 0) + 1;
    if (r.mustAvoid && r.mustAvoid.trim()) {
      tally.mustAvoid.push({ userId: normalizeUserId(r.userId), name: r.userId.name, text: r.mustAvoid.trim() });
    }
  }

  return tally;
}

/**
 * Aggregate votes into final parameters for generateTrip
 */
function aggregateVotes(session, responses, organizerId) {
  const votingResponses = responses.filter(r => r.attending !== false);
  const respondentCount = votingResponses.length;
  const tieBreakLog = [];

  // Helper: majority vote with organizer tie-break
  function majorityVote(field) {
    const counts = {};
    for (const r of votingResponses) {
      const val = r[field];
      if (val) counts[val] = (counts[val] || 0) + 1;
    }
    if (Object.keys(counts).length === 0) return '';

    const maxCount = Math.max(...Object.values(counts));
    const winners = Object.keys(counts).filter(k => counts[k] === maxCount);

    if (winners.length === 1) return winners[0];

    // Tie-break: use organizer's choice
    const organizerResponse = votingResponses.find(r => r.userId.toString() === organizerId.toString());
    const organizerPick = organizerResponse?.[field];
    if (organizerPick && winners.includes(organizerPick)) {
      tieBreakLog.push({
        field,
        tiedOptions: winners,
        winner: organizerPick,
        reason: 'Tie broken by organizer preference',
      });
      return organizerPick;
    }

    // Fallback: first alphabetically
    tieBreakLog.push({
      field,
      tiedOptions: winners,
      winner: winners[0],
      reason: 'Tie broken alphabetically (organizer had no pick)',
    });
    return winners[0];
  }

  // Helper: approval voting (>50% of respondents)
  function approvalVote(field) {
    const counts = {};
    for (const r of votingResponses) {
      const vals = r[field] || [];
      vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    }
    const threshold = respondentCount / 2;
    return Object.keys(counts).filter(k => counts[k] > threshold);
  }

  // Helper: any-yes-wins
  function anyYes(field) {
    return votingResponses.some(r => r[field] === true);
  }

  // Aggregate
  const aggregated = {
    // Category A — from logistics (not voted)
    source: session.logisticsData.source,
    destination: session.logisticsData.destination,
    travelMode: session.logisticsData.travelMode,
    startDate: session.logisticsData.startDate,
    endDate: session.logisticsData.endDate,
    days: session.logisticsData.days,
    people: respondentCount,

    // Category B — majority vote
    travellerType: majorityVote('travellerType'),
    pace: majorityVote('pace'),
    budget: majorityVote('budgetTier') || 'medium',
    distanceRange: majorityVote('distanceRange'),

    // Category C — approval voting
    preferences: approvalVote('preferences'),
    mealPreference: approvalVote('mealPreference'),
    tripVibe: approvalVote('tripVibe'),

    // Category D — any-yes-wins
    hasChildren: anyYes('hasChildren'),
    hasElderly: anyYes('hasElderly'),
    accessibilityNeeds: anyYes('accessibilityNeeds'),

    // Category E — concatenate
    specialRequirements: votingResponses
      .map(r => r.specialRequirements?.trim())
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i) // distinct
      .join('. '),
      
    // New Additions
    roomSharing: majorityVote('roomSharing'),
    budgetFlexibility: majorityVote('budgetFlexibility'),
    mustAvoid: votingResponses
      .map(r => r.mustAvoid?.trim())
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join('. '),
  };

  return { aggregated, tieBreakLog };
}

/**
 * Initialize Socket.io handlers
 */
module.exports = function initSocket(io) {
  // JWT authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user._id})`);

    // ── JOIN ROOM ───────────────────────────────────────────────────
    socket.on('join_room', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error_message', { message: 'Room not found' });

        const isMember = room.members.some(m => m.userId.toString() === socket.user._id.toString());
        if (!isMember) return socket.emit('error_message', { message: 'Not a member of this room' });

        socket.join(roomId);
        socket.currentRoomId = roomId;
        addOnlineUser(roomId, socket.user._id);

        // Broadcast updated online members
        const populated = await Room.findById(roomId).populate('members.userId', 'name email avatar');
        const onlineSet = getOnlineUsers(roomId);
        const memberList = populated.members.map(m => ({
          userId: m.userId._id.toString(),
          name: m.userId.name,
          avatar: m.userId.avatar,
          joinedAt: m.joinedAt,
          isOnline: onlineSet.has(m.userId._id.toString()),
        }));

        io.to(roomId).emit('member_list_update', { members: memberList });

        // System message
        const sysMsg = await ChatMessage.create({
          roomId,
          senderId: null,
          content: `${socket.user.name} joined the room`,
          messageType: 'system',
        });
        io.to(roomId).emit('chat_message', {
          _id: sysMsg._id,
          content: sysMsg.content,
          messageType: 'system',
          createdAt: sysMsg.createdAt,
        });

        // Check for active session
        const activeSession = await GroupTripSession.findOne({ roomId, status: 'collecting' });
        if (activeSession) {
          const tally = await buildVoteTally(activeSession._id);
          socket.emit('trip_form_opened', {
            sessionId: activeSession._id,
            triggeredBy: activeSession.triggeredBy,
            logisticsData: activeSession.logisticsData,
            responseDeadline: null,
            status: activeSession.status,
          });
          socket.emit('vote_tally_update', { sessionId: activeSession._id.toString(), tally });
        }

      } catch (err) {
        console.error('join_room error:', err);
        socket.emit('error_message', { message: 'Failed to join room' });
      }
    });

    // ── LEAVE ROOM ──────────────────────────────────────────────────
    socket.on('leave_room', async ({ roomId }) => {
      try {
        socket.leave(roomId);
        removeOnlineUser(roomId, socket.user._id);
        socket.currentRoomId = null;

        // Broadcast updated members
        const populated = await Room.findById(roomId).populate('members.userId', 'name email avatar');
        if (populated) {
          const onlineSet = getOnlineUsers(roomId);
          const memberList = populated.members.map(m => ({
            userId: m.userId._id.toString(),
            name: m.userId.name,
            avatar: m.userId.avatar,
            joinedAt: m.joinedAt,
            isOnline: onlineSet.has(m.userId._id.toString()),
          }));
          io.to(roomId).emit('member_list_update', { members: memberList });
        }

        // System message
        const sysMsg = await ChatMessage.create({
          roomId,
          senderId: null,
          content: `${socket.user.name} left the room`,
          messageType: 'system',
        });
        io.to(roomId).emit('chat_message', {
          _id: sysMsg._id,
          content: sysMsg.content,
          messageType: 'system',
          createdAt: sysMsg.createdAt,
        });
      } catch (err) {
        console.error('leave_room error:', err);
      }
    });

    // ── CHAT MESSAGE ────────────────────────────────────────────────
    socket.on('chat_message', async ({ roomId, content }) => {
      try {
        if (!content || !content.trim()) return;
        const msg = await ChatMessage.create({
          roomId,
          senderId: socket.user._id,
          content: content.trim(),
          messageType: 'text',
        });
        io.to(roomId).emit('chat_message', {
          _id: msg._id,
          senderId: socket.user._id.toString(),
          senderName: socket.user.name,
          senderAvatar: socket.user.avatar,
          content: msg.content,
          messageType: 'text',
          createdAt: msg.createdAt,
        });
      } catch (err) {
        console.error('chat_message error:', err);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });

    // ── GENERATE TRIP GROUP (start a session) ───────────────────────
    socket.on('generate_trip_group', async ({ roomId, logisticsData }) => {
      try {
        // Check for existing active session
        const existing = await GroupTripSession.findOne({ roomId, status: 'collecting' });
        if (existing) {
          return socket.emit('error_message', { message: 'A group trip session is already active in this room.' });
        }

        // Validate logistics
        const { source, destination, travelMode, days } = logisticsData;
        if (!source || !destination || !travelMode || !days) {
          return socket.emit('error_message', { message: 'Please fill in all required logistics fields.' });
        }

        const session = await GroupTripSession.create({
          roomId,
          triggeredBy: socket.user._id,
          logisticsData,
          responseDeadline: null,
        });

        // System message
        const sysMsg = await ChatMessage.create({
          roomId,
          senderId: null,
          content: `${socket.user.name} started a group trip vote! Fill in your preferences now.`,
          messageType: 'system',
        });
        io.to(roomId).emit('chat_message', {
          _id: sysMsg._id,
          content: sysMsg.content,
          messageType: 'system',
          createdAt: sysMsg.createdAt,
        });

        // Broadcast form opened to entire room
        io.to(roomId).emit('trip_form_opened', {
          sessionId: session._id,
          triggeredBy: socket.user._id,
          logisticsData: session.logisticsData,
          responseDeadline: null, // Timer removed
          status: 'collecting',
        });

      } catch (err) {
        console.error('generate_trip_group error:', err);
        socket.emit('error_message', { message: 'Failed to start group trip session.' });
      }
    });

    // ── SUBMIT PREFERENCE ───────────────────────────────────────────
    socket.on('submit_preference', async ({ sessionId, preferences }) => {
      try {
        const session = await GroupTripSession.findById(sessionId);
        if (!session || session.status !== 'collecting') {
          return socket.emit('error_message', { message: 'This session is no longer accepting responses.' });
        }

        // Upsert preference response
        await TripPreferenceResponse.findOneAndUpdate(
          { sessionId, userId: socket.user._id },
          {
            sessionId,
            userId: socket.user._id,
            ...preferences,
          },
          { upsert: true, new: true }
        );

        // Build and broadcast updated tally
        const tally = await buildVoteTally(sessionId);
        io.to(session.roomId.toString()).emit('vote_tally_update', { sessionId: sessionId.toString(), tally });

        // System message
        const sysMsg = await ChatMessage.create({
          roomId: session.roomId,
          senderId: null,
          content: `${socket.user.name} submitted their preferences`,
          messageType: 'system',
        });
        io.to(session.roomId.toString()).emit('chat_message', {
          _id: sysMsg._id,
          content: sysMsg.content,
          messageType: 'system',
          createdAt: sysMsg.createdAt,
        });

      } catch (err) {
        console.error('submit_preference error:', err);
        socket.emit('error_message', { message: 'Failed to submit preferences.' });
      }
    });

    // ── FINALIZE SESSION (manual early close by organizer) ──────────
    socket.on('finalize_session', async ({ sessionId }) => {
      try {
        const session = await GroupTripSession.findById(sessionId);
        if (!session || session.status !== 'collecting') {
          return socket.emit('error_message', { message: 'Session is not active.' });
        }

        // Allow any user to finalize IF the organizer is offline
        const isOrganizer = session.triggeredBy.toString() === socket.user._id.toString();
        
        if (!isOrganizer) {
          const onlineUsers = getOnlineUsers(session.roomId.toString());
          if (onlineUsers.has(session.triggeredBy.toString())) {
            return socket.emit('error_message', { message: 'Only the session organizer can finalize because they are currently online.' });
          }
          // If we reach here, organizer is offline, so let this user finalize it
        }

        await finalizeSession(io, sessionId, session.roomId.toString());
      } catch (err) {
        console.error('finalize_session error:', err);
        socket.emit('error_message', { message: 'Failed to finalize session.' });
      }
    });

    // ── CANCEL SESSION ──────────────────────────────────────────────
    socket.on('cancel_session', async ({ sessionId }) => {
      try {
        const session = await GroupTripSession.findById(sessionId);
        if (!session || session.status !== 'collecting') return;

        const isOrganizer = session.triggeredBy.toString() === socket.user._id.toString();
        if (!isOrganizer) {
          const onlineUsers = getOnlineUsers(session.roomId.toString());
          if (onlineUsers.has(session.triggeredBy.toString())) {
            return socket.emit('error_message', { message: 'Only the host can dismiss this vote while they are online.' });
          }
        }

        session.status = 'cancelled';
        await session.save();

        const sysMsg = await ChatMessage.create({
          roomId: session.roomId,
          senderId: null,
          content: `${socket.user.name} cancelled the group trip session.`,
          messageType: 'system',
        });
        io.to(session.roomId.toString()).emit('chat_message', {
          _id: sysMsg._id,
          content: sysMsg.content,
          messageType: 'system',
          createdAt: sysMsg.createdAt,
        });
        io.to(session.roomId.toString()).emit('session_cancelled', { sessionId: sessionId.toString() });
      } catch (err) {
        console.error('cancel_session error:', err);
      }
    });

    // ── DISCONNECT ──────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
      if (socket.currentRoomId) {
        const roomId = socket.currentRoomId;
        removeOnlineUser(roomId, socket.user._id);

        try {
          const populated = await Room.findById(roomId).populate('members.userId', 'name email avatar');
          if (populated) {
            const onlineSet = getOnlineUsers(roomId);
            const memberList = populated.members.map(m => ({
              userId: m.userId._id.toString(),
              name: m.userId.name,
              avatar: m.userId.avatar,
              joinedAt: m.joinedAt,
              isOnline: onlineSet.has(m.userId._id.toString()),
            }));
            io.to(roomId).emit('member_list_update', { members: memberList });
          }
        } catch (err) {
          console.error('disconnect cleanup error:', err);
        }
      }
    });
  });
};

/**
 * Finalize a group trip session: aggregate votes, call generateTrip, save, broadcast
 */
async function finalizeSession(io, sessionId, roomId) {
  try {
    const session = await GroupTripSession.findById(sessionId);
    if (!session || session.status !== 'collecting') return;

    const responses = await TripPreferenceResponse.find({ sessionId });

    if (responses.length === 0) {
      session.status = 'cancelled';
      await session.save();
      const sysMsg = await ChatMessage.create({
        roomId,
        senderId: null,
        content: 'Group trip session cancelled — no responses received.',
        messageType: 'system',
      });
      io.to(roomId).emit('chat_message', {
        _id: sysMsg._id, content: sysMsg.content, messageType: 'system', createdAt: sysMsg.createdAt,
      });
      io.to(roomId).emit('session_cancelled', { sessionId: sessionId.toString() });
      return;
    }

    const attendeeCount = responses.filter(r => r.attending !== false).length;
    if (attendeeCount === 0) {
      io.to(roomId).emit('session_error', {
        sessionId: sessionId.toString(),
        message: 'At least one person must choose "I am coming" before generating the trip.',
      });
      return;
    }

    // Notify room that finalization is in progress
    io.to(roomId).emit('session_finalizing', { sessionId: sessionId.toString() });

    const sysMsg1 = await ChatMessage.create({
      roomId,
      senderId: null,
      content: `Finalizing group trip with ${responses.length} response(s)... AI is generating your itinerary! 🚀`,
      messageType: 'system',
    });
    io.to(roomId).emit('chat_message', {
      _id: sysMsg1._id, content: sysMsg1.content, messageType: 'system', createdAt: sysMsg1.createdAt,
    });

    // Aggregate
    const { aggregated, tieBreakLog } = aggregateVotes(session, responses, session.triggeredBy);

    // Resolve pace
    const resolvedPace = aggregated.pace === 'auto' ? '' : aggregated.pace;

    // Build payload matching generateTrip's expected shape
    const payload = {
      source: aggregated.source,
      destination: aggregated.destination,
      travelMode: aggregated.travelMode,
      budget: aggregated.budget,
      days: Number(aggregated.days),
      people: Number(aggregated.people),
      travellerType: aggregated.travellerType,
      preferences: aggregated.preferences,
      mealPreference: aggregated.mealPreference,
      pace: resolvedPace,
      tripVibe: aggregated.tripVibe,
      distanceRange: aggregated.distanceRange,
      hasChildren: aggregated.hasChildren,
      hasElderly: aggregated.hasElderly,
      accessibilityNeeds: aggregated.accessibilityNeeds,
      startDate: aggregated.startDate,
      endDate: aggregated.endDate,
      specialRequirements: aggregated.specialRequirements,
      roomSharing: aggregated.roomSharing,
      budgetFlexibility: aggregated.budgetFlexibility,
      mustAvoid: aggregated.mustAvoid,
    };

    // Call the existing generateTrip logic
    const result = await generateTripFromParams(payload);

    if (!result.success) {
      const errMsg = await ChatMessage.create({
        roomId,
        senderId: null,
        content: `Failed to generate itinerary: ${result.message}`,
        messageType: 'system',
      });
      io.to(roomId).emit('chat_message', {
        _id: errMsg._id, content: errMsg.content, messageType: 'system', createdAt: errMsg.createdAt,
      });
      // Don't cancel session, allow retry
      io.to(roomId).emit('session_error', { sessionId: sessionId.toString(), message: result.message });
      return;
    }

    // Save trip with group references — save for the organizer, but visible to all room members
    const title = result.itinerary?.tripSummary?.title || `${payload.destination} - ${payload.days} Days Group Trip`;
    const trip = await Trip.create({
      userId: session.triggeredBy,
      title,
      tripDetails: {
        ...payload,
        budget: result.itinerary?.budgetBreakdown?.totalEstimated || 0,
      },
      itinerary: result.itinerary,
      rawResponse: '',
      isGroupTrip: true,
      roomId,
      groupSessionId: sessionId,
    });

    // Also save a reference for all other room members
    const room = await Room.findById(roomId);
    if (room) {
      const otherMembers = room.members
        .filter(m => m.userId.toString() !== session.triggeredBy.toString());
      for (const member of otherMembers) {
        await Trip.create({
          userId: member.userId,
          title,
          tripDetails: {
            ...payload,
            budget: result.itinerary?.budgetBreakdown?.totalEstimated || 0,
          },
          itinerary: result.itinerary,
          rawResponse: '',
          isGroupTrip: true,
          roomId,
          groupSessionId: sessionId,
        });
      }
    }

    // Update session
    session.status = 'finalized';
    session.finalizedAt = new Date();
    session.aggregatedPreferences = aggregated;
    session.tieBreakLog = tieBreakLog;
    session.resultTripId = trip._id;
    await session.save();

    // No longer posting itinerary card to chat, as requested by user.
    // Result will only be displayed in the right panel.

    // Broadcast session finalized
    io.to(roomId).emit('session_finalized', {
      sessionId: sessionId.toString(),
      tripId: trip._id.toString(),
      itinerary: result.itinerary,
      tripDetails: result.tripDetails,
      tieBreakLog,
    });

  } catch (err) {
    console.error('finalizeSession error:', err);
    const errMsg = await ChatMessage.create({
      roomId,
      senderId: null,
      content: 'An error occurred while generating the itinerary. Please try again.',
      messageType: 'system',
    });
    io.to(roomId).emit('chat_message', {
      _id: errMsg._id, content: errMsg.content, messageType: 'system', createdAt: errMsg.createdAt,
    });
    io.to(roomId).emit('session_error', { sessionId: sessionId.toString(), message: 'Internal error' });
  }
}
