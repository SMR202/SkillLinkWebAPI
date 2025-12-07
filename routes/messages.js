const express = require('express');
const router = express.Router();
const { User, Conversation, Message, ServicePost } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all conversations for the current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const conversations = await Conversation.findAndCountAll({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'profileImageUrl', 'role']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'profileImageUrl', 'role']
        },
        {
          model: Message,
          as: 'lastMessage',
          attributes: ['id', 'content', 'messageType', 'createdAt', 'isRead']
        },
        {
          model: ServicePost,
          as: 'post',
          attributes: ['id', 'title', 'status']
        }
      ],
      order: [['lastMessageAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format response to show the other user
    const formattedConversations = conversations.rows.map(conv => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const unreadCount = conv.user1Id === userId ? conv.user1UnreadCount : conv.user2UnreadCount;
      
      return {
        id: conv.id,
        otherUser: otherUser,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: unreadCount,
        post: conv.post,
        createdAt: conv.createdAt
      };
    });

    res.json({
      status: 'success',
      data: {
        conversations: formattedConversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: conversations.count,
          totalPages: Math.ceil(conversations.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
});

// Get or create conversation between two users
router.post('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId, postId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'otherUserId is required'
      });
    }

    if (userId === otherUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'profileImageUrl', 'role']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'profileImageUrl', 'role']
        },
        {
          model: ServicePost,
          as: 'post',
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        user1Id: Math.min(userId, otherUserId),
        user2Id: Math.max(userId, otherUserId),
        postId: postId || null
      });

      // Fetch with associations
      conversation = await Conversation.findByPk(conversation.id, {
        include: [
          {
            model: User,
            as: 'user1',
            attributes: ['id', 'fullName', 'profileImageUrl', 'role']
          },
          {
            model: User,
            as: 'user2',
            attributes: ['id', 'fullName', 'profileImageUrl', 'role']
          },
          {
            model: ServicePost,
            as: 'post',
            attributes: ['id', 'title', 'status']
          }
        ]
      });
    }

    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;
    const unreadCount = conversation.user1Id === userId ? conversation.user1UnreadCount : conversation.user2UnreadCount;

    res.json({
      status: 'success',
      data: {
        conversation: {
          id: conversation.id,
          otherUser: otherUser,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: unreadCount,
          post: conversation.post,
          createdAt: conversation.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create conversation',
      error: error.message
    });
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    const messages = await Message.findAndCountAll({
      where: { conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'profileImageUrl']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Mark messages as read
    await Message.update(
      { 
        isRead: true, 
        readAt: new Date(),
        isDelivered: true,
        deliveredAt: new Date()
      },
      {
        where: {
          conversationId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    // Reset unread count for current user
    if (conversation.user1Id === userId) {
      await conversation.update({ user1UnreadCount: 0 });
    } else {
      await conversation.update({ user2UnreadCount: 0 });
    }

    res.json({
      status: 'success',
      data: {
        messages: messages.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.count,
          totalPages: Math.ceil(messages.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// Send a message
router.post('/messages', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, receiverId, content, messageType = 'text', attachmentUrl } = req.body;

    if (!conversationId || !receiverId || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'conversationId, receiverId, and content are required'
      });
    }

    // Verify conversation exists and user is part of it
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      senderId: userId,
      receiverId,
      content,
      messageType,
      attachmentUrl: attachmentUrl || null,
      isDelivered: true,
      deliveredAt: new Date()
    });

    // Update conversation
    await conversation.update({
      lastMessageId: message.id,
      lastMessageAt: new Date()
    });

    // Increment unread count for receiver
    if (conversation.user1Id === receiverId) {
      await conversation.increment('user1UnreadCount');
    } else {
      await conversation.increment('user2UnreadCount');
    }

    // Fetch message with associations
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'profileImageUrl']
        }
      ]
    });

    // TODO: Send push notification to receiver

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: {
        message: messageWithSender
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Get unread message count
router.get('/messages/unread/count', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({
      status: 'success',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

module.exports = router;
