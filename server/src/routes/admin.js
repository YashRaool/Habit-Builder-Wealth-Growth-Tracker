const router = require('express').Router();
const { getMetrics, getUsers, updateUser, deleteUser, getFeedback, updateFeedback, createFeedback } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Any authenticated user can submit feedback
router.post('/feedback', createFeedback);

// Admin-only routes
router.use(authorize('admin'));
router.get('/metrics', getMetrics);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/feedback', getFeedback);
router.put('/feedback/:id', updateFeedback);

module.exports = router;
