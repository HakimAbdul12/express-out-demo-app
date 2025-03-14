require('dotenv').config();
const express = require('express');
const cors = require('cors');
const knex = require('knex')(require('./knexfile').development);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());
app.use(cors());

app.post('/payments/create', async (req, res) => {
  try {
    const { listingId, totalPrice, ...options } = req.body;

    const result = await knex('pricing_orders').insert({
      listingId,
      totalPrice,
      isPaid: true,
      ...options,
    });

    // MySQL returns the inserted ID directly
    const orderId = result[0];
    res.json({ success: true, id: orderId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.put('/ads/update/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { youtubeBoost, totalPrice, ...options } = req.body;

    const existingOrder = await knex('pricing_orders')
      .where({ listingId })
      .first();

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await knex('pricing_orders')
      .where({ listingId })
      .update({
        youtubeBoost,
        totalPrice,
        ...options
      });

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