require('dotenv').config();
const express = require('express');
const { sequelize, syncDatabase, Category } = require('./models');
const authRoutes = require('./routes/auth');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('🚀 SkillLink API - Running Successfully!');
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'success', 
      message: 'Database connection successful!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Initialize database (create tables) - GET version for browser testing
app.get('/init-db', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    await syncDatabase(force);
    
    // Seed categories if they don't exist
    const categoryCount = await Category.count();
    if (categoryCount === 0) {
      await Category.bulkCreate([
        { name: 'Electrician', icon: '⚡', description: 'Electrical repairs and installations' },
        { name: 'Plumber', icon: '🔧', description: 'Plumbing services and repairs' },
        { name: 'Tutor', icon: '📚', description: 'Educational tutoring services' },
        { name: 'Cleaning', icon: '🧹', description: 'Home and office cleaning' },
        { name: 'Development', icon: '💻', description: 'Software and web development' },
        { name: 'Design', icon: '🎨', description: 'Graphic and UI/UX design' },
        { name: 'Carpentry', icon: '🪚', description: 'Woodwork and furniture' },
        { name: 'Painting', icon: '🖌️', description: 'House painting services' }
      ]);
    }
    
    res.json({ 
      status: 'success', 
      message: force ? 'Database reset and initialized successfully!' : 'Database initialized successfully!',
      categoriesSeeded: categoryCount === 0
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to initialize database',
      error: error.message 
    });
  }
});

// POST version for proper REST API
app.post('/init-db', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    await syncDatabase(force);
    
    // Seed categories if they don't exist
    const categoryCount = await Category.count();
    if (categoryCount === 0) {
      await Category.bulkCreate([
        { name: 'Electrician', icon: '⚡', description: 'Electrical repairs and installations' },
        { name: 'Plumber', icon: '🔧', description: 'Plumbing services and repairs' },
        { name: 'Tutor', icon: '📚', description: 'Educational tutoring services' },
        { name: 'Cleaning', icon: '🧹', description: 'Home and office cleaning' },
        { name: 'Development', icon: '💻', description: 'Software and web development' },
        { name: 'Design', icon: '🎨', description: 'Graphic and UI/UX design' },
        { name: 'Carpentry', icon: '🪚', description: 'Woodwork and furniture' },
        { name: 'Painting', icon: '🖌️', description: 'House painting services' }
      ]);
    }
    
    res.json({ 
      status: 'success', 
      message: force ? 'Database reset and initialized successfully!' : 'Database initialized successfully!',
      categoriesSeeded: categoryCount === 0
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to initialize database',
      error: error.message 
    });
  }
});

// Get database schema info
app.get('/db-info', async (req, res) => {
  try {
    const [results] = await sequelize.query('SHOW TABLES');
    const tables = results.map(row => Object.values(row)[0]);
    
    res.json({ 
      status: 'success', 
      data: {
        database: sequelize.config.database,
        tables: tables,
        tableCount: tables.length
      }
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get database info',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log('🚀 Server running on port ' + PORT);
  console.log('📊 Database URL configured:', process.env.MYSQL_URL ? '✅' : '❌');
  console.log('💡 Visit /init-db (POST) to create database tables');
  console.log('💡 Visit /db-info (GET) to see database status');
});
