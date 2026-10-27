const router = require('express').Router();
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deposit,
  deleteGoal,
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getGoals);
router.post('/', createGoal);
router.get('/:id', getGoal);
router.put('/:id', updateGoal);
router.patch('/:id/deposit', deposit);
router.post('/:id/contribute', deposit);
router.delete('/:id', deleteGoal);

module.exports = router;
