import axios from 'axios';
import sellerApi from './sellerApi';

type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
};

export type UploadedProductImage = {
  url: string;
  publicId: string;
};

// Matches the server's own multer/Cloudinary upload limit
// (product_selling_app_server/src/config/cloudinary.ts) — this app
// uploads product images directly from the browser to Cloudinary,
// bypassing that server-side path (and its limit) entirely, and there
// was previously no size check anywhere in this flow at all. Filtering
// here gives a friendly, product-specific error before ever attempting
// the upload, instead of letting an oversized file fail with whatever
// raw error Cloudinary's own API happens to return.
export const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/** Splits a picked file list into ones under the size limit and ones over it. */
export const partitionBySize = (files: File[]): { accepted: File[]; oversized: File[] } => {
  const accepted: File[] = [];
  const oversized: File[] = [];
  for (const file of files) {
    (file.size > MAX_IMAGE_SIZE_BYTES ? oversized : accepted).push(file);
  }
  return { accepted, oversized };
};

export const uploadProductImages = async (files: File[]): Promise<UploadedProductImage[]> => {
  const signatureResponse = await sellerApi.get<{ data: CloudinarySignatureResponse }>('/products/cloudinary-signature');
  const { cloudName, apiKey, timestamp, folder, signature } = signatureResponse.data.data;

  const uploads = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', folder);
    formData.append('signature', signature);

    const { data } = await axios.post<CloudinaryUploadResponse>(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
    );

    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  });

  return Promise.all(uploads);
};
