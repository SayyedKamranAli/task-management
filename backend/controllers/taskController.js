const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get all tasks for logged-in user
// @route   GET /api/tasks
// @access  Private
// const getTasks = async (req, res) => {
//     console.log('req: ', req.user.id);
//   try {
//     const tasks = await Task.find({ assignedTo: req.user.id })
//       .populate('project', 'name description')
//       .populate('assignedTo', 'name email')
//       .populate('assignedBy', 'name email');

//     res.json({
//       success: true,
//       count: tasks.length,
//       data: tasks
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// controllers/taskController.js - UPDATED
const getTasks = async (req, res) => {
  try {
    let query = {};
    
    // Agar admin hai to sab tasks dekhe, warna sirf assigned tasks
    if (req.user.role === 'admin') {
      // Admin ko sab tasks dikhao (jo usne create kiye ya assigned hain)
      query = {
        $or: [
          { assignedBy: req.user.id },  // Admin ne jo tasks create kiye
          { assignedTo: req.user.id }    // Jo tasks admin ko assign hain
        ]
      };
    } else {
      // Member ko sirf assigned tasks dikhao
      query = { assignedTo: req.user.id };
    }
    
    console.log('Fetching tasks with query:', query);
    console.log('User role:', req.user.role);
    
    const tasks = await Task.find(query)
      .populate('project', 'name description')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    console.log(`Found ${tasks.length} tasks`);
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error in getTasks:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get tasks by project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    if (project.owner.toString() !== req.user.id && 
        !project.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name description')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access
    if (task.assignedTo._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied to this task' });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin only)
const createTask = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can create tasks' });
    }

    const { title, description, project, assignedTo, priority, dueDate } = req.body;

    // Validation
    if (!title || !description || !project || !assignedTo || !dueDate) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: title, description, project, assignedTo, dueDate' 
      });
    }

    // Check if project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo,
      assignedBy: req.user.id,
      priority: priority || 'medium',
      dueDate
    });

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Admin or assigned user)
const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. Only admin or assigned user can update this task' 
      });
    }

    const { title, description, status, priority, dueDate } = req.body;

    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;

    await task.save();

    const updatedTask = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can delete tasks' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get task statistics for dashboard
// @route   GET /api/tasks/stats/dashboard
// @access  Private
// const getTaskStats = async (req, res) => {
//   try {
//     const tasks = await Task.find({ assignedTo: req.user.id });
    
//     const now = new Date();
//     const stats = {
//       total: tasks.length,
//       pending: tasks.filter(t => t.status === 'pending').length,
//       inProgress: tasks.filter(t => t.status === 'in-progress').length,
//       completed: tasks.filter(t => t.status === 'completed').length,
//       overdue: tasks.filter(t => new Date(t.dueDate) < now && t.status !== 'completed').length,
//       highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length
//     };

//     res.json({
//       success: true,
//       data: stats
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };
const getTaskStats = async (req, res) => {
  try {
    let query = {};
    
    // Admin ke liye sab tasks, member ke liye sirf assigned
    if (req.user.role === 'admin') {
      query = {
        $or: [
          { assignedBy: req.user.id },
          { assignedTo: req.user.id }
        ]
      };
    } else {
      query = { assignedTo: req.user.id };
    }
    
    const tasks = await Task.find(query);
    
    const now = new Date();
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => new Date(t.dueDate) < now && t.status !== 'completed').length
    };
    
    console.log('Stats calculated:', stats);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getTaskStats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  getTasks,
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
};