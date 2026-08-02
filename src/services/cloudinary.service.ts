import { v2 as cloudinary } from "cloudinary";
import { CustomError } from "../errors/customError.error";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) throw new CustomError("Transfer receipt uploads are temporarily unavailable", 503);
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

export async function uploadTransferReceiptToCloudinary(reference: string, dataUrl: string) {
  configureCloudinary();
  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "omg-lashes/transfer-receipts",
      public_id: reference,
      resource_type: "image",
      overwrite: true,
      transformation: [{ quality: "auto:good", fetch_format: "auto" }],
    });
    return { publicId: result.public_id, url: result.secure_url };
  } catch {
    throw new CustomError("We could not upload the transfer receipt", 502);
  }
}
