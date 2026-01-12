import express from "express";
import cors from "cors";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

const app = express();
const PORT = process.env.SERVER_PORT || 5001;

app.use(cors());
app.use(express.json());

registerObjectStorageRoutes(app);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
