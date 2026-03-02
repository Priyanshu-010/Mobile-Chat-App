import Message from "../models/Message.js"
import Conversation from "../models/Conversation.js"

const socketHandler = (io) => {
  io.on("connection", (socket) => {

    socket.on("join", (userId) => {
      socket.join(userId);
    });

    socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
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
        });

        conversation.lastMessage = message._id;
        conversation.unreadFor = receiverId;

        await conversation.save();

        io.to(receiverId).emit("receiveMessage", message);
        io.to(senderId).emit("receiveMessage", message);

      } catch (error) {
        console.log("Socket error:", error.message);
      }
    });

  });
};

export default socketHandler