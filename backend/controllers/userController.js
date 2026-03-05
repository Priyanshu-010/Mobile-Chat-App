import User from "../models/User.js";
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in getUser Controller: ", error)
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in getProfile Controller: ", error)
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, bio, profilePic } = req.body;

    const user = await User.findById(req.user.id);

    if (username) user.username = username;
    if (bio) user.bio = bio;
    if (profilePic) user.profilePic = profilePic;

    await user.save();

    res.status(200).json({
      message: "Profile updated",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in getUser Controller: ", error)
  }
};
