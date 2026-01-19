const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins for CORS
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL, // Vercel URL will be set here
].filter(Boolean);

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(null, true); // Allow all for now during setup
        }
    },
    credentials: true
}));
app.use(express.json());

// Request logging (for development)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running!' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Todoist Backend API',
        health: '/api/health',
        docs: 'POST /api/auth/signup, POST /api/auth/login, GET/POST/PUT/DELETE /api/tasks'
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await initDatabase();

        // Import routes after database is initialized
        const authRoutes = require('./routes/auth');
        const taskRoutes = require('./routes/tasks');

        // Mount routes
        app.use('/api/auth', authRoutes);
        app.use('/api/tasks', taskRoutes);

        // 404 handler - AFTER routes
        app.use((req, res, next) => {
            if (req.path.startsWith('/api/')) {
                res.status(404).json({ error: 'Endpoint not found' });
            } else {
                next();
            }
        });

        // Error handler
        app.use((err, req, res, next) => {
            console.error('Server error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
