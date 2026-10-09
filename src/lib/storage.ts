// ============================================================================
// HIET Digital Campus - Secure Storage Gateway
// Enforces role-based file validation, path isolation, and expiring signed URLs
// ============================================================================

import { isSupabaseConfigured, supabase } from './supabase';

export interface FileValidationConfig {
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxSizeBytes: number;
}

export const BUCKET_SECURITY_CONFIG: Record<string, FileValidationConfig> = {
  'assignment-submissions': {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 20 * 1024 * 1024 // 20 MB
  },
  'leave-documents': {
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 10 * 1024 * 1024 // 10 MB
  },
  'achievement-certificates': {
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 10 * 1024 * 1024 // 10 MB
  },
  'smart-board-lessons': {
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png'
    ],
    allowedExtensions: ['pdf', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 25 * 1024 * 1024 // 25 MB
  },
  'pyq-files': {
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['pdf'],
    maxSizeBytes: 30 * 1024 * 1024 // 30 MB
  },
  'syllabus-files': {
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['pdf'],
    maxSizeBytes: 20 * 1024 * 1024 // 20 MB
  },
  'complaint-attachments': {
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 10 * 1024 * 1024 // 10 MB
  },
  'doubt-attachments': {
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 10 * 1024 * 1024 // 10 MB
  },
  'hall-tickets': {
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['pdf'],
    maxSizeBytes: 10 * 1024 * 1024 // 10 MB
  },
  'event-certificates': {
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 10 * 1024 * 1024 // 10 MB
  },
  'gallery-images': {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maxSizeBytes: 10 * 1024 * 1024 // 10 MB
  },
  'public-notices': {
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 20 * 1024 * 1024 // 20 MB
  }
};

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'sh', 'cmd', 'msi', 'vbs', 'ps1', 'jar',
  'html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'php', 'phtml', 'jsp', 'asp', 'aspx', 'cgi'
]);

/**
 * Validates a file before upload against security policies
 */
export function validateUploadFile(bucket: string, file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Extract and normalize extension
  const parts = file.name.split('.');
  const ext = (parts.pop() || '').toLowerCase().trim();

  // 1. Block dangerous executables and scripts unconditionally
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { 
      valid: false, 
      error: `Security violation: Files with .${ext} extension are prohibited on campus systems.` 
    };
  }

  const config = BUCKET_SECURITY_CONFIG[bucket];
  if (!config) {
    return { valid: false, error: `Invalid storage bucket destination: ${bucket}` };
  }

  // 2. Check maximum size
  if (file.size > config.maxSizeBytes) {
    const maxMb = Math.round(config.maxSizeBytes / (1024 * 1024));
    const currentMb = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `File size (${currentMb} MB) exceeds maximum permitted limit of ${maxMb} MB for this category.` 
    };
  }

  // 3. Check allowed extensions
  if (!config.allowedExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: `Invalid file extension .${ext}. Permitted formats: ${config.allowedExtensions.join(', ').toUpperCase()}` 
    };
  }

  // 4. Check MIME type (if browser populated it)
  if (file.type && !config.allowedMimeTypes.includes(file.type)) {
    // Secondary check: some browsers report empty or generic mime for docx/txt
    if (file.type !== 'application/octet-stream' && !ext.match(/^(docx|doc|txt)$/)) {
      return { 
        valid: false, 
        error: `MIME type "${file.type}" is not authorized for bucket ${bucket}.` 
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes a filename, stripping directory traversal characters and generating a UUID prefix
 */
export function sanitizeFilename(filename: string): string {
  const parts = filename.split('.');
  const ext = (parts.pop() || 'dat').toLowerCase().replace(/[^a-z0-9]/g, '');
  const baseName = parts.join('.')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 40);
  
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return `${baseName || 'file'}_${Date.now()}_${randomSuffix}.${ext}`;
}

/**
 * Enforces the standardized secure storage path convention:
 * {bucket}/{owner_user_id}/{entity_id}/{uuid-file-name}
 */
export function buildSecureStoragePath(
  _bucket: string,
  ownerUserId: string,
  entityId: string,
  filename: string
): string {
  const cleanOwnerId = (ownerUserId || 'anon').replace(/[^a-zA-Z0-9_\-]/g, '');
  const cleanEntityId = (entityId || 'general').replace(/[^a-zA-Z0-9_\-]/g, '');
  const secureName = sanitizeFilename(filename);

  return `${cleanOwnerId}/${cleanEntityId}/${secureName}`;
}

/**
 * Requests a short-lived (15 minutes = 900 seconds) signed URL for private files.
 * Public buckets return their static CDN URL.
 */
export async function getAuthorizedSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 900
): Promise<string> {
  if (!path) return '';

  // If path is already a full signed URL or external URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // If it's a blob URL from client mock, return it
    if (path.startsWith('blob:')) return path;
    // If it already has an active token, return
    if (path.includes('token=')) return path;
  }

  // Public buckets have direct URLs
  if (bucket === 'gallery-images' || bucket === 'public-notices') {
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    return `/demo-media/${path}`;
  }

  // Private buckets require authenticated signed URL
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds);

      if (error) {
        console.warn(`Supabase signed URL error for ${bucket}/${path}:`, error.message);
        throw new Error(`Unauthorized or unavailable file: ${error.message}`);
      }

      if (data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Fallback signed URL retrieval:', msg);
      // If signed URL failed due to RLS, reject safely
      throw new Error(`Storage Access Denied: ${msg}`);
    }
  }

  // Development/Mock fallback: generate local blob preview URL if file is not remote
  return `/storage-demo/${bucket}/${path}?signed_expires=${Date.now() + expiresInSeconds * 1000}`;
}

/**
 * Securely uploads a file with strict validation and returns the stored path and signed URL
 */
export async function uploadSecureFile(
  bucket: string,
  ownerUserId: string,
  entityId: string,
  file: File
): Promise<{ path: string; signedUrl: string }> {
  // 1. Validate file format and size
  const validation = validateUploadFile(bucket, file);
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed.');
  }

  // 2. Build secure path following {owner_id}/{entity_id}/{uuid-name}
  const securePath = buildSecureStoragePath(bucket, ownerUserId, entityId, file.name);

  // 3. Upload to Supabase Storage
  if (isSupabaseConfigured && supabase) {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(securePath, file, {
        cacheControl: '900',
        upsert: false
      });

    if (uploadError) {
      console.error(`Storage upload error [${bucket}]:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 4. Generate expiring signed URL for immediate preview
    const signedUrl = await getAuthorizedSignedUrl(bucket, securePath, 900);
    return { path: securePath, signedUrl };
  }

  // Demo fallback
  const demoUrl = URL.createObjectURL(file);
  return { path: securePath, signedUrl: demoUrl };
}
