import mongoose from "mongoose";

/* ======================================================
   🔌 Connection Strings — Clusters 2
   ====================================================== */
const SETTINGS_URI =
  process.env.MONGODB_URI_SETTINGS ||
  "mongodb+srv://zanta-user-settings:Akashkavindu12345@zanta-user-settings.gl5fqgn.mongodb.net/test?retryWrites=true&w=majority&appName=zanta-user-settings";

const COMMANDS_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://feature-settings:Akashkavindu12345@feature-settings.stfrtvq.mongodb.net/?appName=feature-settings";

/* ======================================================
   🔌 Connection Cache
   ====================================================== */
let cached = globalThis.__mongooseMulti;
if (!cached) {
  cached = globalThis.__mongooseMulti = {
    settings: { conn: null, promise: null },
    commands: { conn: null, promise: null },
  };
}

/* ---------- Settings Connection ---------- */
export async function connectSettingsDB() {
  if (cached.settings.conn) return cached.settings.conn;

  if (!cached.settings.promise) {
    const conn = mongoose.createConnection(SETTINGS_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
    cached.settings.promise = conn.asPromise().then(() => conn);
  }

  cached.settings.conn = await cached.settings.promise;
  return cached.settings.conn;
}

/* ---------- Commands Connection ---------- */
export async function connectCommandsDB() {
  if (cached.commands.conn) return cached.commands.conn;

  if (!cached.commands.promise) {
    const conn = mongoose.createConnection(COMMANDS_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
    cached.commands.promise = conn.asPromise().then(() => conn);
  }

  cached.commands.conn = await cached.commands.promise;
  return cached.commands.conn;
}

/* ======================================================
   📄 Settings Schema (Cluster 1)
   ====================================================== */
const SettingsSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    password: { type: String, default: "not_set" },
    botName: { type: String, default: null },
    ownerName: { type: String, default: null },
    prefix: { type: String, default: "." },
    workType: { type: String, default: "public" },
    botImage: { type: String, default: "null" },
    paymentStatus: { type: String, default: "free" },
  },
  { strict: false, timestamps: true, collection: "settings" }
);

/* ======================================================
   📄 Command Schema (Cluster 2)
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
      enum: ["text", "image", "audio", "video"],
      default: "text",
    },
    contentValue: { type: String, default: "" },
    caption: { type: String, default: "" },
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
    userId: { type: String, required: true, trim: true, index: true },
    command: { type: String, required: true, trim: true, lowercase: true },
    aliase: { type: [String], default: [] },
    desc: { type: String, default: "" },
    react: { type: String, default: "" },
    category: {
      type: String,
      enum: ["main", "download", "logo", "media", "tools"],
      default: "main",
    },
    ownerOnly: { type: Boolean, default: false },
    type: { type: String, enum: ["simple", "API"], required: true },
    textConfig: { type: TextConfigSchema, default: () => ({}) },
    apiConfig: { type: ApiConfigSchema, default: () => ({}) },
    responseTemplate: { type: String, default: "" },
    sendWithImage: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" },
    imageUrlKey: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "commands" }
);

CommandSchema.index({ userId: 1, command: 1 }, { unique: true });

/* ======================================================
   🎯 Model Getters — connection එකට bind කරලා
   ====================================================== */

/* Settings Model — Cluster 1 එකට bind */
export async function getSettingsModel() {
  const conn = await connectSettingsDB();
  return conn.models.Settings || conn.model("Settings", SettingsSchema);
}

/* Command Model — Cluster 2 එකට bind */
export async function getCommandModel() {
  const conn = await connectCommandsDB();
  return conn.models.Command || conn.model("Command", CommandSchema);
}
