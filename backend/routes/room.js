const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  createRoom,
  joinRoom,
  getRoomDetails,
  getRoomHistory,
  getMyRooms,
} = require('../controllers/roomController');

const router = express.Router();

// All room routes require authentication
router.use(authMiddleware);

router.post('/', createRoom);
router.post('/join', joinRoom);
router.get('/my/list', getMyRooms);
router.get('/:id', getRoomDetails);
router.get('/:id/history', getRoomHistory);

module.exports = router;
