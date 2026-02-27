import User from "../models/User.js";
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id },
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in getUser Controller: ", error)
  }
};
