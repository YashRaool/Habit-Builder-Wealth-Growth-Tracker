const router = require('express').Router();
const { getAssets, getNetWorth, getHistory, createAsset, updateAsset, deleteAsset } = require('../controllers/wealthController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/net-worth', getNetWorth);
router.get('/history', getHistory);
router.get('/assets', getAssets);
router.post('/assets', createAsset);
router.put('/assets/:id', updateAsset);
router.delete('/assets/:id', deleteAsset);

module.exports = router;
