import Message from "../models/Message.js"
import Conversation from "../models/Conversation.js"

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "username email")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in getConversations Controller: ", error)
  }
};

export const getMessages = async (req, res) => {
  const { userId } = req.params;

  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] },
    });

    if (!conversation) return res.json([]);

    if (conversation.unreadFor?.toString() === req.user.id) {
      conversation.unreadFor = null;
      await conversation.save();
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in getMesssages Controller: ", error)
  }
};