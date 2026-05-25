const express = require('express');
const router = express.Router();
const { Domain } = require('../models'); // adjust path to your models

const axios = require('axios');



let _opToken = null;
let _opTokenExpiry = 0;

async function getOpToken() {
  if (_opToken && Date.now() < _opTokenExpiry) return _opToken;
  const { data } = await axios.post('https://api.openprovider.eu/v1beta/auth/login', {
    username: 'aultum.com@gmail.com',
    password: 'Aultum@12345',
    ip: '0.0.0.0',
  });
  if (data.code !== 0) throw n
  _opTokenExpiry = Date.now() + 20 * 60 * 1000;
  return _opToken;
}

router.get('/check', async (req, res) => {
  const fullName = req.query.name?.toLowerCase().trim();
  if (!fullName) return res.status(400).json({ error: 'Missing name' });

  const dot = fullName.indexOf('.');
  if (dot === -1) return res.status(400).json({ error: 'Include extension, e.g. example.com' });

  const name = fullName.slice(0, dot);
  const extension = fullName.slice(dot + 1);

  // 1. Check your marketplace DB
  const listing = await Domain.findOne({
    where: { domainName: name, domainExtension: `.${extension}`, takenDown: false },
  });

  if (listing) {
    return res.json({
      status: 'marketplace',
      price: listing.askingPrice,
      listing: {
        id: listing.id,
        domainName: listing.domainName,
        domainExtension: listing.domainExtension,
        askingPrice: listing.askingPrice,
        domainStatus: listing.domainStatus,
        saleType: listing.saleType,
      },
    });
  }

  // 2. Fall back to OpenProvider
  try {
    const token = await getOpToken();
    const { data } = await axios.post(
      'https://api.openprovider.eu/v1beta/domains/check',
      { domains: [{ name, extension }], with_price: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const result = data.data?.results?.[0];
    const available = result?.status === 'free';
    const price = result?.price?.reseller?.price ?? null;

    return res.json({
      status: available ? 'available' : 'taken',
      price,
      source: 'openprovider',
      listing: null,
    });
  } catch (err) {
    console.error('OpenProvider error:', err.message);
    return res.json({ status: 'taken', price: null, source: 'openprovider', listing: null });
  }
});


module.exports = router;