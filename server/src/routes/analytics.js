const router = require('express').Router();
const { getNetWorthHistory, getBreakdown } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/net-worth-history', getNetWorthHistory);
router.get('/breakdown', getBreakdown);

module.exports = router;
