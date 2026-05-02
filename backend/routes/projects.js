const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const auth = require('../middleware/auth');

router.route('/')
  .get(auth, getProjects)
  .post(auth, createProject);

router.route('/:id')
  .get(auth, getProjectById)
  .put(auth, updateProject)
  .delete(auth, deleteProject);

module.exports = router;