require('dotenv').config();
const express = require('express');
const cors = require('cors');
const knex = require('knex')(require('./knexfile').development);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/payments/create', async (req, res) => {
  try {
    const { 
      listingId, 
      totalPrice, 
      adSpend,
      youtubeBoost,
      googleBudget,
      ...options 
    } = req.body;

    const now = new Date();
    const orderData = {
      listingId,
      totalPrice,
      isPaid: true,
      adSpend,
      youtubeBoost, // Add explicitly
      googleBudget, // Add explicitly
      ...options,
    };

    // Set start and end dates if duration (days) is provided
    if (adSpend > 0) {
      orderData.adSpendStartDate = now;
      orderData.adSpendEndDate = new Date(now.getTime() + adSpend * 24 * 60 * 60 * 1000);
    }

    if (youtubeBoost > 0) {
      orderData.youtubeBoostStartDate = now;
      orderData.youtubeBoostEndDate = new Date(now.getTime() + youtubeBoost * 24 * 60 * 60 * 1000);
    }

    if (googleBudget > 0) {
      orderData.googleBudgetStartDate = now;
      orderData.googleBudgetEndDate = new Date(now.getTime() + googleBudget * 24 * 60 * 60 * 1000);
    }

    const result = await knex('pricing_orders').insert(orderData);
    const orderId = result[0];
    res.json({ success: true, id: orderId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/ads/update/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { 
      totalPrice, 
      adSpend,
      youtubeBoost,
      googleBudget,
      ...options 
    } = req.body;

    const existingOrder = await knex('pricing_orders')
      .where({ listingId })
      .first();

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const now = new Date();
    const updateData = {
      totalPrice,
      adSpend,
      youtubeBoost,
      googleBudget,
      ...options,
    };

    // Handle adSpend update
    if (adSpend > 0) {
      const currentEndDate = existingOrder.adSpendEndDate ? new Date(existingOrder.adSpendEndDate) : null;
      if (currentEndDate && currentEndDate > now) {
        // Add new days directly to the current end date instead of calculating from now
        updateData.adSpendEndDate = new Date(currentEndDate.getTime() + adSpend * 24 * 60 * 60 * 1000);
      } else {
        // Start fresh if no active period
        updateData.adSpendStartDate = now;
        updateData.adSpendEndDate = new Date(now.getTime() + adSpend * 24 * 60 * 60 * 1000);
      }
    }

    // Handle youtubeBoost update
    if (youtubeBoost > 0) {
      const currentEndDate = existingOrder.youtubeBoostEndDate ? new Date(existingOrder.youtubeBoostEndDate) : null;
      if (currentEndDate && currentEndDate > now) {
        updateData.youtubeBoostEndDate = new Date(currentEndDate.getTime() + youtubeBoost * 24 * 60 * 60 * 1000);
      } else {
        updateData.youtubeBoostStartDate = now;
        updateData.youtubeBoostEndDate = new Date(now.getTime() + youtubeBoost * 24 * 60 * 60 * 1000);
      }
    }

    // Handle googleBudget update
    if (googleBudget > 0) {
      const currentEndDate = existingOrder.googleBudgetEndDate ? new Date(existingOrder.googleBudgetEndDate) : null;
      if (currentEndDate && currentEndDate > now) {
        updateData.googleBudgetEndDate = new Date(currentEndDate.getTime() + googleBudget * 24 * 60 * 60 * 1000);
      } else {
        updateData.googleBudgetStartDate = now;
        updateData.googleBudgetEndDate = new Date(now.getTime() + googleBudget * 24 * 60 * 60 * 1000);
      }
    }

    await knex('pricing_orders')
      .where({ listingId })
      .update(updateData);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/ads/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    
    const order = await knex('pricing_orders')
      .where({ listingId })
      .first();
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));