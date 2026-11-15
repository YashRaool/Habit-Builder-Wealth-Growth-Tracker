const router = require('express').Router();
const { getGoals, getGoal, createGoal, updateGoal, deleteGoal, contribute } = require('../controllers/goalController');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/security');

router.use(protect);
router.param('id', validateObjectId);
router.get('/', getGoals);
router.post('/', createGoal);
router.get('/:id', getGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/contribute', contribute);

module.exports = router;
