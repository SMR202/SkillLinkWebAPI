const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProviderResponse = sequelize.define('ProviderResponse', {
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
  providerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  responseType: {
    type: DataTypes.ENUM('interested', 'quote', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'interested'
  },
  quotedPrice: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estimatedTime: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted_by_customer', 'rejected_by_customer', 'withdrawn'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: 'provider_responses',
  timestamps: true,
  indexes: [
    { fields: ['postId'] },
    { fields: ['providerId'] }
  ]
});

module.exports = ProviderResponse;
