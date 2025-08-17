import React, { useState, useRef, useCallback, useEffect } from 'react';

// Types for file upload management
interface UploadChunk {
  id: string;
  index: number;
  data: Blob;
  uploaded: boolean;
  retryCount: number;
}

interface UploadSession {
  id: string;
  file: File;
  chunks: UploadChunk[];
  uploadedBytes: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'paused';
  error?: string;
  startTime?: number;
  resumeToken?: string;
}

interface CloudProvider {
  name: string;
  upload: (chunk: Blob, metadata: any) => Promise<any>;
  complete: (uploadId: string, parts: any[]) => Promise<string>;
  abort: (uploadId: string) => Promise<void>;
}

// File Uploader Component
export interface FileUploaderProps {
  onUploadStart: (file: File) => void;
  onUploadProgress: (file: File, progress: number) => void;
  onUploadComplete: (file: File, result: any) => void;
  onUploadError: (file: File, error: Error) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024,
  allowedTypes = [],
  multiple = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSessions, setUploadSessions] = useState<Map<string, UploadSession>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chunkSize = 1024 * 1024; // 1MB chunks

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`;
    }
    
    if (allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      
      if (!isAllowed) {
        return `File type ${file.type} not allowed`;
      }
    }
    
    return null;
  };

  const createChunks = (file: File): UploadChunk[] => {
    const chunks: UploadChunk[] = [];
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      chunks.push({
        id: `${file.name}_chunk_${i}`,
        index: i,
        data: chunk,
        uploaded: false,
        retryCount: 0,
      });
    }
    
    return chunks;
  };

  const uploadChunk = async (
    chunk: UploadChunk,
    session: UploadSession,
    onProgress: (bytes: number) => void
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('chunk', chunk.data);
    formData.append('chunkIndex', chunk.index.toString());
    formData.append('totalChunks', session.chunks.length.toString());
    formData.append('fileName', session.file.name);
    formData.append('sessionId', session.id);

    try {
      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      onProgress(chunk.data.size);
      return result;
    } catch (error) {
      if (chunk.retryCount < 3) {
        chunk.retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * chunk.retryCount));
        return uploadChunk(chunk, session, onProgress);
      }
      throw error;
    }
  };

  const uploadFile = useCallback(async (file: File) => {
    const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chunks = createChunks(file);
    
    const session: UploadSession = {
      id: sessionId,
      file,
      chunks,
      uploadedBytes: 0,
      status: 'uploading',
      startTime: Date.now(),
    };

    setUploadSessions(prev => new Map(prev).set(sessionId, session));
    onUploadStart(file);

    try {
      const uploadPromises = chunks.map(async (chunk) => {
        const result = await uploadChunk(chunk, session, (bytes) => {
          setUploadSessions(prev => {
            const updated = new Map(prev);
            const currentSession = updated.get(sessionId);
            if (currentSession) {
              currentSession.uploadedBytes += bytes;
              chunk.uploaded = true;
              
              const progress = (currentSession.uploadedBytes / file.size) * 100;
              onUploadProgress(file, progress);
            }
            return updated;
          });
        });
        return { chunk, result };
      });

      const results = await Promise.all(uploadPromises);
      
      // Complete multipart upload
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fileName: file.name,
          parts: results.map(r => r.result),
        }),
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      const finalResult = await completeResponse.json();
      
      setUploadSessions(prev => {
        const updated = new Map(prev);
        const currentSession = updated.get(sessionId);
        if (currentSession) {
          currentSession.status = 'completed';
        }
        return updated;
      });

      onUploadComplete(file, finalResult);
    } catch (error) {
      setUploadSessions(prev => {
        const updated = new Map(prev);
        const currentSession = updated.get(sessionId);
        if (currentSession) {
          currentSession.status = 'error';
          currentSession.error = error instanceof Error ? error.message : 'Upload failed';
        }
        return updated;
      });

      onUploadError(file, error instanceof Error ? error : new Error('Upload failed'));
    }
  }, [onUploadStart, onUploadProgress, onUploadComplete, onUploadError]);

  const handleFileSelect = useCallback((files: FileList) => {
    const selectedFiles = Array.from(files);
    
    for (const file of selectedFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        onUploadError(file, new Error(validationError));
        continue;
      }
      
      uploadFile(file);
      
      if (!multiple) break;
    }
  }, [uploadFile, multiple, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `2px dashed ${isDragOver ? '#007bff' : '#ccc'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: isDragOver ? '#f8f9fa' : 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>📁</div>
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
        {isDragOver ? 'Drop files here' : 'Choose files or drag and drop'}
      </div>
      <div style={{ fontSize: '14px', color: '#666' }}>
        Max size: {Math.round(maxFileSize / (1024 * 1024))}MB
        {allowedTypes.length > 0 && (
          <div>Allowed types: {allowedTypes.join(', ')}</div>
        )}
      </div>
    </div>
  );
};

