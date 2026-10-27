const express = require('express');
const router = express.Router();
const FaqModel = require('../models/faqModel');

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const faqs = await FaqModel.getAll(category);
    res.json({
      success: true,
      faqs
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

