import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "username profilePic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.log("Error in getConversations Controller: ", error)
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  const { userId } = req.params;

  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] },
    });

    if (!conversation) return res.json([]);

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      {
        conversationId: conversation._id,
        sender: userId,
        status: { $ne: "read" },
      },
      { status: "read" }
    );
    conversation.unreadFor = null;
    await conversation.save();

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error)
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, type = "text", mediaUrl = null } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, receiverId],
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      sender: req.user.id,
      text,
      type,
      mediaUrl,
    });

    conversation.lastMessage = message._id;
    conversation.unreadFor = receiverId;
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    console.log("Error in sendMessage Controller: ", error)
    res.status(500).json({ message: error.message });
  }
};