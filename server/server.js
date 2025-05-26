const express = require('express');  // Web framework for Node.js
const cors = require('cors');    // Middleware to enable CORS
const dotenv = require('dotenv');    // Loads environment variables from .env files 

// Load environmental variables from .env file 
// Allows us to store sensitive info like database passwords outside our code 
dotenv.config();

// Create Express app instance (creating web server)
const app = express();

// Define port number (check .env port first and then default to 5000)
const PORT = process.env.PORT || 5000; 


/* MIDDLEWARE SETUP */
// Middleware functions run between receiving a request and sending a response

// 1. CORS Middleware - allows React frontend (running on port 3000) to make requests TO backend (running on port 5000)
app.use(cors({
    origin: 'http://localhost:3000',    // Allows requests from React sever 
    credentials: true                  // Allows cookies to be sent with requests
}));

// 2. JSON Parser Middleware - parses incoming requests with JSON payloads
app.use(express.json());

// 3. URL-encoded Parser Middleware - parses incoming requests that are URL encoded payloads (form data)
app.use(express.urlencoded({ extended: true }));


/* Basic Route Setup */
// Routes define what happens when someone makes a request to specific URLs 

// 1.  Root route - just to test if server is working
app.get('/', (req, res) => {
    res.json({
        message: 'Tasklify API is running!',
        status: 'success',
        timestamp: new Date().toISOString()
    });
});

// 2. Health check route - useful for monitoring 
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),   // How long server has been running 
        timestamp:  new Date().toISOString()
    });
});

// 3. 404 handler for undefined routes 
// This middleware runs if no other routes match the request 
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        requestedUrl: req.originalUrl
    });
});

// 4. Error Handling Middleware 
// Express error handling middleware has 4 parameters: (err, rq, res, next)
app.use((err, req, res, next) => {
    console.error('Error occurred: ', err.stack);

    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});


