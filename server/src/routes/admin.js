const router = require('express').Router();
const {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getFeedback,
  updateFeedbackStatus,
  createFeedback,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Users can submit feedback
router.post('/feedback', createFeedback);

// Admin-only endpoints
router.use(authorize('admin'));
router.get('/stats', getStats);
router.get('/metrics', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/feedback', getFeedback);
router.patch('/feedback/:id', updateFeedbackStatus);
router.put('/feedback/:id', updateFeedbackStatus);

module.exports = router;
