const express = require('express');
const { ProviderResponse, ServicePost, User, Notification } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Create a response to a service post (providers only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is a provider
    if (req.user.role !== 'provider') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Only providers can respond to service posts' 
      });
    }

    const { 
      postId, 
      responseType, 
      quotedPrice, 
      message, 
      estimatedTime 
    } = req.body;

    // Validation
    if (!postId || !responseType) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Post ID and response type are required' 
      });
    }

    // Verify post exists and is open
    const post = await ServicePost.findByPk(postId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'fcmToken']
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Service post not found' 
      });
    }

    if (post.status !== 'open') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'This post is no longer accepting responses' 
      });
    }

    // Check if provider already responded
    const existingResponse = await ProviderResponse.findOne({
      where: {
        postId,
        providerId: req.user.id
      }
    });

    if (existingResponse) {
      return res.status(409).json({ 
        status: 'error', 
        message: 'You have already responded to this post' 
      });
    }

    // Create response
    const response = await ProviderResponse.create({
      postId,
      providerId: req.user.id,
      responseType,
      quotedPrice,
      message,
      estimatedTime,
      status: 'pending'
    });

    // Increment response count on post
    await post.increment('responseCount');

    // Create notification for post owner
    await Notification.create({
      userId: post.userId,
      type: 'provider_response',
      title: 'New Response Received',
      message: `${req.user.fullName} responded to your service request: ${post.title}`,
      postId: post.id,
      isRead: false
    });

    // Fetch complete response with provider details
    const completeResponse = await ProviderResponse.findByPk(response.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'profileImageUrl', 'city', 'rating', 'reviewCount']
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      message: 'Response submitted successfully',
      data: {
        response: completeResponse
      }
    });
  } catch (error) {
    console.error('Create response error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to submit response',
      error: error.message 
    });
  }
});

// Get all responses for a specific post
router.get('/post/:postId', async (req, res) => {
  try {
    const responses = await ProviderResponse.findAll({
      where: { postId: req.params.postId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'profileImageUrl', 'city', 'rating', 'reviewCount', 'bio']
        }
      ]
    });

    res.json({
      status: 'success',
      data: {
        responses
      }
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch responses',
      error: error.message 
    });
  }
});

// Get my responses (provider's own responses)
router.get('/my/responses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Only providers can view their responses' 
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = { providerId: req.user.id };

    if (status) {
      where.status = status;
    }

    const { count, rows: responses } = await ProviderResponse.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ServicePost,
          as: 'post',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'profileImageUrl', 'city']
            }
          ]
        }
      ]
    });

    res.json({
      status: 'success',
      data: {
        responses,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my responses error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch your responses',
      error: error.message 
    });
  }
});

// Get responses to my posts (customer viewing responses to their posts)
router.get('/my-posts/responses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Only customers can view responses to their posts' 
      });
    }

    const { postId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build query to find responses to user's posts
    const whereClause = {};
    if (postId) {
      whereClause.postId = postId;
    }

    const { count, rows: responses } = await ProviderResponse.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ServicePost,
          as: 'post',
          where: { userId: req.user.id },
          attributes: ['id', 'title', 'status']
        },
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'profileImageUrl', 'city', 'rating', 'reviewCount', 'bio']
        }
      ]
    });

    res.json({
      status: 'success',
      data: {
        responses,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get responses to my posts error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch responses',
      error: error.message 
    });
  }
});

// Accept a response (customer accepting a provider's response)
router.put('/:id/accept', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Only customers can accept responses' 
      });
    }

    const response = await ProviderResponse.findByPk(req.params.id, {
      include: [
        {
          model: ServicePost,
          as: 'post'
        },
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'fcmToken']
        }
      ]
    });

    if (!response) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Response not found' 
      });
    }

    // Verify the post belongs to the current user
    if (response.post.userId !== req.user.id) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You can only accept responses to your own posts' 
      });
    }

    if (response.status === 'accepted_by_customer') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'This response is already accepted' 
      });
    }

    // Update response status
    await response.update({ status: 'accepted_by_customer' });

    // Update post status to assigned
    await response.post.update({ status: 'assigned' });

    // Create notification for provider
    await Notification.create({
      userId: response.providerId,
      type: 'request_accepted',
      title: 'Response Accepted!',
      message: `${req.user.fullName} accepted your response for: ${response.post.title}`,
      postId: response.post.id,
      isRead: false
    });

    res.json({
      status: 'success',
      message: 'Response accepted successfully',
      data: {
        response
      }
    });
  } catch (error) {
    console.error('Accept response error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to accept response',
      error: error.message 
    });
  }
});

// Update response (provider updating their own response)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const response = await ProviderResponse.findByPk(req.params.id);

    if (!response) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Response not found' 
      });
    }

    // Check ownership
    if (response.providerId !== req.user.id) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You can only edit your own responses' 
      });
    }

    const { quotedPrice, message, estimatedTime, status } = req.body;

    // Update response
    await response.update({
      ...(quotedPrice !== undefined && { quotedPrice }),
      ...(message && { message }),
      ...(estimatedTime && { estimatedTime }),
      ...(status && { status })
    });

    // Fetch updated response with provider details
    const updatedResponse = await ProviderResponse.findByPk(response.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'profileImageUrl', 'city', 'rating', 'reviewCount']
        }
      ]
    });

    res.json({
      status: 'success',
      message: 'Response updated successfully',
      data: {
        response: updatedResponse
      }
    });
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update response',
      error: error.message 
    });
  }
});

// Delete/withdraw response (provider deleting their own response)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const response = await ProviderResponse.findByPk(req.params.id);

    if (!response) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Response not found' 
      });
    }

    // Check ownership
    if (response.providerId !== req.user.id) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You can only delete your own responses' 
      });
    }

    // Delete response
    await response.destroy();

    res.json({
      status: 'success',
      message: 'Response withdrawn successfully'
    });
  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to withdraw response',
      error: error.message 
    });
  }
});

module.exports = router;
