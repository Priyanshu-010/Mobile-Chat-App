const onlineUsers = new Map();

export const addUser = (userId, socketId) => {
  onlineUsers.set(userId, socketId);
};

export const removeUser = (socketId) => {
  for (let [userId, id] of onlineUsers.entries()) {
    if (id === socketId) {
      onlineUsers.delete(userId);
      break;
    }
  }
};

export const getUserSocket = (userId) => 
  onlineUsers.get(userId);

export const getOnlineUsers = () =>
  Array.from(onlineUsers.keys());