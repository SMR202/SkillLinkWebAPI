const express = require('express');
const { Category } = require('../models');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all active categories
router.get('/', optionalAuth, async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'icon', 'description', 'isActive']
    });

    res.json({
      status: 'success',
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch categories',
      error: error.message 
    });
  }
});

// Get single category by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      attributes: ['id', 'name', 'icon', 'description', 'isActive']
    });

    if (!category) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Category not found' 
      });
    }

    res.json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch category',
      error: error.message 
    });
  }
});

module.exports = router;
