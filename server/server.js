require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
// This line has been corrected to fix the new error
const { YSocketIO } = require('y-socket.io/dist/server'); 
const { MongodbPersistence } = require('y-mongodb-provider');
const connectDB = require('./db');
const jwt = require('jsonwebtoken');
const Document = require('./models/Document');

const path = require('path');



// Connect to database

connectDB();



const app = express();



// Init Middleware

app.use(express.json({ extended: false }));



const allowedOrigins = [

  "http://localhost:5173", // Default Vite client port

  /https:\/\/.+\.vercel\.app/ // Allow any Vercel deployment URL

];



app.use(cors({

  origin: function (origin, callback) {

    if (!origin || allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {

      callback(null, true);

    } else {

      callback(new Error('Not allowed by CORS'));

    }

  }

}));



const server = http.createServer(app);



const io = new Server(server, {

  cors: {

    origin: function (origin, callback) {

      if (!origin || allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {

        callback(null, true);

      } else {

        callback(new Error('Not allowed by CORS'));

      }

    },

    methods: ["GET", "POST"]

  }

});



// Socket.IO authentication and authorization middleware

io.use(async (socket, next) => {

  const token = socket.handshake.auth.token;

  const documentId = socket.handshake.query.documentId;



  if (!token) {

    return next(new Error('Authentication error'));

  }

  if (!documentId || !/^[0-9a-fA-F]{24}$/.test(documentId)) {

    return next(new Error('Connection error'));

  }



  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded.user;



    const doc = await Document.findById(documentId);



    if (!doc) {

      return next(new Error('Connection error'));

    }



    const isCollaborator = doc.collaborators.some(id => id.toString() === socket.user.id);



    if (!isCollaborator) {

      return next(new Error('Authorization error'));

    }



    next();

  } catch (err) {

    console.error('Socket connection error:', err.message);

    next(new Error('Authentication error'));

  }

});



// Set up persistence with the new y-mongodb-provider

const mdb = new MongodbPersistence(process.env.MONGODB_URI, {

  collectionName: 'yjs_transactions',

  flushSize: 100,

});



// Create the YSocketIO instance and connect it to the persistence layer

const ysocketio = new YSocketIO(io, {

  persistence: mdb

});



// Start the y-socket.io server

ysocketio.on('document-loaded', (doc) => {

  console.log(`The document ${doc.name} was loaded from persistence`);

})

ysocketio.on('all-document-connections-closed', async (doc) => {

  console.log(`The last client left the document ${doc.name}. Persisting...`);

  await ysocketio.persistence.flushDocument(doc.name);

  console.log(`Document ${doc.name} persisted.`);

});



// Define API routes

app.use('/api/auth', require('./routes/auth'));

app.use('/api/documents', require('./routes/documents'));

app.use('/api/comments', require('./routes/comments'));



// Serve static assets in production

if (process.env.NODE_ENV === 'production') {

  // Set static folder

  app.use(express.static(path.join(__dirname, '../client/dist')));



  app.get('*', (req, res) => {

    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));

  });

}



const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {

  console.log(`Server is running on port ${PORT}`);

  ysocketio.initialize();

});

module.exports = server;
