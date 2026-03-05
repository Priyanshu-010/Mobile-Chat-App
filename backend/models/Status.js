import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaUrl: { 
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    viewers: [
      { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 86400000),
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

const Status = mongoose.model("Status", statusSchema);
export default Status