// Progress Tracker Component
export interface ProgressTrackerProps {
  uploads: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    uploadedBytes: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
  }>;
  onRetry: (uploadId: string) => void;
  onCancel: (uploadId: string) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  uploads,
  onRetry,
  onCancel,
}) => {
  const [uploadSpeed, setUploadSpeed] = useState<Map<string, number>>(new Map());
  const previousBytes = useRef<Map<string, { bytes: number; timestamp: number }>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newSpeeds = new Map<string, number>();

      uploads.forEach(upload => {
        if (upload.status === 'uploading') {
          const previous = previousBytes.current.get(upload.id);
          if (previous) {
            const timeDiff = (now - previous.timestamp) / 1000; // seconds
            const bytesDiff = upload.uploadedBytes - previous.bytes;
            const speed = bytesDiff / timeDiff; // bytes per second
            newSpeeds.set(upload.id, speed);
          }
          
          previousBytes.current.set(upload.id, {
            bytes: upload.uploadedBytes,
            timestamp: now,
          });
        }
      });

      setUploadSpeed(newSpeeds);
    }, 1000);

    return () => clearInterval(interval);
  }, [uploads]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const getETA = (uploadedBytes: number, totalBytes: number, speed: number): string => {
    if (speed === 0 || uploadedBytes >= totalBytes) return '';
    const remainingBytes = totalBytes - uploadedBytes;
    const remainingSeconds = remainingBytes / speed;
    
    if (remainingSeconds < 60) return `${Math.round(remainingSeconds)}s`;
    if (remainingSeconds < 3600) return `${Math.round(remainingSeconds / 60)}m`;
    return `${Math.round(remainingSeconds / 3600)}h`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'uploading': return '#007bff';
      case 'error': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return '✅';
      case 'uploading': return '⬆️';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const totalUploads = uploads.length;
  const completedUploads = uploads.filter(u => u.status === 'completed').length;
  const totalBytes = uploads.reduce((sum, u) => sum + u.fileSize, 0);
  const uploadedBytes = uploads.reduce((sum, u) => sum + u.uploadedBytes, 0);
  const overallProgress = totalBytes > 0 ? (uploadedBytes / totalBytes) * 100 : 0;

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4>Upload Progress</h4>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {completedUploads}/{totalUploads} files • {formatBytes(uploadedBytes)}/{formatBytes(totalBytes)}
        </div>
      </div>

      {/* Overall Progress */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Overall Progress</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '8px', 
          backgroundColor: '#e9ecef', 
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${overallProgress}%`,
            height: '100%',
            backgroundColor: '#007bff',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Individual File Progress */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {uploads.map(upload => {
          const progress = upload.fileSize > 0 ? (upload.uploadedBytes / upload.fileSize) * 100 : 0;
          const speed = uploadSpeed.get(upload.id) || 0;
          const eta = getETA(upload.uploadedBytes, upload.fileSize, speed);

          return (
            <div key={upload.id} style={{ 
              marginBottom: '15px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              border: `1px solid ${getStatusColor(upload.status)}20`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{getStatusIcon(upload.status)}</span>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{upload.fileName}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {upload.status === 'error' && (
                    <button
                      onClick={() => onRetry(upload.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      Retry
                    </button>
                  )}
                  {upload.status === 'uploading' && (
                    <button
                      onClick={() => onCancel(upload.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                <span>{formatBytes(upload.uploadedBytes)} / {formatBytes(upload.fileSize)}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {speed > 0 && <span>{formatSpeed(speed)}</span>}
                  {eta && <span>ETA: {eta}</span>}
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>

              <div style={{ 
                width: '100%', 
                height: '6px', 
                backgroundColor: '#e9ecef', 
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: getStatusColor(upload.status),
                  transition: 'width 0.3s ease',
                }} />
              </div>

              {upload.error && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  backgroundColor: '#f8d7da', 
                  color: '#721c24',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  Error: {upload.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Cloud Storage Manager Component
export interface CloudStorageManagerProps {
  provider: 'aws-s3' | 'cloudinary' | 'firebase' | 'azure';
  credentials: {
    accessKey?: string;
    secretKey?: string;
    bucketName?: string;
    region?: string;
    apiKey?: string;
  };
  onUploadSuccess: (file: File, url: string, metadata: any) => void;
  onUploadError: (file: File, error: Error) => void;
}

export const CloudStorageManager: React.FC<CloudStorageManagerProps> = ({
  provider,
  credentials,
  onUploadSuccess,
  onUploadError,
}) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    totalBytesUploaded: 0,
  });

  const cloudProviders: Record<string, CloudProvider> = {
    'aws-s3': {
      name: 'Amazon S3',
      upload: async (chunk: Blob, metadata: any) => {
        // Mock S3 multipart upload
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('metadata', JSON.stringify(metadata));
        
        const response = await fetch('/api/s3/upload', {
          method: 'POST',
          headers: {
            'Authorization': `AWS4-HMAC-SHA256 Credential=${credentials.accessKey}`,
            'x-amz-bucket': credentials.bucketName || '',
          },
          body: formData,
        });
        
        return response.json();
      },
      complete: async (uploadId: string, parts: any[]) => {
        const response = await fetch('/api/s3/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId, parts }),
        });
        const result = await response.json();
        return result.url;
      },
      abort: async (uploadId: string) => {
        await fetch(`/api/s3/abort/${uploadId}`, { method: 'DELETE' });
      },
    },
    'cloudinary': {
      name: 'Cloudinary',
      upload: async (chunk: Blob, metadata: any) => {
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('upload_preset', 'default');
        formData.append('api_key', credentials.apiKey || '');
        
        const response = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
          method: 'POST',
          body: formData,
        });
        
        return response.json();
      },
      complete: async (uploadId: string, parts: any[]) => {
        return parts[0]?.secure_url || '';
      },
      abort: async (uploadId: string) => {
        // Cloudinary doesn't require explicit abort
      },
    },
    'firebase': {
      name: 'Firebase Storage',
      upload: async (chunk: Blob, metadata: any) => {
        // Mock Firebase upload
        const response = await fetch('/api/firebase/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            'Content-Type': 'application/octet-stream',
          },
          body: chunk,
        });
        
        return response.json();
      },
      complete: async (uploadId: string, parts: any[]) => {
        const response = await fetch(`/api/firebase/getDownloadURL/${uploadId}`);
        const result = await response.json();
        return result.downloadURL;
      },
      abort: async (uploadId: string) => {
        await fetch(`/api/firebase/delete/${uploadId}`, { method: 'DELETE' });
      },
    },
    'azure': {
      name: 'Azure Blob Storage',
      upload: async (chunk: Blob, metadata: any) => {
        const response = await fetch('/api/azure/upload', {
          method: 'PUT',
          headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Authorization': `Bearer ${credentials.accessKey}`,
          },
          body: chunk,
        });
        
        return response.json();
      },
      complete: async (uploadId: string, parts: any[]) => {
        return `https://${credentials.bucketName}.blob.core.windows.net/${uploadId}`;
      },
      abort: async (uploadId: string) => {
        await fetch(`/api/azure/delete/${uploadId}`, { method: 'DELETE' });
      },
    },
  };

  useEffect(() => {
    // Validate configuration
    const requiredFields = {
      'aws-s3': ['accessKey', 'secretKey', 'bucketName', 'region'],
      'cloudinary': ['apiKey'],
      'firebase': ['apiKey'],
      'azure': ['accessKey', 'bucketName'],
    };

    const required = requiredFields[provider] || [];
    const hasAllRequired = required.every(field => 
      credentials[field as keyof typeof credentials]
    );

    setIsConfigured(hasAllRequired);
  }, [provider, credentials]);

  const uploadToCloud = async (file: File): Promise<string> => {
    const cloudProvider = cloudProviders[provider];
    if (!cloudProvider) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    setUploadStats(prev => ({ ...prev, totalUploads: prev.totalUploads + 1 }));

    try {
      const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const metadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadId,
      };

      // For simplicity, upload entire file as single chunk
      // In production, implement chunked upload for large files
      const result = await cloudProvider.upload(file, metadata);
      const finalUrl = await cloudProvider.complete(uploadId, [result]);

      setUploadStats(prev => ({
        ...prev,
        successfulUploads: prev.successfulUploads + 1,
        totalBytesUploaded: prev.totalBytesUploaded + file.size,
      }));

      onUploadSuccess(file, finalUrl, result);
      return finalUrl;
    } catch (error) {
      setUploadStats(prev => ({ ...prev, failedUploads: prev.failedUploads + 1 }));
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      onUploadError(file, uploadError);
      throw uploadError;
    }
  };

  const currentProvider = cloudProviders[provider];

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <h4>Cloud Storage Manager</h4>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div>
            <strong>Provider:</strong> {currentProvider?.name || provider}
          </div>
          <div>
            <strong>Status:</strong> 
            <span style={{ 
              color: isConfigured ? 'green' : 'red',
              marginLeft: '5px',
            }}>
              {isConfigured ? 'Configured' : 'Missing Credentials'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h5>Upload Statistics</h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '14px' }}>
          <div>Total Uploads: {uploadStats.totalUploads}</div>
          <div>Successful: {uploadStats.successfulUploads}</div>
          <div>Failed: {uploadStats.failedUploads}</div>
          <div>
            Total Uploaded: {Math.round(uploadStats.totalBytesUploaded / (1024 * 1024))}MB
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h5>Configuration</h5>
        {provider === 'aws-s3' && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div>Bucket: {credentials.bucketName || 'Not set'}</div>
            <div>Region: {credentials.region || 'Not set'}</div>
            <div>Access Key: {credentials.accessKey ? '••••••••' : 'Not set'}</div>
          </div>
        )}
        {provider === 'cloudinary' && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div>API Key: {credentials.apiKey ? '••••••••' : 'Not set'}</div>
          </div>
        )}
        {provider === 'firebase' && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div>API Key: {credentials.apiKey ? '••••••••' : 'Not set'}</div>
          </div>
        )}
        {provider === 'azure' && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div>Storage Account: {credentials.bucketName || 'Not set'}</div>
            <div>Access Key: {credentials.accessKey ? '••••••••' : 'Not set'}</div>
          </div>
        )}
      </div>

      {!isConfigured && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '4px',
          fontSize: '14px',
        }}>
          ⚠️ Please configure credentials for {currentProvider?.name || provider} to enable uploads
        </div>
      )}
    </div>
  );
};

