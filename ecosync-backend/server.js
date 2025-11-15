require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDb  = require('./DB/db');
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require('cookie-parser');
const deviceRoutes = require("./routes/Device_Routes");
const initSocket = require("./Socket/Socket.io");

// user routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const deviceRoutes = require('./routes/Device_Routes');


const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(morgan('combined'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:7000', // or Postman’s origin if needed
    credentials: true
  }));

// Api routes
app.use("/api/devices", deviceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.get('/', (req, res) => {
    res.send('this is test route');
})

// Database
connectDb();


// Http + WebSocket Server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin:"*"}});
initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));