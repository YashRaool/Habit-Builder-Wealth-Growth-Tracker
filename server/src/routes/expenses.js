const router = require('express').Router();
const {
  getExpenses,
  getExpensesSummary,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getExpenses);
router.get('/summary', getExpensesSummary);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
