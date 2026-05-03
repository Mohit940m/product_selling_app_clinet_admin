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
