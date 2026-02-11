const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const publicPartnerRoutes = require('./routes/publicPartnerRoutes');
const leadRoutes = require('./routes/leadRoutes');
const financeRoutes = require('./routes/financeRoutes');
const materialRoutes = require('./routes/materialRoutes');
const userRoutes = require('./routes/userRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

require('dotenv').config();

const http = require('http');
const initSocket = require('./socket/socketHandler');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = initSocket(server); // Initialize Socket.io

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '60mb' }));
app.use(bodyParser.urlencoded({ limit: '60mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/public/partners', publicPartnerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/webhook', webhookRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Tirvu Partners API is running');
});

// Sync Database and Start Server
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced successfully');
  server.listen(PORT, () => { // Listen on server, not app
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});
