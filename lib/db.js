import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

let cached = globalThis.__mongoose;
if (!cached) {
  cached = globalThis.__mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      dbName: "test",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/* ======================================================
   Command Schema
   Collection: "commands"
   _id = user's WhatsApp number (e.g. "94771810693")
   ====================================================== */

const QuerySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    defaultValue: { type: String, default: "" },
  },
  { _id: false }
);

const TextConfigSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      enum: ["text", "audio", "video"],
      default: "text",
    },
    contentValue: { type: String, default: "" },
    fileName: { type: String, default: "" },
  },
  { _id: false }
);

const ApiConfigSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["GET", "POST"],
      default: "GET",
    },
    url: { type: String, default: "" },
    hasQuery: { type: Boolean, default: false },
    queries: { type: [QuerySchema], default: [] },
    extractedValues: { type: [String], default: [] },
  },
  { _id: false }
);

const CommandSchema = new mongoose.Schema(
  {
    // _id = user's WhatsApp number
    _id: {
      type: String,
      required: true,
      trim: true,
    },

    command: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    aliase: {
      type: [String],
      default: [],
    },

    desc: {
      type: String,
      default: "",
    },

    react: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["simple", "API"],
      required: true,
    },

    textConfig: {
      type: TextConfigSchema,
      default: () => ({}),
    },

    apiConfig: {
      type: ApiConfigSchema,
      default: () => ({}),
    },

    responseTemplate: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,       // createdAt, updatedAt auto
    collection: "commands", // 🔥 force collection name
    _id: false,             // we supply _id manually (user number)
  }
);

/* Optional: ensure a user can't have 2 commands with same name */
CommandSchema.index({ _id: 1, command: 1 }, { unique: true });

export const Command =
  mongoose.models.Command || mongoose.model("Command", CommandSchema);
