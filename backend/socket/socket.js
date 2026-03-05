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
        try {
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
        } catch (error) {
          console.log("Error in sendMessage socket:", error);
        }
        
      },
    );

    socket.on("markAsRead", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);

        if (message) {
          message.status = "read";
          await message.save();

          io.to(message.sender.toString()).emit("messageRead", messageId);
        }
      } catch (error) {
        console.log("Error in markAsRead socket:", error);
      }
    });

    socket.on("typing", ({ receiverId }) => {
      try {
        io.to(receiverId).emit("typing");
      } catch (error) {
        console.log("Error in typing socket:", error);
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      try {
        io.to(receiverId).emit("stopTyping");
      } catch (error) {
        console.log("Error in stopTyping socket:", error);
      }
    });

    socket.on("disconnect", async () => {
      try {
        console.log("Socket disconnected:", socket.id);

        if (socket.userId) {
          await User.findByIdAndUpdate(socket.userId, {
            lastSeen: new Date(),
          });
        }

        removeUser(socket.id);

        io.emit("onlineUsers", getOnlineUsers());
      } catch (error) {
        console.log("Error in disconnect socket:", error);
      }
    });
  });
};

export default socketHandler;