/* START THE SERVER */
// Starts the server and makes it listen for requests 
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📱 Access the API at: http://localhost:${PORT}`)
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`)
});


// MOCK DATA - This simulates what will come from your database later :TO DO
let mockUsers = [
    {
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedpassword', // TO DO: This would be hashed in real app
        name: 'Test User'
    }
];

let mockTasks = [
    {
        id: 1,
        title: 'Complete project setup',
        description: 'Set up the full-stack application',
        category: 'Development',
        priority: 'high',
        dueDate: '2025-12-31',
        completed: false,
        userId: 1,
        createdAt: new Date().toISOString()
    },
{
        id: 2,
        title: 'Learn Node.js',
        description: 'Study backend development',
        category: 'Learning',
        priority: 'medium',
        dueDate: '2025-12-25',
        completed: true,
        userId: 1,
        createdAt: new Date().toISOString()
    }
];

let mockCategories = [
    { id: 1, name: 'Development', userId: 1 },
    { id: 2, name: 'Learning', userId: 1 },
    { id: 3, name: 'Personal', userId: 1 }
];


/* AUTHENTICATION ROUTES */

// POST /api/auth/register - Create new user account
app.post('/api/auth/register', (req, res) => {
    console.log('📝 Register request received:', req.body);
    
    const { email, password, name } = req.body;
    
    // Basic validation
    if (!email || !password || !name) {
        return res.status(400).json({
            error: 'Email, password, and name are required'
        });
    }

    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({
            error: 'User already exists with this email'
        });
    }

    // Create new user (TO DO: in real app, we'd hash password and save to database)
    const newUser = {
        id: mockUsers.length + 1,
        email,
        password: password, // TO DO: In real app: await bcrypt.hash(password, 10)
        name
    };

    mockUsers.push(newUser);
    
    // Return user data and token (format your frontend expects)
    res.status(201).json({
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name
        },
        token: 'mock_jwt_token_register_' + newUser.id
    });
});


// POST /api/auth/login - User login
app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Login request received:', req.body);
    
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
        return res.status(400).json({
            error: 'Email and password are required'
        });
    }
    
    // Find user by email
    const user = mockUsers.find(user => user.email === email);
    if (!user) {
        return res.status(401).json({
            error: 'Invalid email or password'
        });
    }
    
    // Check password (TO DO: in real app: await bcrypt.compare(password, user.password))
    if (password !== 'password123') { // Simple check for demo
        return res.status(401).json({
            error: 'Invalid email or password'
        });
    }
    
    // Return user data and token (format your frontend expects)
    res.json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        },
        token: 'mock_jwt_token_login_' + user.id
    });
});


/* TASK ROUTES */

// GET /api/tasks - Get all tasks for user
app.get('/api/tasks', (req, res) => {
    console.log('📋 Get tasks request received');
    
    // Return mock tasks in format your frontend expects
    res.json(mockTasks);
});

// POST /api/tasks - Create new task
app.post('/api/tasks', (req, res) => {
    console.log('➕ Create task request received:', req.body);
    
    const { title, description, category, priority, dueDate } = req.body;
    
    // Basic validation
    if (!title) {
        return res.status(400).json({
            error: 'Task title is required'
        });
    }
    
    // Create new task
    const newTask = {
        id: mockTasks.length + 1,
        title,
        description: description || '',
        category: category || 'General',
        priority: priority || 'medium',
        dueDate: dueDate || null,
        completed: false,
        userId: 1, // TO DO: In real app: get from JWT token
        createdAt: new Date().toISOString()
    };
    
    mockTasks.push(newTask);
    
    // Return just the task (matching your frontend expectation)
    res.status(201).json(newTask);
});


// PUT /api/tasks/:id - Update existing task
app.put('/api/tasks/:id', (req, res) => {
    console.log(`✏️ Update task ${req.params.id} request received:`, req.body);
    
    const taskId = parseInt(req.params.id);
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({
            error: 'Task not found'
        });
    }
    
    // Update task with new data
    const updatedTask = {
        ...mockTasks[taskIndex],
        ...req.body,
        id: taskId // Ensure ID doesn't change
    };
    
    mockTasks[taskIndex] = updatedTask;
    
    // Return updated task
    res.json(updatedTask);
});

// GET /api/tasks/:id - Get single task by ID
app.get('/api/tasks/:id', (req, res) => {
    console.log(`📋 Get task ${req.params.id} request received`);
    
    const taskId = parseInt(req.params.id);
    const task = mockTasks.find(task => task.id === taskId);
    
    if (!task) {
        return res.status(404).json({
            error: 'Task not found'
        });
    }
    
    res.json(task);
});

// PATCH /api/tasks/:id/status - Toggle task completion status
app.patch('/api/tasks/:id/status', (req, res) => {
    console.log(`🔄 Toggle task ${req.params.id} status:`, req.body);
    
    const taskId = parseInt(req.params.id);
    const { completed } = req.body;
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({
            error: 'Task not found'
        });
    }
    
    // Update only the completed status
    mockTasks[taskIndex].completed = completed;
    
    res.json(mockTasks[taskIndex]);
});


// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
    console.log(`🗑️ Delete task ${req.params.id} request received`);
    
    const taskId = parseInt(req.params.id);
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({
            error: 'Task not found'
        });
    }
    
    // Remove task from array
    const deletedTask = mockTasks.splice(taskIndex, 1)[0];
    
    // Return deleted task
    res.json(deletedTask);
});


/* CATEGORY ROUTES */

// GET /api/categories - Get all categories for user
app.get('/api/categories', (req, res) => {
    console.log('📁 Get categories request received');
    
    res.json(mockCategories);
});

// POST /api/categories - Create new category
app.post('/api/categories', (req, res) => {
    console.log('📁 Create category request received:', req.body);
    
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({
            error: 'Category name is required'
        });
    }
    
    // Check if category already exists
    const existingCategory = mockCategories.find(cat => cat.name === name);
    if (existingCategory) {
        return res.status(400).json({
            error: 'Category already exists'
        });
    }
    
    const newCategory = {
        id: mockCategories.length + 1,
        name,
        userId: 1 // TO DO: In real app: get from JWT token
    };
    
    mockCategories.push(newCategory);
    
    res.status(201).json(newCategory);
});

// PUT /api/categories/:id - Update category
app.put('/api/categories/:id', (req, res) => {
    console.log(`✏️ Update category ${req.params.id}:`, req.body);
    
    const categoryId = parseInt(req.params.id);
    const categoryIndex = mockCategories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
        return res.status(404).json({
            error: 'Category not found'
        });
    }
    
    const updatedCategory = {
        ...mockCategories[categoryIndex],
        ...req.body,
        id: categoryId
    };
    
    mockCategories[categoryIndex] = updatedCategory;
    res.json(updatedCategory);
});


// DELETE /api/categories/:id - Delete category
app.delete('/api/categories/:id', (req, res) => {
    console.log(`🗑️ Delete category ${req.params.id}`);
    
    const categoryId = parseInt(req.params.id);
    const categoryIndex = mockCategories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
        return res.status(404).json({
            error: 'Category not found'
        });
    }
    
    const deletedCategory = mockCategories.splice(categoryIndex, 1)[0];
    res.json(deletedCategory);
});


/* DASHBOARD ROUTE */ 

// GET /api/dashboard/stats - Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
    console.log('📊 Get dashboard stats request received');
    
    // Calculate statistics from mock data
    const totalTasks = mockTasks.length;
    const completedTasks = mockTasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = mockTasks.filter(task => {
        if (!task.dueDate || task.completed) return false;
        return new Date(task.dueDate) < new Date();
    }).length;
    
    // Return stats object directly (matching your frontend expectation)
    res.json({
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    });
});

// GET /api/dashboard/recent-tasks - Get recent tasks for dashboard
app.get('/api/dashboard/recent-tasks', (req, res) => {
    console.log('📊 Get recent tasks request received');
    
    // Get 5 most recent tasks (sorted by creation date)
    const recentTasks = mockTasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    res.json(recentTasks);
});





// Shut down server 
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...')
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...')
    process.exit(0);
});