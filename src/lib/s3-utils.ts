import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "@/env";

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

/**
 * Upload a file to S3
 */
export async function uploadFileToS3(
  file: File | Buffer | string,
  folder = "uploads",
  userId: string | null = null,
  metadata: {
    filename: string;
    contentType: string;
  } = {
    filename: "",
    contentType: "",
  }
) {
  try {
    // Validate required environment variables
    if (!env.AWS_S3_BUCKET) {
      throw new Error("AWS_S3_BUCKET environment variable is required");
    }
    if (!env.AWS_REGION) {
      throw new Error("AWS_REGION environment variable is required");
    }

    let buffer, contentType, originalName, contentLength;

    // Debug logging
    console.log("AWS Service - File input debug:", {
      fileType: typeof file,
      isBuffer: Buffer.isBuffer(file),
      isUint8Array: file instanceof Uint8Array,
      hasName: file instanceof File && file.name !== undefined,
      metadataKeys: Object.keys(metadata),
    });

    // Handle different input types
    if (Buffer.isBuffer(file)) {
      // Handle Buffer input
      if (!metadata.filename) {
        throw new Error(
          "filename is required in metadata when uploading a Buffer"
        );
      }
      if (!metadata.contentType) {
        throw new Error(
          "contentType is required in metadata when uploading a Buffer"
        );
      }

      buffer = file;
      contentType = metadata.contentType;
      originalName = metadata.filename;
      contentLength = file.length;
    } else if (file instanceof Uint8Array) {
      // Handle Uint8Array input (convert to Buffer)
      if (!metadata.filename) {
        throw new Error(
          "filename is required in metadata when uploading a Uint8Array"
        );
      }
      if (!metadata.contentType) {
        throw new Error(
          "contentType is required in metadata when uploading a Uint8Array"
        );
      }

      buffer = Buffer.from(file);
      contentType = metadata.contentType;
      originalName = metadata.filename;
      contentLength = file.length;
    } else if (file && typeof file === "object" && file.name) {
      // Handle File object input
      buffer = Buffer.from(await file.arrayBuffer());
      contentType = file.type;
      originalName = file.name;
      contentLength = file.size;
    } else {
      throw new Error(
        `Invalid file input. Received: ${typeof file}, isBuffer: ${Buffer.isBuffer(
          file
        )}, isUint8Array: ${
          file instanceof Uint8Array
        }. Must be a File object, Buffer, or Uint8Array with metadata.`
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = originalName.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    // Create key with folder structure
    const key = userId
      ? `${folder}/${userId}/${fileName}`
      : `${folder}/${fileName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: contentLength,
      Metadata: {
        originalName: originalName,
        uploadedAt: new Date().toISOString(),
        ...metadata,
      },
    });

    await s3Client.send(command);

    // Return the public URL
    const url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload multiple files to S3
 */
export async function uploadMultipleFilesToS3(
  files: File[],
  folder: string = "uploads",
  userId?: string
): Promise<{ successful: UploadedFile[]; failed: string[] }> {
  const successful: UploadedFile[] = [];
  const failed: string[] = [];

  // Upload files in parallel
  const uploadPromises = files.map(async (file) => {
    const result = await uploadFileToS3(file, folder, userId);

    if (result.success && result.url) {
      successful.push({
        name: file.name,
        url: result.url,
        type: file.type,
        size: file.size,
      });
    } else {
      failed.push(file.name);
    }
  });

  await Promise.all(uploadPromises);

  return { successful, failed };
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(url: string): Promise<boolean> {
  try {
    if (!url) {
      return false;
    }

    const key = extractS3KeyFromUrl(url);

    if (!key) {
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return false;
  }
}

/**
 * Delete multiple files from S3
 */
export async function deleteMultipleFilesFromS3(
  urls: string[]
): Promise<{ successful: string[]; failed: string[] }> {
  const successful: string[] = [];
  const failed: string[] = [];

  // Delete files in parallel
  const deletePromises = urls.map(async (url) => {
    const success = await deleteFileFromS3(url);

    if (success) {
      successful.push(url);
    } else {
      failed.push(url);
    }
  });

  await Promise.all(deletePromises);

  return { successful, failed };
}

/**
 * Extract S3 key from URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const bucketName = env.AWS_S3_BUCKET;

    if (
      urlObj.hostname === `${bucketName}.s3.${env.AWS_REGION}.amazonaws.com`
    ) {
      return urlObj.pathname.substring(1); // Remove leading slash
    }

    return null;
  } catch (error) {
    console.error("Error extracting S3 key from URL:", error);
    return null;
  }
}