const Asset = require('../models/Asset');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendCreated, sendBadRequest, sendNotFound } = require('../utils/response');

/** GET /api/wealth/assets */
const getAssets = asyncHandler(async (req, res) => {
  const assets = await Asset.find({ userId: req.user._id }).sort('-valuation');
  sendSuccess(res, { assets });
});

/** GET /api/wealth/net-worth — current snapshot */
const getNetWorth = asyncHandler(async (req, res) => {
  const assets = await Asset.find({ userId: req.user._id });
  const totalValuation = assets.reduce((sum, a) => sum + a.valuation, 0);
  const totalInvested = assets.reduce((sum, a) => sum + a.investedAmount, 0);
  const totalReturn = totalInvested > 0
    ? (((totalValuation - totalInvested) / totalInvested) * 100).toFixed(2)
    : 0;

  const byType = assets.reduce((acc, a) => {
    acc[a.assetType] = (acc[a.assetType] || 0) + a.valuation;
    return acc;
  }, {});

  sendSuccess(res, { totalValuation, totalInvested, totalReturn, byType, assets });
});

/** GET /api/wealth/history — net-worth over time */
const getHistory = asyncHandler(async (req, res) => {
  const { period = '6m' } = req.query;
  const months = period === '1y' ? 12 : 6;
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const assets = await Asset.find({ userId: req.user._id });

  // Build month-by-month net worth from history snapshots
  const monthMap = {};
  for (const asset of assets) {
    for (const snap of asset.history) {
      if (new Date(snap.date) >= since) {
        const key = new Date(snap.date).toISOString().slice(0, 7);
        monthMap[key] = (monthMap[key] || 0) + snap.valuation;
      }
    }
  }

  const history = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, netWorth]) => ({ month, netWorth }));

  sendSuccess(res, { history });
});

/** POST /api/wealth/assets */
const createAsset = asyncHandler(async (req, res) => {
  const { name, assetType, valuation, investedAmount, ticker, quantity, notes } = req.body;
  if (!name || !assetType || valuation === undefined || investedAmount === undefined) {
    return sendBadRequest(res, 'Name, assetType, valuation, and investedAmount are required.');
  }
  const asset = await Asset.create({
    userId: req.user._id, name, assetType, valuation, investedAmount, ticker, quantity, notes,
    history: [{ date: new Date(), valuation }],
  });
  sendCreated(res, { asset }, 'Asset added.');
});

/** PUT /api/wealth/assets/:id */
const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOne({ _id: req.params.id, userId: req.user._id });
  if (!asset) return sendNotFound(res, 'Asset not found.');

  // Prevent mass assignment
  delete req.body.userId;
  delete req.body.history;

  Object.assign(asset, req.body);
  asset.lastUpdated = new Date();

  // Snapshot current valuation for history
  if (req.body.valuation !== undefined) {
    asset.history.push({ date: new Date(), valuation: req.body.valuation });
  }

  await asset.save();
  sendSuccess(res, { asset }, 'Asset updated.');
});

/** DELETE /api/wealth/assets/:id */
const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!asset) return sendNotFound(res, 'Asset not found.');
  sendSuccess(res, {}, 'Asset deleted.');
});

module.exports = { getAssets, getNetWorth, getHistory, createAsset, updateAsset, deleteAsset };