// Image Processor Component
export interface ImageProcessorProps {
  file: File;
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    enableResize?: boolean;
    enableCompression?: boolean;
    generateThumbnails?: boolean;
    thumbnailSizes?: number[];
  };
  onProcessComplete: (processedFile: File, thumbnails?: File[]) => void;
  onProcessError: (error: Error) => void;
}

export const ImageProcessor: React.FC<ImageProcessorProps> = ({
  file,
  options,
  onProcessComplete,
  onProcessError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);
  const [processedSize, setProcessedSize] = useState<{ width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    enableResize = true,
    enableCompression = true,
    generateThumbnails = false,
    thumbnailSizes = [150, 300, 600],
  } = options;

  const processImage = useCallback(async () => {
    if (!file.type.startsWith('image/')) {
      onProcessError(new Error('File is not an image'));
      return;
    }

    setIsProcessing(true);

    try {
      const img = new Image();
      const canvas = canvasRef.current;
      
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          setOriginalSize({ width: img.width, height: img.height });
          
          let { width, height } = img;
          
          // Calculate new dimensions if resizing is enabled
          if (enableResize && (width > maxWidth || height > maxHeight)) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = Math.min(width, maxWidth);
              height = width / aspectRatio;
            } else {
              height = Math.min(height, maxHeight);
              width = height * aspectRatio;
            }
          }

          setProcessedSize({ width: Math.round(width), height: Math.round(height) });

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          resolve();
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });

      // Convert canvas to blob
      const processedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create processed image blob'));
            }
          },
          `image/${format}`,
          enableCompression ? quality : 1.0
        );
      });

      // Create processed file
      const processedFile = new File([processedBlob], 
        `${file.name.split('.')[0]}_processed.${format}`,
        { type: `image/${format}` }
      );

      // Generate thumbnails if requested
      let thumbnails: File[] = [];
      if (generateThumbnails) {
        thumbnails = await Promise.all(
          thumbnailSizes.map(async (size) => {
            const thumbCanvas = document.createElement('canvas');
            const thumbCtx = thumbCanvas.getContext('2d');
            
            if (!thumbCtx) throw new Error('Thumbnail canvas context not available');

            const aspectRatio = canvas.width / canvas.height;
            const thumbWidth = aspectRatio >= 1 ? size : size * aspectRatio;
            const thumbHeight = aspectRatio >= 1 ? size / aspectRatio : size;

            thumbCanvas.width = thumbWidth;
            thumbCanvas.height = thumbHeight;

            thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);

            const thumbBlob = await new Promise<Blob>((resolve, reject) => {
              thumbCanvas.toBlob(
                (blob) => blob ? resolve(blob) : reject(new Error('Failed to create thumbnail')),
                `image/${format}`,
                quality
              );
            });

            return new File([thumbBlob], 
              `${file.name.split('.')[0]}_thumb_${size}.${format}`,
              { type: `image/${format}` }
            );
          })
        );
      }

      // Create preview URL
      setProcessedImage(URL.createObjectURL(processedBlob));

      onProcessComplete(processedFile, thumbnails);
    } catch (error) {
      onProcessError(error instanceof Error ? error : new Error('Processing failed'));
    } finally {
      setIsProcessing(false);
    }
  }, [file, maxWidth, maxHeight, quality, format, enableResize, enableCompression, generateThumbnails, thumbnailSizes, onProcessComplete, onProcessError]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <h4>Image Processor</h4>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div>
            <strong>Original:</strong> {file.name}
          </div>
          <div>
            <strong>Size:</strong> {formatBytes(file.size)}
          </div>
          {originalSize && (
            <>
              <div>
                <strong>Dimensions:</strong> {originalSize.width}×{originalSize.height}
              </div>
              <div>
                <strong>Format:</strong> {file.type}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h5>Processing Options</h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px', fontSize: '14px' }}>
          <div>Max Width: {maxWidth}px</div>
          <div>Max Height: {maxHeight}px</div>
          <div>Quality: {Math.round(quality * 100)}%</div>
          <div>Format: {format.toUpperCase()}</div>
          <div>Resize: {enableResize ? 'Yes' : 'No'}</div>
          <div>Compression: {enableCompression ? 'Yes' : 'No'}</div>
          <div>Thumbnails: {generateThumbnails ? `${thumbnailSizes.length} sizes` : 'No'}</div>
        </div>
      </div>

      {isProcessing && (
        <div style={{ 
          padding: '15px', 
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          marginBottom: '15px',
        }}>
          <div style={{ fontSize: '16px', marginBottom: '10px' }}>🔄 Processing image...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Applying resize, compression, and generating thumbnails
          </div>
        </div>
      )}

      {processedImage && processedSize && (
        <div style={{ marginTop: '15px' }}>
          <h5>Processed Result</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
            <div>
              <strong>New Dimensions:</strong> {processedSize.width}×{processedSize.height}
            </div>
            <div>
              <strong>Format:</strong> {format.toUpperCase()}
            </div>
          </div>
          
          <div style={{ 
            maxWidth: '300px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <img 
              src={processedImage} 
              alt="Processed" 
              style={{ 
                width: '100%', 
                height: 'auto',
                display: 'block',
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Demo component showing file upload management
export const FileUploadManagementDemo: React.FC = () => {
  const [uploads, setUploads] = useState<Array<{
    id: string;
    fileName: string;
    fileSize: number;
    uploadedBytes: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
  }>>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUploadStart = (file: File) => {
    const newUpload = {
      id: `upload_${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      uploadedBytes: 0,
      status: 'uploading' as const,
    };
    
    setUploads(prev => [...prev, newUpload]);
  };

  const handleUploadProgress = (file: File, progress: number) => {
    setUploads(prev => prev.map(upload => 
      upload.fileName === file.name 
        ? { ...upload, uploadedBytes: Math.round((progress / 100) * upload.fileSize) }
        : upload
    ));
  };

  const handleUploadComplete = (file: File, result: any) => {
    setUploads(prev => prev.map(upload => 
      upload.fileName === file.name 
        ? { ...upload, status: 'completed', uploadedBytes: upload.fileSize }
        : upload
    ));
  };

  const handleUploadError = (file: File, error: Error) => {
    setUploads(prev => prev.map(upload => 
      upload.fileName === file.name 
        ? { ...upload, status: 'error', error: error.message }
        : upload
    ));
  };

  const handleRetry = (uploadId: string) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId 
        ? { ...upload, status: 'uploading', error: undefined, uploadedBytes: 0 }
        : upload
    ));
  };

  const handleCancel = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <h2>File Upload Management Demo</h2>
      <p>Enterprise-grade file upload system with chunked uploads, progress tracking, and cloud storage integration</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div>
          <h3>File Uploader</h3>
          <FileUploader
            onUploadStart={handleUploadStart}
            onUploadProgress={handleUploadProgress}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFileSize={50 * 1024 * 1024} // 50MB
            allowedTypes={['image/*', 'video/*', 'application/pdf']}
            multiple={true}
          />
        </div>

        <div>
          <h3>Cloud Storage Manager</h3>
          <CloudStorageManager
            provider="aws-s3"
            credentials={{
              accessKey: 'demo-access-key',
              secretKey: 'demo-secret-key',
              bucketName: 'demo-bucket',
              region: 'us-east-1',
            }}
            onUploadSuccess={(file, url, metadata) => {
              console.log('Cloud upload success:', { file: file.name, url, metadata });
            }}
            onUploadError={(file, error) => {
              console.error('Cloud upload error:', { file: file.name, error: error.message });
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Progress Tracker</h3>
        <ProgressTracker
          uploads={uploads}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      </div>

      {selectedFile && (
        <div style={{ marginTop: '20px' }}>
          <h3>Image Processor</h3>
          <ImageProcessor
            file={selectedFile}
            options={{
              maxWidth: 1200,
              maxHeight: 800,
              quality: 0.8,
              format: 'jpeg',
              enableResize: true,
              enableCompression: true,
              generateThumbnails: true,
              thumbnailSizes: [150, 300, 600],
            }}
            onProcessComplete={(processedFile, thumbnails) => {
              console.log('Image processing complete:', {
                original: selectedFile.name,
                processed: processedFile.name,
                thumbnails: thumbnails?.map(t => t.name),
              });
            }}
            onProcessError={(error) => {
              console.error('Image processing error:', error.message);
            }}
          />
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Test Image Processing</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setSelectedFile(file);
            }
          }}
          style={{ padding: '8px' }}
        />
      </div>
    </div>
  );
};

export default FileUploadManagementDemo;