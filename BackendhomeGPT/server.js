
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://127.0.0.1:5175', 'http://localhost:5175'];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));


// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '0123',
  database: process.env.DB_NAME || 'HomeGPT',
  port: process.env.DB_PORT || 5432,
});
/*const pool = new Pool({
  host: '127.0.0.1',
  user: 'postgres',
  password: '0123',
  database: 'HomeGPT',
  port: 5432,
});*/


// Test database connection
pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to database');
  }
});

// API Routes

// Proxy to OpenAI
app.post('/api/analyze', async (req, res) => {
  try {
    const { data } = req.body;
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a property management analyst.' },
          { role: 'user', content: `Analyze this rent data: ${data} and predict next month's total.` },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json({ analysis: response.data.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI proxy error:', err);
    res.status(500).json({ error: 'Failed to get AI analysis' });
  }
});

// Get all properties
app.get('/api/properties', async (request, res) => {
  try {
    const result = await pool.query(`
      SELECT property.*, owner.name AS owner_name, owner.email AS owner_email 
      FROM property 
      LEFT JOIN owner ON property.owner_id = owner.owner_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching properties:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Get a property by ID
app.get('/api/properties/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM property WHERE property_id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a property

// Create a property with validation
app.post('/api/properties', [
  body('address').isString().notEmpty(),
  body('owner_id').isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { address, owner_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO property (address, owner_id) VALUES ($1, $2) RETURNING *',
      [address, owner_id]
    );
    res.status(201).json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('Error creating property:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});
// Update a property
app.put('/api/properties/:id', async (req, res) => {
  const { address, owner_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE property SET address = $1, owner_id = $2 WHERE property_id = $3 RETURNING *',
      [address, owner_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a property
app.delete('/api/properties/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM property WHERE property_id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all tenants
app.get('/api/tenants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tenant');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a tenant by ID
app.get('/api/tenants/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tenant WHERE tenant_id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a tenant
app.post('/api/tenants', async (req, res) => {
  const { name, property_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tenant (name, property_id) VALUES ($1, $2) RETURNING *',
      [name, property_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a tenant
app.put('/api/tenants/:id', async (req, res) => {
  const { name, property_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tenant SET name = $1, property_id = $2 WHERE tenant_id = $3 RETURNING *',
      [name, property_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a tenant
app.delete('/api/tenants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tenant WHERE tenant_id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all rent collections
app.get('/api/rent-collections', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rent_collection');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a rent collection by ID
app.get('/api/rent-collections/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rent_collection WHERE rent_id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a rent collection
app.post('/api/rent-collections', async (req, res) => {
  const { tenant_id, amount, payment_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO rent_collection (tenant_id, amount, payment_date) VALUES ($1, $2, $3) RETURNING *',
      [tenant_id, amount, payment_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a rent collection
app.put('/api/rent-collections/:id', async (req, res) => {
  const { tenant_id, amount, payment_date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE rent_collection SET tenant_id = $1, amount = $2, payment_date = $3 WHERE rent_id = $4 RETURNING *',
      [tenant_id, amount, payment_date, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a rent collection
app.delete('/api/rent-collections/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rent_collection WHERE rent_id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all maintenance requests
app.get('/api/maintenance', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a maintenance request by ID
app.get('/api/maintenance/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance WHERE maintenance_id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a maintenance request
app.post('/api/maintenance', async (req, res) => {
  const { property_id, description, request_date, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO maintenance (property_id, description, request_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [property_id, description, request_date, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a maintenance request
app.put('/api/maintenance/:id', async (req, res) => {
  const { property_id, description, request_date, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE maintenance SET property_id = $1, description = $2, request_date = $3, status = $4 WHERE maintenance_id = $5 RETURNING *',
      [property_id, description, request_date, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a maintenance request
app.delete('/api/maintenance/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM maintenance WHERE maintenance_id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});