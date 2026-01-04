require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const http = require('http');
const session = require('express-session');
const { Server } = require('socket.io');
const schedule = require('./utils/scheduler');
const MongoStore = require('connect-mongo').default;
const methodOverride = require('method-override');
const helmet = require('helmet');
const Trip = require('./models/Trip');

// Initialize app
const app = express();
const server = http.createServer(app);

// Database connection
connectDB();

// Initialize Socket.io
const io = new Server(server, {
    cors: { origin: "*" } // Allows the mobile app to connect
});

// Initialize Socket Logic
schedule(io, Trip);

// Middleware
app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.json());

// Session middleware
console.log(typeof MongoStore, MongoStore);
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Enable when ready
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGO_URI })
}));

// Make session available in EJS templates
app.use((req, res, next) => {
    res.locals.userId = req.session.userId;
    next();
});

// ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));


app.get('/', (req, res) => res.send('SoloSafe API is running...'));
// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});