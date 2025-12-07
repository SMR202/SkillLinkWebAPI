const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const ServicePost = require('./ServicePost');
const PostImage = require('./PostImage');
const ProviderResponse = require('./ProviderResponse');
const Notification = require('./Notification');

// Define relationships

// User -> ServicePost (One to Many)
User.hasMany(ServicePost, { foreignKey: 'userId', as: 'posts' });
ServicePost.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Category -> ServicePost (One to Many)
Category.hasMany(ServicePost, { foreignKey: 'categoryId', as: 'posts' });
ServicePost.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// ServicePost -> PostImage (One to Many)
ServicePost.hasMany(PostImage, { foreignKey: 'postId', as: 'images', onDelete: 'CASCADE' });
PostImage.belongsTo(ServicePost, { foreignKey: 'postId', as: 'post' });

// ServicePost -> ProviderResponse (One to Many)
ServicePost.hasMany(ProviderResponse, { foreignKey: 'postId', as: 'responses' });
ProviderResponse.belongsTo(ServicePost, { foreignKey: 'postId', as: 'post' });

// User (Provider) -> ProviderResponse (One to Many)
User.hasMany(ProviderResponse, { foreignKey: 'providerId', as: 'responses' });
ProviderResponse.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

// User -> Notification (One to Many)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sync database (create tables)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force }); // force: true will drop existing tables
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Category,
  ServicePost,
  PostImage,
  ProviderResponse,
  Notification,
  syncDatabase
};
