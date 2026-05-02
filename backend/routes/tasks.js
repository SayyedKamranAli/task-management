const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.get('/stats/dashboard', auth, getTaskStats);
router.get('/project/:projectId', auth, getTasksByProject);
router.route('/')
  .get(auth, getTasks)
  .post(auth, createTask);

router.route('/:id')
  .get(auth, getTaskById)
  .put(auth, updateTask)
  .delete(auth, deleteTask);

module.exports = router;