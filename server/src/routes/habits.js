const router = require('express').Router();
const {
  getHabits, getHabit, createHabit, updateHabit, deleteHabit, checkIn, getHistory,
} = require('../controllers/habitController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getHabits);
router.post('/', createHabit);
router.get('/:id', getHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/checkin', checkIn);
router.get('/:id/history', getHistory);

module.exports = router;
