const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('./models/Customer');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || process.env.REACT_APP_MONGODB_URI;

const sampleData = [
  {
    _id: '1',
    name: 'Arun Kumar',
    spouse: 'Meena Arun',
    mobile: '+91 98765 43210',
    dob: '1990-03-24',
    workStatus: 'Salaried',
    dueDate: '2026-05-14',
    latestComment: 'Pending updated salary proof',
    status: 'Pending',
    familyDetails: 'Wife, two children - Karthik (8), Priya (5)',
    history: 'Visited office on 2026-03-01. Tax return filing pending.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    name: 'Revathi N.',
    spouse: 'Suresh N.',
    mobile: '+91 98456 12345',
    dob: '1985-07-09',
    workStatus: 'Self-employed',
    dueDate: '2026-06-21',
    latestComment: 'Need business expense documents',
    status: 'In Progress',
    familyDetails: 'Husband and one child - Anjali (4)',
    history: 'Reviewed business registration and GST details.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let fallbackCustomers = [...sampleData];

const isConnected = () => mongoose.connection.readyState === 1;

app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', mongoConnected: isConnected() });
});

app.get('/api/customers', async (req, res) => {
  try {
    if (isConnected()) {
      const customers = await Customer.find().sort({ createdAt: -1 });
      return res.json(customers);
    }
    return res.json(fallbackCustomers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to load customers.' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const {
      name,
      spouse,
      mobile,
      dob,
      workStatus,
      dueDate,
      latestComment,
      familyDetails,
      history,
      status,
    } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ message: 'Name and mobile number are required.' });
    }

    if (isConnected()) {
      const newCustomer = new Customer({
        name,
        spouse,
        mobile,
        dob,
        workStatus,
        dueDate,
        latestComment,
        familyDetails,
        history,
        status: status || 'Pending',
      });
      await newCustomer.save();
      return res.status(201).json(newCustomer);
    }

    const created = {
      _id: Date.now().toString(),
      name,
      spouse,
      mobile,
      dob,
      workStatus,
      dueDate,
      latestComment,
      familyDetails,
      history,
      status: status || 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    fallbackCustomers.unshift(created);
    return res.status(201).json(created);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create customer.' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    if (isConnected()) {
      const updatedCustomer = await Customer.findByIdAndUpdate(id, updates, {
        new: true,
      });
      if (!updatedCustomer) {
        return res.status(404).json({ message: 'Customer not found.' });
      }
      return res.json(updatedCustomer);
    }

    const index = fallbackCustomers.findIndex((item) => item._id === id || item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    fallbackCustomers[index] = {
      ...fallbackCustomers[index],
      ...updates,
      updatedAt: new Date(),
    };
    return res.json(fallbackCustomers[index]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update customer.' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error.' });
});

async function startServer() {
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
    }
  } else {
    console.warn('MONGODB_URI is not configured. Using fallback in-memory data.');
  }

  app.listen(port, () => {
    console.log(`API server started on http://localhost:${port}`);
  });
}

startServer();
