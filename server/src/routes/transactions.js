const router = require('express').Router();
const {
  getTransactions, getSummary, getTransaction,
  createTransaction, updateTransaction, deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/summary', getSummary);
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
