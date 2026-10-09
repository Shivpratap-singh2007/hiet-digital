// ============================================================================
// Unit Tests: Storage Security, Path Isolation, and File Validation
// ============================================================================

import { describe, it, expect } from 'vitest';
import { 
  validateUploadFile, 
  buildSecureStoragePath, 
  sanitizeFilename,
  BUCKET_SECURITY_CONFIG 
} from '../lib/storage';

describe('Storage File Validation & Extension Policies', () => {
  it('accepts valid PDF assignment submission within size limit', () => {
    const validFile = new File(['mock content'], 'lab_assignment_1.pdf', {
      type: 'application/pdf',
    });
    const result = validateUploadFile('assignment-submissions', validFile);
    expect(result.valid).toBe(true);
  });

  it('unconditionally rejects dangerous executable files (.exe, .sh, .bat)', () => {
    const exeFile = new File(['binary payload'], 'malicious.exe', {
      type: 'application/x-msdownload',
    });
    const result = validateUploadFile('assignment-submissions', exeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('prohibited');

    const shFile = new File(['#!/bin/bash'], 'script.sh', {
      type: 'application/x-sh',
    });
    const shResult = validateUploadFile('leave-documents', shFile);
    expect(shResult.valid).toBe(false);
  });

  it('rejects web scripts (.html, .js, .php)', () => {
    const htmlFile = new File(['<script>alert(1)</script>'], 'hack.html', {
      type: 'text/html',
    });
    const result = validateUploadFile('assignment-submissions', htmlFile);
    expect(result.valid).toBe(false);
  });

  it('rejects files exceeding bucket size limit', () => {
    // 25 MB file in assignment-submissions (limit is 20 MB)
    const bigFile = new File(['dummy'], 'large_video.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(bigFile, 'size', { value: 25 * 1024 * 1024 });

    const result = validateUploadFile('assignment-submissions', bigFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum permitted limit');
  });

  it('enforces leave document limit of 10 MB and valid image/pdf formats', () => {
    const config = BUCKET_SECURITY_CONFIG['leave-documents'];
    expect(config.maxSizeBytes).toBe(10 * 1024 * 1024);
    expect(config.allowedExtensions).toContain('pdf');
    expect(config.allowedExtensions).toContain('jpg');
    expect(config.allowedExtensions).not.toContain('exe');
  });
});

describe('Secure Storage Path Normalization & Sanitization', () => {
  it('enforces {owner_id}/{entity_id}/{sanitized_filename} folder structure', () => {
    const ownerId = 'usr-student-001';
    const entityId = 'asg-cse-101';
    const path = buildSecureStoragePath('assignment-submissions', ownerId, entityId, 'Solution_v1.pdf');

    expect(path.startsWith('usr-student-001/asg-cse-101/')).toBe(true);
    expect(path).toContain('.pdf');
  });

  it('sanitizes directory traversal characters from filenames', () => {
    const dangerousName = '../../../../etc/passwd.pdf';
    const sanitized = sanitizeFilename(dangerousName);

    expect(sanitized).not.toContain('..');
    expect(sanitized).not.toContain('/');
    expect(sanitized).toContain('.pdf');
  });
});
