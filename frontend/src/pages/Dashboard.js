// pages/Dashboard.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dateFormatter';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // ✅ Fetch statistics from the stats endpoint
      const statsRes = await axios.get('/tasks/stats/dashboard');
      
      // Handle both response formats
      let statsData = statsRes.data.data || statsRes.data;
      setStats(statsData);
      
      // ✅ Fetch ALL tasks (not stats again!)
      const tasksRes = await axios.get('/tasks');
      
      let tasksData = tasksRes.data.data || tasksRes.data;
      
      // Show last 5 tasks (most recent first)
      const sortedTasks = tasksData.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentTasks(sortedTasks.slice(0, 5));
      
      setError('');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'in-progress': 'info',
      'completed': 'success'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      'low': 'secondary',
      'medium': 'primary',
      'high': 'danger'
    };
    return <Badge bg={variants[priority] || 'secondary'}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" size="lg" />
        <p className="mt-3">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Dashboard</h2>
      <p className="text-muted mb-4">
        Welcome back, <strong>{user?.name}</strong>! ({user?.role})
      </p>
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      
      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h1 className="display-4">{stats.total}</h1>
              <Card.Text className="text-muted">Total Tasks</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center shadow-sm border-warning">
            <Card.Body>
              <h1 className="display-4 text-warning">{stats.pending}</h1>
              <Card.Text className="text-muted">Pending</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center shadow-sm border-info">
            <Card.Body>
              <h1 className="display-4 text-info">{stats.inProgress}</h1>
              <Card.Text className="text-muted">In Progress</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center shadow-sm border-success">
            <Card.Body>
              <h1 className="display-4 text-success">{stats.completed}</h1>
              <Card.Text className="text-muted">Completed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>⚠️ Overdue Tasks!</Alert.Heading>
          <p>
            You have <strong>{stats.overdue}</strong> overdue task(s). 
            Please complete them as soon as possible!
          </p>
        </Alert>
      )}
      
      {/* Recent Tasks */}
      <h4 className="mb-3">Recent Tasks</h4>
      {recentTasks.length === 0 ? (
        <Alert variant="info">
          No tasks yet. {user?.role === 'admin' ? 'Create your first task!' : 'Tasks assigned to you will appear here.'}
        </Alert>
      ) : (
        recentTasks.map(task => (
          <Card key={task._id} className="mb-2 shadow-sm">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={4}>
                  <h6 className="mb-1">{task.title}</h6>
                  <small className="text-muted">
                    Project: {task.project?.name || 'N/A'}
                  </small>
                </Col>
                <Col md={2}>
                  Priority: {getPriorityBadge(task.priority)}
                </Col>
                <Col md={2}>
                  Status: {getStatusBadge(task.status)}
                </Col>
                <Col md={4}>
                  <small className="text-muted">
                        Due: <strong>{formatDate(task.dueDate)}</strong>
                  </small>
                  <br />
                  <small className="text-muted">
                    {/* Show different info for admin vs member */}
                    {user?.role === 'admin' ? (
                      <>Assigned to: <strong>{task.assignedTo?.name || 'Unassigned'}</strong></>
                    ) : (
                      <>Assigned by: <strong>{task.assignedBy?.name || 'Admin'}</strong></>
                    )}
                  </small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default Dashboard;