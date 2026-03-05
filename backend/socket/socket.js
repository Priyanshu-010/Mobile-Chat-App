import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import {
  addUser,
  removeUser,
  getUserSocket,
  getOnlineUsers,
} from "./onlineUsers.js";

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      socket.userId = userId;
      socket.join(userId);
      addUser(userId, socket.id);
      io.emit("onlineUsers", getOnlineUsers());
    });

    socket.on(
      "sendMessage",
      async ({
        senderId,
        receiverId,
        text,
        type = "text",
        mediaUrl = null,
      }) => {
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [senderId, receiverId],
          });
        }

        const message = await Message.create({
          conversationId: conversation._id,
          sender: senderId,
          text,
          type,
          mediaUrl,
        });

        conversation.lastMessage = message._id;
        conversation.unreadFor = receiverId;
        await conversation.save();

        if (getUserSocket(receiverId)) {
          message.status = "delivered";
          await message.save();
        }

        io.to(senderId).emit("receiveMessage", message);
        io.to(receiverId).emit("receiveMessage", message);
      },
    );

    socket.on("markAsRead", async ({ messageId }) => {
      const message = await Message.findById(messageId);
      if (message) {
        message.status = "read";
        await message.save();

        io.to(message.sender.toString()).emit("messageRead", messageId);
      }
    });

    socket.on("typing", ({ receiverId }) => {
      io.to(receiverId).emit("typing");
    });

    socket.on("stopTyping", ({ receiverId }) => {
      io.to(receiverId).emit("stopTyping");
    });

    socket.on("disconnect", async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          lastSeen: new Date(),
        });
      }
      removeUser(socket.id);
      io.emit("onlineUsers", getOnlineUsers());
    });
  });
};

export default socketHandler;
