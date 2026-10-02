// ─── DocuFlux Cloudinary Media Cloud Service ────────────────────────────────
// Uploads medical scans, documents, prescriptions, and lab reports to Cloudinary CDN.
// Works natively with zero extra dependencies using Cloudinary's REST API,
// and gracefully falls back to local storage if keys are not yet configured.

const crypto = require('crypto');

const getCloudinaryConfig = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isConfigured = Boolean(
        cloudName &&
        apiKey &&
        apiSecret &&
        !cloudName.includes('your_') &&
        !apiKey.includes('your_') &&
        !apiSecret.includes('your_')
    );

    return { cloudName, apiKey, apiSecret, isConfigured };
};

/**
 * Upload an image, scan, or PDF document to Cloudinary
 * @param {string} fileData - Base64 string (e.g. data:image/png;base64,...) or file URL
 * @param {string} folder - Target folder in Cloudinary (e.g. 'docuflux/records')
 * @returns {Promise<{ url: string, publicId: string } | null>}
 */
const uploadToCloudinary = async (fileData, folder = 'docuflux_medical_records') => {
    const { cloudName, apiKey, apiSecret, isConfigured } = getCloudinaryConfig();

    if (!isConfigured) {
        console.log('ℹ️  Cloudinary not configured in .env. Storing file data directly.');
        return null;
    }

    if (!fileData) return null;

    try {
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Parameters to sign in alphabetical order
        const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

        // Cloudinary auto upload supports images, PDFs, and general raw files
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

        const bodyData = {
            file: fileData,
            api_key: apiKey,
            timestamp: timestamp,
            folder: folder,
            signature: signature
        };

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`⚠️ Cloudinary upload failed (${response.status}):`, errBody);
            return null;
        }

        const data = await response.json();
        console.log(`✅ Uploaded to Cloudinary successfully: ${data.secure_url}`);
        return {
            url: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            bytes: data.bytes
        };
    } catch (err) {
        console.error('⚠️ Cloudinary upload exception:', err.message);
        return null;
    }
};

/**
 * Delete an asset from Cloudinary
 * @param {string} publicId - The public ID of the asset
 */
const deleteFromCloudinary = async (publicId) => {
    const { cloudName, apiKey, apiSecret, isConfigured } = getCloudinaryConfig();

    if (!isConfigured || !publicId) return false;

    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

        const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

        const response = await fetch(destroyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                public_id: publicId,
                api_key: apiKey,
                timestamp: timestamp,
                signature: signature
            })
        });

        const data = await response.json();
        return data.result === 'ok';
    } catch (err) {
        console.error('⚠️ Cloudinary delete error:', err.message);
        return false;
    }
};

module.exports = {
    getCloudinaryConfig,
    uploadToCloudinary,
    deleteFromCloudinary
};
