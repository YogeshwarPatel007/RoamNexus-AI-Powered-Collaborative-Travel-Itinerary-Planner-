const Room = require('../models/Room');
const User = require('../models/User');
const Trip = require('../models/Trip');

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 * @access  Private
 */
const createRoom = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Room name must be at least 2 characters.' });
    }

    const code = await Room.generateCode();

    const room = await Room.create({
      name: name.trim(),
      code,
      createdBy: req.user._id,
      members: [{ userId: req.user._id }],
    });

    res.status(201).json({
      success: true,
      message: 'Room created!',
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        members: [{ userId: req.user._id, name: req.user.name, joinedAt: room.members[0].joinedAt }],
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/rooms/join
 * @desc    Join a room via code
 * @access  Private
 */
const joinRoom = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || code.trim().length !== 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-character room code.' });
    }

    const room = await Room.findOne({ code: code.trim().toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'No room found with this code.' });
    }

    // Check if already a member
    const alreadyMember = room.members.some(m => m.userId.toString() === req.user._id.toString());
    if (!alreadyMember) {
      room.members.push({ userId: req.user._id });
      await room.save();
    }

    // Populate members for response
    const populated = await Room.findById(room._id).populate('members.userId', 'name email avatar');

    res.json({
      success: true,
      message: alreadyMember ? 'Welcome back to the room!' : 'Joined room successfully!',
      room: {
        id: populated._id,
        name: populated.name,
        code: populated.code,
        members: populated.members.map(m => ({
          userId: m.userId._id,
          name: m.userId.name,
          avatar: m.userId.avatar,
          joinedAt: m.joinedAt,
        })),
        createdAt: populated.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rooms/:id
 * @desc    Get room details + members
 * @access  Private (must be a member)
 */
const getRoomDetails = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('members.userId', 'name email avatar');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // Verify membership
    const isMember = room.members.some(m => m.userId._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this room.' });
    }

    res.json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        createdBy: room.createdBy,
        members: room.members.map(m => ({
          userId: m.userId._id,
          name: m.userId.name,
          avatar: m.userId.avatar,
          joinedAt: m.joinedAt,
        })),
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rooms/:id/history
 * @desc    Get past group itineraries for this room
 * @access  Private (must be a member)
 */
const getRoomHistory = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const isMember = room.members.some(m => m.userId.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this room.' });
    }

    const trips = await Trip.find({ roomId: room._id, isGroupTrip: true })
      .sort({ createdAt: -1 })
      .select('-rawResponse');

    res.json({ success: true, count: trips.length, trips });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rooms/my/list
 * @desc    Get all rooms the current user is a member of
 * @access  Private
 */
const getMyRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ 'members.userId': req.user._id })
      .populate('members.userId', 'name avatar')
      .sort({ updatedAt: -1 });

    const formatted = rooms.map(room => ({
      id: room._id,
      name: room.name,
      code: room.code,
      memberCount: room.members.length,
      members: room.members.slice(0, 5).map(m => ({
        userId: m.userId._id,
        name: m.userId.name,
        avatar: m.userId.avatar,
      })),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));

    res.json({ success: true, count: formatted.length, rooms: formatted });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRoom, joinRoom, getRoomDetails, getRoomHistory, getMyRooms };
