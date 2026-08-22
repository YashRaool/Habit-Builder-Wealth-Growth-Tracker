const router = require('express').Router();
const { getUser, updateUser, updatePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.put('/:id/password', updatePassword);

module.exports = router;
