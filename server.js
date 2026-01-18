require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
//const session = require('express-session');
const { Server } = require('socket.io');
//const MongoStore = require('connect-mongo').default;
const methodOverride = require('method-override');
const helmet = require('helmet');
const passport = require('passport');


require('./config/passport');
require('./utils/scheduler');
const locationSync = require('./utils/locationSync');
const { permission } = require('process');

// Initialize app
const app = express();
const server = http.createServer(app);

// Database connection
connectDB();
app.set('trust proxy', 1);

// // Initialize Socket.io
// const io = new Server(server, {
//     cors: { origin: "*" } // replace "*" with your frontend URL in production
// });
// // Socket.io connection
// io.on("connection", () => {
//     console.log("Socket.IO connection detected");
// });
// locationSync(io);

// Middleware
app.use(cors({
    origin: "*", // replace "*" with your frontend URL in production
    credentials: true,
}));
app.use(helmet({
    contentSecurityPolicy: false,
    permissionsPolicy: {
        features: {
            geolocation: ["'self'", `"${process.env.CLIENT_URL}"`]
        },
    },
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));


// Session middleware
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     name: 'solosafe.sid',
//     cookie: {
//         secure: true, // Set to true if using HTTPS
//         httpOnly: true,
//         //secure: process.env.NODE_ENV === 'production', // Set to true in production
//         sameSite: 'none',
//         maxAge: 1000 * 60 * 60 * 24, // 1 day
//         path: '/',
//         domain: undefined // Set domain if needed
//     },
//     proxy: true,
//     rolling: true,
//     store: MongoStore.create({ 
//         mongoUrl: process.env.MONGO_URI
//      })
// }));

// // Make session available in EJS templates
// app.use((req, res, next) => {
//     res.locals.userId = req.session.userId;
//     next();
// });

app.use(passport.initialize());


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