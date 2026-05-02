// pages/Tasks.js - UPDATED for Admin to see all tasks
import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dateFormatter';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: ''
  });

  // Fetch all tasks (admin will see all, member will see assigned)
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/tasks');
      
      let tasksData = res.data.data || res.data;
      setTasks(tasksData);
      setError('');
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/projects');
      let projectsData = res.data.data || res.data;
      setProjects(projectsData);
    } catch (err) {
      console.error('Fetch projects error:', err);
    }
  };

  const fetchUsers = async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await axios.get('/users');
      let usersData = res.data.data || res.data;
      setUsers(usersData);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingTask) {
        await axios.put(`/tasks/${editingTask._id}`, formData);
      } else {
        await axios.post('/tasks', formData);
      }
      
      setShowModal(false);
      resetForm();
      fetchTasks(); // Refresh tasks
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await axios.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks(); // Refresh after update
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/tasks/${id}`);
        fetchTasks();
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: ''
    });
    setEditingTask(null);
  };

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        project: task.project?._id || task.project,
        assignedTo: task.assignedTo?._id || task.assignedTo,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, []);

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'in-progress': 'info',
      'completed': 'success'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      'low': 'secondary',
      'medium': 'primary',
      'high': 'danger'
    };
    return <Badge bg={variants[priority]}>{priority}</Badge>;
  };

  if (loading && tasks.length === 0) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading tasks...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{user?.role === 'admin' ? 'All Tasks' : 'My Tasks'}</h2>
        {user?.role === 'admin' && (
          <Button variant="primary" onClick={() => openModal()}>
            + Create Task
          </Button>
        )}
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      
      {tasks.length === 0 ? (
        <Alert variant="info">
          No tasks found. {user?.role === 'admin' ? 'Create your first task!' : 'Ask your admin to assign tasks to you.'}
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Project</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task._id}>
                <td>{task.title}</td>
                <td>{task.description?.substring(0, 50)}...</td>
                <td>{task.project?.name || 'N/A'}</td>
                <td>{task.assignedTo?.name || 'N/A'}</td>
                <td>{getPriorityBadge(task.priority)}</td>
                <td>{getStatusBadge(task.status)}</td>
                <td>{formatDate(task.dueDate)}</td>
                <td>
                  <Form.Select
                    size="sm"
                    value={task.status}
                    onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                    style={{ width: '130px', display: 'inline-block' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
                  
                  {user?.role === 'admin' && (
                    <>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="ms-2"
                        onClick={() => openModal(task)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="ms-1"
                        onClick={() => handleDelete(task._id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      
      {/* Create/Edit Task Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTask ? 'Edit Task' : 'Create New Task'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Project *</Form.Label>
              <Form.Select
                value={formData.project}
                onChange={(e) => setFormData({...formData, project: e.target.value})}
                required
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Assign To *</Form.Label>
              <Form.Select
                value={formData.assignedTo}
                onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                required
              >
                <option value="">Select Member</option>
                {users.filter(u => u.role !== "admin").map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Due Date *</Form.Label>
              <Form.Control
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : (editingTask ? 'Update' : 'Create')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Tasks;