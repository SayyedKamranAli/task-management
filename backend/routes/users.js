const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const auth = require('../middleware/auth');

router.route('/')
  .get(auth, getUsers);

router.route('/:id')
  .get(auth, getUserById)
  .put(auth, updateUser)
  .delete(auth, deleteUser);

module.exports = router;