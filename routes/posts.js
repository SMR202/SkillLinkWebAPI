const express = require('express');
const { ServicePost, PostImage, User, Category, ProviderResponse, Review, Notification } = require('../models');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Create a new service post (customers only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Only customers can create service posts' 
      });
    }

    const { 
      categoryId, 
      title, 
      description, 
      budget, 
      location, 
      city, 
      timing,
      images // Array of image URLs
    } = req.body;

    // Validation
    if (!categoryId || !title || !description) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Category, title, and description are required' 
      });
    }

    // Verify category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Category not found' 
      });
    }

    // Create post
    const post = await ServicePost.create({
      userId: req.user.id,
      categoryId,
      title,
      description,
      budget,
      location,
      city: city || req.user.city,
      timing,
      status: 'open',
      hasAttachments: images && images.length > 0
    });

    // Create images if provided
    if (images && images.length > 0) {
      const imageRecords = images.map((url, index) => ({
        postId: post.id,
        imageUrl: url,
        sortOrder: index
      }));
      await PostImage.bulkCreate(imageRecords);
    }

    // Fetch the complete post with images
    const completePost = await ServicePost.findByPk(post.id, {
      include: [
        {
          model: PostImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'thumbnailUrl', 'sortOrder']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImageUrl', 'city']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      message: 'Service post created successfully',
      data: {
        post: completePost
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create service post',
      error: error.message 
    });
  }
});

// Get all posts (with filters)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      categoryId, 
      city, 
      status, 
      search,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (city) {
      where.city = { [Op.like]: `%${city}%` };
    }
    if (status) {
      where.status = status;
    } else {
      // By default, show only open posts
      where.status = 'open';
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: posts } = await ServicePost.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: PostImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'thumbnailUrl', 'sortOrder'],
          limit: 1 // Only first image for list view
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImageUrl', 'city']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        }
      ]
    });

    res.json({
      status: 'success',
      data: {
        posts,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch posts',
      error: error.message 
    });
  }
});

// Get single post by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await ServicePost.findByPk(req.params.id, {
      include: [
        {
          model: PostImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'thumbnailUrl', 'sortOrder']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImageUrl', 'city', 'rating', 'reviewCount']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        },
        {
          model: ProviderResponse,
          as: 'responses',
          include: [
            {
              model: User,
              as: 'provider',
              attributes: ['id', 'fullName', 'profileImageUrl', 'city', 'rating', 'reviewCount']
            }
          ]
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Post not found' 
      });
    }

    // Increment view count
    await post.increment('viewCount');

    res.json({
      status: 'success',
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch post',
      error: error.message 
    });
  }
});

// Get my posts (customer's own posts)
router.get('/my/posts', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };

    if (status) {
      where.status = status;
    }

    const { count, rows: posts } = await ServicePost.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: PostImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'thumbnailUrl', 'sortOrder'],
          limit: 1
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        }
      ]
    });

    res.json({
      status: 'success',
      data: {
        posts,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch your posts',
      error: error.message 
    });
  }
});

// Update post (only by owner)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await ServicePost.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Post not found' 
      });
    }

    // Check ownership
    if (post.userId !== req.user.id) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You can only edit your own posts' 
      });
    }

    const { 
      title, 
      description, 
      budget, 
      location, 
      city, 
      timing,
      status
    } = req.body;

    // Update post
    await post.update({
      ...(title && { title }),
      ...(description && { description }),
      ...(budget !== undefined && { budget }),
      ...(location && { location }),
      ...(city && { city }),
      ...(timing && { timing }),
      ...(status && { status })
    });

    // Fetch updated post with relations
    const updatedPost = await ServicePost.findByPk(post.id, {
      include: [
        {
          model: PostImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'thumbnailUrl', 'sortOrder']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        }
      ]
    });

    res.json({
      status: 'success',
      message: 'Post updated successfully',
      data: {
        post: updatedPost
      }
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update post',
      error: error.message 
    });
  }
});

// Delete post (only by owner)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await ServicePost.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Post not found' 
      });
    }

    // Check ownership
    if (post.userId !== req.user.id) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You can only delete your own posts' 
      });
    }

    // Delete post (images will be deleted via CASCADE)
    await post.destroy();

    res.json({
      status: 'success',
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to delete post',
      error: error.message 
    });
  }
});

// Update post status (for status transitions like in_progress, completed, cancelled)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Status is required' 
      });
    }

    const post = await ServicePost.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Post not found' 
      });
    }

    // Check ownership
    if (post.userId !== req.user.id) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You can only update your own posts' 
      });
    }

    // Update status
    await post.update({ status });

    res.json({
      status: 'success',
      message: 'Post status updated successfully',
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Update post status error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update post status',
      error: error.message 
    });
  }
});

// Close/complete a post and optionally create review
router.post('/:id/close', authenticateToken, async (req, res) => {
  try {
    const { providerId, rating, comment } = req.body;
    
    const post = await ServicePost.findByPk(req.params.id, {
      include: [
        {
          model: ProviderResponse,
          as: 'responses',
          where: { providerId, status: 'accepted_by_customer' },
          required: false
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Post not found' 
      });
    }

    // Check ownership
    if (post.userId !== req.user.id) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You can only close your own posts' 
      });
    }

    // Update post status to completed
    await post.update({ status: 'completed' });

    // If rating and providerId provided, create review
    if (rating && providerId) {
      await Review.create({
        postId: post.id,
        reviewerId: req.user.id,
        revieweeId: providerId,
        rating: parseFloat(rating),
        comment,
        reviewType: 'customer_to_provider'
      });

      // Update provider's average rating
      const provider = await User.findByPk(providerId);
      if (provider) {
        const reviews = await Review.findAll({
          where: { revieweeId: providerId }
        });
        
        const avgRating = reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length;
        await provider.update({ 
          rating: avgRating.toFixed(1),
          reviewCount: reviews.length
        });

        // Create notification for provider
        await Notification.create({
          userId: providerId,
          type: 'review_received',
          title: 'New Review',
          message: `${req.user.fullName} left you a ${rating}-star review`,
          postId: post.id,
          isRead: false
        });
      }
    }

    res.json({
      status: 'success',
      message: 'Post closed successfully',
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Close post error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to close post',
      error: error.message 
    });
  }
});

// Get reviews for a user (provider)
router.get('/user/:userId/reviews', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { revieweeId: req.params.userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'fullName', 'profileImageUrl']
        },
        {
          model: ServicePost,
          as: 'post',
          attributes: ['id', 'title']
        }
      ]
    });

    res.json({
      status: 'success',
      data: {
        reviews
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch reviews',
      error: error.message 
    });
  }
});

module.exports = router;
