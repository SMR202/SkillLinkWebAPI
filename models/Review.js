const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'service_posts',
      key: 'id'
    }
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  revieweeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewType: {
    type: DataTypes.ENUM('customer_to_provider', 'provider_to_customer'),
    allowNull: false
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    { fields: ['postId'] },
    { fields: ['reviewerId'] },
    { fields: ['revieweeId'] }
  ]
});

module.exports = Review;
