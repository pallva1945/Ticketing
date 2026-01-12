import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";

/**
 * Register object storage routes for file uploads.
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get("/objects/*splat", async (req, res) => {
    try {
      const splat = (req.params as any).splat;
      const objectPath = "/objects/" + (Array.isArray(splat) ? splat.join('/') : splat);
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });

  // CRM-specific upload endpoint - saves to fixed path
  app.post("/api/crm/upload", async (req, res) => {
    try {
      const { content } = req.body;
      console.log("[CRM Upload] Request received, content length:", content?.length || 0);
      
      if (!content) {
        console.log("[CRM Upload] Error: Missing content");
        return res.status(400).json({ error: "Missing content" });
      }

      const privateDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateDir}/crm-data.csv`;
      console.log("[CRM Upload] Saving to path:", fullPath);
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      console.log("[CRM Upload] Bucket:", bucketName, "Object:", objectName);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(content, {
        contentType: 'text/csv',
        metadata: { updatedAt: new Date().toISOString() }
      });

      console.log("[CRM Upload] Success! Saved", content.length, "bytes");
      res.json({ success: true, path: '/api/crm/data' });
    } catch (error) {
      console.error("[CRM Upload] Error:", error);
      res.status(500).json({ error: "Failed to save CRM data" });
    }
  });

  // CRM-specific download endpoint - reads from fixed path
  app.get("/api/crm/data", async (req, res) => {
    try {
      const privateDir = objectStorageService.getPrivateObjectDir();
      const { bucketName, objectName } = parseObjectPath(`${privateDir}/crm-data.csv`);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "No CRM data found" });
      }

      const [content] = await file.download();
      res.setHeader('Content-Type', 'text/csv');
      res.send(content.toString());
    } catch (error) {
      console.error("Error loading CRM data:", error);
      res.status(500).json({ error: "Failed to load CRM data" });
    }
  });
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) path = `/${path}`;
  const parts = path.split("/");
  if (parts.length < 3) throw new Error("Invalid path");
  return { bucketName: parts[1], objectName: parts.slice(2).join("/") };
}

