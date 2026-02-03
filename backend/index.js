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

require('dotenv').config();

const app = express();
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

// Base Route
app.get('/', (req, res) => {
  res.send('Tirvu Partners API is running');
});

// Sync Database and Start Server
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced successfully');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});
