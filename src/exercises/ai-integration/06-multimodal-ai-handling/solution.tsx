import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput, Code, ScrollArea, Divider, ActionIcon, Modal, Slider, Switch, Paper, Container, FileInput, Image, Grid, RingProgress, Table } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconX, IconCheck, IconEye, IconDownload, IconAnalyze, IconPhoto, IconMusic, IconVideo, IconFileText, IconSearch, IconFilter, IconShare, IconRefresh } from '@tabler/icons-react';

// ===== MULTIMODAL TYPES =====

interface MultimodalContent {
  id: string;
  type: ContentType;
  data: ContentData;
  metadata: ContentMetadata;
  analysis: AnalysisResult;
  relationships: ContentRelationship[];
}

type ContentType = 'image' | 'audio' | 'video' | 'document' | 'text';

interface ContentData {
  file?: File;
  url?: string;
  blob?: Blob;
  text?: string;
  size: number;
  format: string;
  checksum: string;
}

interface ContentMetadata {
  filename: string;
  uploadTime: number;
  size: number;
  format: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  quality: QualityMetrics;
  technical: TechnicalMetadata;
}

interface QualityMetrics {
  overall: number;
  technical: number;
  content: number;
  accessibility: number;
  recommendations: string[];
}

interface TechnicalMetadata {
  encoding?: string;
  bitrate?: number;
  sampleRate?: number;
  colorSpace?: string;
  compression?: string;
  pages?: number;
}

interface AnalysisResult {
  confidence: number;
  categories: ContentCategory[];
  tags: string[];
  description: string;
  objects?: DetectedObject[];
  text?: ExtractedText;
  audio?: AudioAnalysis;
  sentiment?: SentimentAnalysis;
  summary: string;
}

interface ContentCategory {
  name: string;
  confidence: number;
  hierarchy: string[];
}

interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes: Record<string, any>;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExtractedText {
  full: string;
  blocks: TextBlock[];
  language: string;
  confidence: number;
}

interface TextBlock {
  text: string;
  boundingBox: BoundingBox;
  confidence: number;
  type: 'heading' | 'paragraph' | 'caption' | 'table';
}

interface AudioAnalysis {
  transcript?: string;
  speakers?: SpeakerSegment[];
  music?: MusicAnalysis;
  sounds?: SoundEvent[];
  quality: AudioQualityMetrics;
}

interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
  confidence: number;
}

interface MusicAnalysis {
  genre: string;
  tempo: number;
  key: string;
  energy: number;
  valence: number;
}

interface SoundEvent {
  type: string;
  start: number;
  end: number;
  confidence: number;
}

interface AudioQualityMetrics {
  snr: number;
  clarity: number;
  volume: number;
}

interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: EmotionScore[];
}

interface EmotionScore {
  emotion: string;
  score: number;
}

interface ContentRelationship {
  type: 'temporal' | 'spatial' | 'semantic' | 'contextual';
  source: string;
  target: string;
  confidence: number;
  description: string;
}

interface ProcessingConfig {
  models: ModelSelection;
  quality: QualitySettings;
  performance: PerformanceSettings;
  output: OutputSettings;
}

interface ModelSelection {
  vision: VisionModelConfig;
  audio: AudioModelConfig;
  text: TextModelConfig;
  multimodal: MultimodalModelConfig;
}

interface VisionModelConfig {
  objectDetection: boolean;
  textExtraction: boolean;
  sceneUnderstanding: boolean;
  qualityAssessment: boolean;
}

interface AudioModelConfig {
  speechRecognition: boolean;
  musicAnalysis: boolean;
  soundClassification: boolean;
  qualityAnalysis: boolean;
}

interface TextModelConfig {
  languageDetection: boolean;
  sentimentAnalysis: boolean;
  entityExtraction: boolean;
  summarization: boolean;
}

interface MultimodalModelConfig {
  crossModalCorrelation: boolean;
  contentDescription: boolean;
  similaritySearch: boolean;
  intelligentTagging: boolean;
}

interface QualitySettings {
  minimumConfidence: number;
  enhanceQuality: boolean;
  validateContent: boolean;
  optimizeOutput: boolean;
}

interface PerformanceSettings {
  maxConcurrent: number;
  timeoutMs: number;
  cacheResults: boolean;
  prioritizeAccuracy: boolean;
}

interface OutputSettings {
  includeMetadata: boolean;
  generateThumbnails: boolean;
  exportFormats: string[];
  compressionLevel: number;
}

interface ProcessingResult {
  success: boolean;
  content: MultimodalContent;
  performance: PerformanceMetrics;
  errors: ProcessingError[];
}

interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  modelInferences: number;
  cacheHits: number;
}

interface ProcessingError {
  type: string;
  message: string;
  stage: string;
  recoverable: boolean;
}

interface ProcessingQueue {
  id: string;
  items: QueueItem[];
  status: 'idle' | 'processing' | 'paused' | 'completed' | 'error';
  progress: QueueProgress;
}

interface QueueItem {
  id: string;
  content: ContentData;
  config: ProcessingConfig;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: number;
  completionTime?: number;
  result?: ProcessingResult;
}

interface QueueProgress {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  estimatedTimeRemaining: number;
  overallProgress: number;
}

// ===== MULTIMODAL PROCESSOR HOOK =====

const useMultimodalProcessor = () => {
  const [queue, setQueue] = useState<ProcessingQueue>({
    id: 'main-queue',
    items: [],
    status: 'idle',
    progress: {
      totalItems: 0,
      completedItems: 0,
      failedItems: 0,
      estimatedTimeRemaining: 0,
      overallProgress: 0
    }
  });

  const processContent = async (
    contentData: ContentData,
    config: ProcessingConfig = getDefaultConfig()
  ): Promise<ProcessingResult> => {
    const startTime = Date.now();
    const contentId = 'content_' + Date.now();

    try {
      // Step 1: Format Detection and Validation
      const format = detectContentFormat(contentData);
      const validation = validateContent(contentData, format);
      
      if (!validation.valid) {
        throw new Error('Content validation failed: ' + validation.errors.join(', '));
      }

      // Step 2: Metadata Extraction
      const metadata = await extractMetadata(contentData, format);

      // Step 3: AI-Powered Analysis
      const analysis = await analyzeContent(contentData, format, config);

      // Step 4: Quality Assessment
      const quality = assessContentQuality(contentData, analysis);

      // Step 5: Cross-Modal Correlation (if applicable)
      const relationships = await findContentRelationships(contentId, analysis);

      const content: MultimodalContent = {
        id: contentId,
        type: format,
        data: contentData,
        metadata: { ...metadata, quality },
        analysis,
        relationships
      };

      const performance: PerformanceMetrics = {
        processingTime: Date.now() - startTime,
        memoryUsage: estimateMemoryUsage(contentData),
        modelInferences: countModelInferences(config),
        cacheHits: 0 // Would be tracked in real implementation
      };

      return {
        success: true,
        content,
        performance,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        content: {} as MultimodalContent,
        performance: {
          processingTime: Date.now() - startTime,
          memoryUsage: 0,
          modelInferences: 0,
          cacheHits: 0
        },
        errors: [{
          type: 'processing_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          stage: 'analysis',
          recoverable: true
        }]
      };
    }
  };

  const detectContentFormat = (contentData: ContentData): ContentType => {
    if (contentData.file) {
      const mimeType = contentData.file.type;
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('audio/')) return 'audio';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    }
    return 'text';
  };

  const validateContent = (contentData: ContentData, format: ContentType) => {
    const errors: string[] = [];
    const maxSizes = {
      image: 50 * 1024 * 1024, // 50MB
      audio: 100 * 1024 * 1024, // 100MB
      video: 500 * 1024 * 1024, // 500MB
      document: 25 * 1024 * 1024, // 25MB
      text: 5 * 1024 * 1024 // 5MB
    };

    if (contentData.size > maxSizes[format]) {
      errors.push(`File size exceeds limit for ${format} content`);
    }

    if (contentData.file && !contentData.file.type) {
      errors.push('File type could not be determined');
    }

    return { valid: errors.length === 0, errors };
  };

  const extractMetadata = async (contentData: ContentData, format: ContentType): Promise<ContentMetadata> => {
    const baseMetadata: ContentMetadata = {
      filename: contentData.file?.name || 'unknown',
      uploadTime: Date.now(),
      size: contentData.size,
      format: contentData.format,
      quality: {
        overall: 0,
        technical: 0,
        content: 0,
        accessibility: 0,
        recommendations: []
      },
      technical: {}
    };

    // Format-specific metadata extraction
    switch (format) {
      case 'image':
        if (contentData.file) {
          const img = new Image();
          img.src = URL.createObjectURL(contentData.file);
          await new Promise(resolve => img.onload = resolve);
          baseMetadata.dimensions = { width: img.width, height: img.height };
          baseMetadata.technical.colorSpace = 'RGB'; // Simulated
        }
        break;
      case 'audio':
      case 'video':
        // Would extract duration, bitrate, etc. in real implementation
        baseMetadata.duration = 120; // Simulated
        baseMetadata.technical.bitrate = 128000; // Simulated
        break;
      case 'document':
        baseMetadata.technical.pages = 1; // Simulated
        break;
    }

    return baseMetadata;
  };

  const analyzeContent = async (contentData: ContentData, format: ContentType, config: ProcessingConfig): Promise<AnalysisResult> => {
    // Simulate AI-powered analysis based on content type
    const baseAnalysis: AnalysisResult = {
      confidence: 0.85,
      categories: [
        { name: 'general', confidence: 0.9, hierarchy: ['content', 'general'] }
      ],
      tags: ['uploaded', 'processed'],
      description: 'Content processed successfully',
      summary: 'This content has been analyzed using multimodal AI capabilities'
    };

    switch (format) {
      case 'image':
        return {
          ...baseAnalysis,
          objects: [
            { name: 'object', confidence: 0.8, boundingBox: { x: 10, y: 10, width: 100, height: 100 }, attributes: {} }
          ],
          text: {
            full: 'Sample extracted text',
            blocks: [],
            language: 'en',
            confidence: 0.9
          },
          categories: [
            { name: 'photography', confidence: 0.95, hierarchy: ['media', 'visual', 'photography'] }
          ],
          tags: ['image', 'visual', 'photography']
        };

      case 'audio':
        return {
          ...baseAnalysis,
          audio: {
            transcript: 'Sample audio transcript would appear here',
            speakers: [
              { speaker: 'Speaker 1', start: 0, end: 10, text: 'Hello world', confidence: 0.9 }
            ],
            music: {
              genre: 'classical',
              tempo: 120,
              key: 'C major',
              energy: 0.6,
              valence: 0.7
            },
            sounds: [],
            quality: {
              snr: 25,
              clarity: 0.8,
              volume: 0.7
            }
          },
          categories: [
            { name: 'audio', confidence: 0.92, hierarchy: ['media', 'audio'] }
          ],
          tags: ['audio', 'speech', 'music']
        };

      case 'text':
      case 'document':
        return {
          ...baseAnalysis,
          text: {
            full: contentData.text || 'Document text content',
            blocks: [],
            language: 'en',
            confidence: 0.95
          },
          sentiment: {
            overall: 'neutral',
            confidence: 0.8,
            emotions: [
              { emotion: 'neutral', score: 0.8 },
              { emotion: 'positive', score: 0.15 },
              { emotion: 'negative', score: 0.05 }
            ]
          },
          categories: [
            { name: 'document', confidence: 0.98, hierarchy: ['text', 'document'] }
          ],
          tags: ['document', 'text', 'content']
        };

      default:
        return baseAnalysis;
    }
  };

  const assessContentQuality = (contentData: ContentData, analysis: AnalysisResult): QualityMetrics => {
    const technical = Math.random() * 0.3 + 0.7; // 0.7-1.0
    const content = analysis.confidence;
    const accessibility = Math.random() * 0.4 + 0.6; // 0.6-1.0
    const overall = (technical + content + accessibility) / 3;

    const recommendations: string[] = [];
    if (technical < 0.8) recommendations.push('Consider improving technical quality');
    if (content < 0.8) recommendations.push('Content clarity could be enhanced');
    if (accessibility < 0.8) recommendations.push('Accessibility features could be improved');

    return {
      overall,
      technical,
      content,
      accessibility,
      recommendations
    };
  };

  const findContentRelationships = async (contentId: string, analysis: AnalysisResult): Promise<ContentRelationship[]> => {
    // Simulate finding relationships with other content
    return [
      {
        type: 'semantic',
        source: contentId,
        target: 'related_content_1',
        confidence: 0.75,
        description: 'Similar content topics and themes'
      }
    ];
  };

  const estimateMemoryUsage = (contentData: ContentData): number => {
    return contentData.size * 1.5; // Estimate processing overhead
  };

  const countModelInferences = (config: ProcessingConfig): number => {
    let count = 0;
    if (config.models.vision.objectDetection) count++;
    if (config.models.vision.textExtraction) count++;
    if (config.models.audio.speechRecognition) count++;
    if (config.models.text.sentimentAnalysis) count++;
    return count;
  };

  const getDefaultConfig = (): ProcessingConfig => ({
    models: {
      vision: {
        objectDetection: true,
        textExtraction: true,
        sceneUnderstanding: true,
        qualityAssessment: true
      },
      audio: {
        speechRecognition: true,
        musicAnalysis: true,
        soundClassification: true,
        qualityAnalysis: true
      },
      text: {
        languageDetection: true,
        sentimentAnalysis: true,
        entityExtraction: true,
        summarization: true
      },
      multimodal: {
        crossModalCorrelation: true,
        contentDescription: true,
        similaritySearch: true,
        intelligentTagging: true
      }
    },
    quality: {
      minimumConfidence: 0.7,
      enhanceQuality: true,
      validateContent: true,
      optimizeOutput: true
    },
    performance: {
      maxConcurrent: 3,
      timeoutMs: 30000,
      cacheResults: true,
      prioritizeAccuracy: true
    },
    output: {
      includeMetadata: true,
      generateThumbnails: true,
      exportFormats: ['json', 'csv'],
      compressionLevel: 85
    }
  });

  const addToQueue = (contentData: ContentData, config?: ProcessingConfig) => {
    const queueItem: QueueItem = {
      id: 'item_' + Date.now(),
      content: contentData,
      config: config || getDefaultConfig(),
      priority: 1,
      status: 'pending',
      progress: 0
    };

    setQueue(prev => ({
      ...prev,
      items: [...prev.items, queueItem],
      progress: {
        ...prev.progress,
        totalItems: prev.progress.totalItems + 1
      }
    }));

    return queueItem.id;
  };

  const processQueue = async () => {
    setQueue(prev => ({ ...prev, status: 'processing' }));

    for (const item of queue.items.filter(item => item.status === 'pending')) {
      try {
        setQueue(prev => ({
          ...prev,
          items: prev.items.map(qItem => 
            qItem.id === item.id ? { ...qItem, status: 'processing', startTime: Date.now() } : qItem
          )
        }));

        const result = await processContent(item.content, item.config);
        
        setQueue(prev => ({
          ...prev,
          items: prev.items.map(qItem => 
            qItem.id === item.id 
              ? { ...qItem, status: result.success ? 'completed' : 'failed', progress: 100, result, completionTime: Date.now() }
              : qItem
          ),
          progress: {
            ...prev.progress,
            completedItems: prev.progress.completedItems + (result.success ? 1 : 0),
            failedItems: prev.progress.failedItems + (result.success ? 0 : 1)
          }
        }));

      } catch (error) {
        setQueue(prev => ({
          ...prev,
          items: prev.items.map(qItem => 
            qItem.id === item.id ? { ...qItem, status: 'failed', progress: 100, completionTime: Date.now() } : qItem
          ),
          progress: {
            ...prev.progress,
            failedItems: prev.progress.failedItems + 1
          }
        }));
      }
    }

    setQueue(prev => ({ ...prev, status: 'completed' }));
  };

  const clearQueue = () => {
    setQueue({
      id: 'main-queue',
      items: [],
      status: 'idle',
      progress: {
        totalItems: 0,
        completedItems: 0,
        failedItems: 0,
        estimatedTimeRemaining: 0,
        overallProgress: 0
      }
    });
  };

  return {
    processContent,
    queue,
    addToQueue,
    processQueue,
    clearQueue
  };
};

// ===== CONTENT UPLOADER COMPONENT =====

interface ContentUploaderProps {
  onUpload?: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSize?: number;
}

const ContentUploader: React.FC<ContentUploaderProps> = ({
  onUpload,
  acceptedTypes = ['image/*', 'audio/*', 'video/*', 'application/pdf', 'text/*'],
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024 // 100MB
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { addToQueue, processQueue, queue } = useMultimodalProcessor();

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter(file => file.size <= maxSize);
    
    if (validFiles.length !== selectedFiles.length) {
      notifications.show({
        title: 'Some files rejected',
        message: 'Some files exceeded the size limit and were not uploaded',
        color: 'orange'
      });
    }

    if (validFiles.length + files.length > maxFiles) {
      notifications.show({
        title: 'Too many files',
        message: 'Maximum ' + maxFiles + ' files allowed',
        color: 'orange'
      });
      return;
    }

    setFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
    
    // Add files to processing queue
    validFiles.forEach(file => {
      const contentData: ContentData = {
        file,
        size: file.size,
        format: file.type,
        checksum: 'checksum_' + file.name + file.size
      };
      addToQueue(contentData);
    });

    if (onUpload) {
      onUpload(validFiles);
    }

    // Reset the input
    event.target.value = '';
  }, [maxSize, maxFiles, onUpload, addToQueue, files.length]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startProcessing = async () => {
    setUploading(true);
    try {
      await processQueue();
      notifications.show({
        title: 'Processing Complete',
        message: `Processed ${queue.progress.completedItems} files successfully`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Processing Error',
        message: 'Some files failed to process',
        color: 'red'
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <IconPhoto size={16} />;
    if (file.type.startsWith('audio/')) return <IconMusic size={16} />;
    if (file.type.startsWith('video/')) return <IconVideo size={16} />;
    return <IconFileText size={16} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Stack>
      <Card withBorder style={{ minHeight: 220 }}>
        <Group justify="center" gap="xl" style={{ minHeight: 180, alignItems: 'center' }}>
          <IconUpload size={52} stroke={1.5} />
          <div style={{ textAlign: 'center' }}>
            <Text size="xl" mb="sm">
              Upload Files for AI Analysis
            </Text>
            <Text size="sm" color="dimmed" mb="md">
              Select images, audio, video, or documents for processing
            </Text>
            
            <FileInput
              placeholder="Choose files..."
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileChange}
              disabled={uploading}
              mb="sm"
            />
            
            <Text size="xs" color="dimmed">
              Max file size: {formatFileSize(maxSize)}, Max files: {maxFiles}
            </Text>
          </div>
        </Group>
      </Card>

      {files.length > 0 && (
        <Card>
          <Group justify="space-between" mb="md">
            <Text weight={500}>Uploaded Files ({files.length})</Text>
            <Group>
              <Button
                size="sm"
                onClick={startProcessing}
                loading={uploading}
                disabled={files.length === 0}
                leftSection={<IconAnalyze size={16} />}
              >
                Process Files
              </Button>
              <Button
                size="sm"
                variant="light"
                color="red"
                onClick={() => setFiles([])}
                leftSection={<IconX size={16} />}
              >
                Clear All
              </Button>
            </Group>
          </Group>

          <Stack spacing="xs">
            {files.map((file, index) => (
              <Card key={index} padding="xs" withBorder>
                <Group justify="space-between">
                  <Group>
                    {getFileIcon(file)}
                    <div>
                      <Text size="sm" weight={500}>{file.name}</Text>
                      <Text size="xs" color="dimmed">
                        {formatFileSize(file.size)} • {file.type}
                      </Text>
                    </div>
                  </Group>
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => removeFile(index)}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </Stack>
        </Card>
      )}

      {queue.items.length > 0 && (
        <Card>
          <Text weight={500} mb="md">Processing Queue</Text>
          <Progress
            value={(queue.progress.completedItems / queue.progress.totalItems) * 100}
            mb="md"
          />
          <Group justify="space-between">
            <Text size="sm">
              {queue.progress.completedItems} / {queue.progress.totalItems} completed
            </Text>
            <Badge color={queue.status === 'processing' ? 'blue' : queue.status === 'completed' ? 'green' : 'gray'}>
              {queue.status}
            </Badge>
          </Group>
        </Card>
      )}
    </Stack>
  );
};

// ===== MEDIA ANALYZER COMPONENT =====

interface MediaAnalyzerProps {
  content: MultimodalContent[];
  onAnalysisComplete?: (content: MultimodalContent) => void;
}

const MediaAnalyzer: React.FC<MediaAnalyzerProps> = ({
  content,
  onAnalysisComplete
}) => {
  const [selectedContent, setSelectedContent] = useState<MultimodalContent | null>(null);
  const [analysisConfig, setAnalysisConfig] = useState({
    deepAnalysis: true,
    crossModalCorrelation: true,
    qualityEnhancement: false,
    generateInsights: true
  });

  const analyzeContent = async (content: MultimodalContent) => {
    // Simulate enhanced analysis
    const enhancedAnalysis: AnalysisResult = {
      ...content.analysis,
      confidence: Math.min(content.analysis.confidence + 0.1, 1.0),
      tags: [...content.analysis.tags, 'enhanced', 'analyzed'],
      description: content.analysis.description + ' (Enhanced with deep analysis)',
      summary: 'Enhanced analysis reveals additional insights and improved accuracy in content understanding.'
    };

    const enhancedContent: MultimodalContent = {
      ...content,
      analysis: enhancedAnalysis
    };

    if (onAnalysisComplete) {
      onAnalysisComplete(enhancedContent);
    }

    notifications.show({
      title: 'Analysis Complete',
      message: `Enhanced analysis completed for ${content.metadata.filename}`,
      color: 'green'
    });
  };

  const renderAnalysisResults = (content: MultimodalContent) => {
    const { analysis, metadata } = content;

    return (
      <Stack>
        <Card>
          <Text weight={500} mb="md">Content Overview</Text>
          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" color="dimmed">Confidence</Text>
              <Group>
                <RingProgress
                  size={60}
                  thickness={8}
                  sections={[{ value: analysis.confidence * 100, color: 'blue' }]}
                />
                <Text size="lg" weight={500}>{(analysis.confidence * 100).toFixed(1)}%</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" color="dimmed">Quality Score</Text>
              <Group>
                <RingProgress
                  size={60}
                  thickness={8}
                  sections={[{ value: metadata.quality.overall * 100, color: 'green' }]}
                />
                <Text size="lg" weight={500}>{(metadata.quality.overall * 100).toFixed(1)}%</Text>
              </Group>
            </Grid.Col>
          </Grid>
        </Card>

        <Card>
          <Text weight={500} mb="md">Categories & Tags</Text>
          <Stack spacing="xs">
            {analysis.categories.map((category, index) => (
              <Group key={index} justify="space-between">
                <Badge variant="light">{category.name}</Badge>
                <Text size="sm" color="dimmed">{(category.confidence * 100).toFixed(1)}%</Text>
              </Group>
            ))}
          </Stack>
          <Divider my="md" />
          <Group gap="xs">
            {analysis.tags.map((tag, index) => (
              <Badge key={index} size="sm" variant="outline">{tag}</Badge>
            ))}
          </Group>
        </Card>

        <Card>
          <Text weight={500} mb="md">Analysis Summary</Text>
          <Text size="sm" mb="md">{analysis.summary}</Text>
          <Alert>
            <Text size="sm">{analysis.description}</Text>
          </Alert>
        </Card>

        {content.type === 'image' && analysis.objects && (
          <Card>
            <Text weight={500} mb="md">Detected Objects</Text>
            <Stack spacing="xs">
              {analysis.objects.map((object, index) => (
                <Group key={index} justify="space-between">
                  <Text size="sm">{object.name}</Text>
                  <Badge variant="light">{(object.confidence * 100).toFixed(1)}%</Badge>
                </Group>
              ))}
            </Stack>
          </Card>
        )}

        {content.type === 'audio' && analysis.audio && (
          <Card>
            <Text weight={500} mb="md">Audio Analysis</Text>
            {analysis.audio.transcript && (
              <div>
                <Text size="sm" color="dimmed" mb="xs">Transcript</Text>
                <Code block>{analysis.audio.transcript}</Code>
              </div>
            )}
            {analysis.audio.music && (
              <Grid mt="md">
                <Grid.Col span={6}>
                  <Text size="sm" color="dimmed">Genre</Text>
                  <Badge>{analysis.audio.music.genre}</Badge>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="sm" color="dimmed">Tempo</Text>
                  <Text size="sm">{analysis.audio.music.tempo} BPM</Text>
                </Grid.Col>
              </Grid>
            )}
          </Card>
        )}

        {analysis.sentiment && (
          <Card>
            <Text weight={500} mb="md">Sentiment Analysis</Text>
            <Group justify="space-between" mb="md">
              <Text size="sm">Overall Sentiment</Text>
              <Badge color={
                analysis.sentiment.overall === 'positive' ? 'green' : 
                analysis.sentiment.overall === 'negative' ? 'red' : 'gray'
              }>
                {analysis.sentiment.overall}
              </Badge>
            </Group>
            <Stack spacing="xs">
              {analysis.sentiment.emotions.map((emotion, index) => (
                <Group key={index} justify="space-between">
                  <Text size="sm">{emotion.emotion}</Text>
                  <Progress value={emotion.score * 100} size="sm" style={{ flex: 1, marginLeft: 16 }} />
                  <Text size="xs" color="dimmed">{(emotion.score * 100).toFixed(0)}%</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    );
  };

  return (
    <Stack>
      <Card>
        <Group justify="space-between" mb="md">
          <Text weight={500}>Media Analysis</Text>
          <Group>
            <Switch
              label="Deep Analysis"
              checked={analysisConfig.deepAnalysis}
              onChange={(e) => setAnalysisConfig(prev => ({ ...prev, deepAnalysis: e.target.checked }))}
            />
            <Switch
              label="Cross-Modal"
              checked={analysisConfig.crossModalCorrelation}
              onChange={(e) => setAnalysisConfig(prev => ({ ...prev, crossModalCorrelation: e.target.checked }))}
            />
          </Group>
        </Group>

        <Text size="sm" color="dimmed" mb="md">
          Select content to view detailed analysis results
        </Text>

        <Grid>
          {content.map((item) => (
            <Grid.Col key={item.id} span={4}>
              <Card
                padding="sm"
                withBorder
                style={{
                  cursor: 'pointer',
                  borderColor: selectedContent?.id === item.id ? 'blue' : undefined
                }}
                onClick={() => setSelectedContent(item)}
              >
                <Stack spacing="xs">
                  <Group justify="space-between">
                    <Text size="sm" weight={500} truncate>
                      {item.metadata.filename}
                    </Text>
                    <Badge size="sm" variant="light">
                      {item.type}
                    </Badge>
                  </Group>
                  <Text size="xs" color="dimmed">
                    Confidence: {(item.analysis.confidence * 100).toFixed(1)}%
                  </Text>
                  <Text size="xs" color="dimmed">
                    Quality: {(item.metadata.quality.overall * 100).toFixed(1)}%
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={(e) => {
                      e.stopPropagation();
                      analyzeContent(item);
                    }}
                    leftSection={<IconAnalyze size={12} />}
                  >
                    Enhance
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Card>

      {selectedContent && (
        <Card>
          <Group justify="space-between" mb="md">
            <Text weight={500}>Analysis Results: {selectedContent.metadata.filename}</Text>
            <ActionIcon onClick={() => setSelectedContent(null)}>
              <IconX size={16} />
            </ActionIcon>
          </Group>
          <ScrollArea.Autosize maxHeight={400}>
            {renderAnalysisResults(selectedContent)}
          </ScrollArea.Autosize>
        </Card>
      )}
    </Stack>
  );
};

// ===== RESULTS VIEWER COMPONENT =====

interface ResultsViewerProps {
  results: MultimodalContent[];
  onExport?: (content: MultimodalContent[], format: string) => void;
  onShare?: (content: MultimodalContent) => void;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({
  results,
  onExport,
  onShare
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'confidence' | 'date'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');

  const filteredResults = useMemo(() => {
    let filtered = results.filter(content => {
      const matchesSearch = searchQuery === '' || 
        content.metadata.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.analysis.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        content.analysis.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'all' || content.type === selectedType;
      
      return matchesSearch && matchesType;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.metadata.filename.localeCompare(b.metadata.filename);
        case 'confidence':
          return b.analysis.confidence - a.analysis.confidence;
        case 'date':
          return b.metadata.uploadTime - a.metadata.uploadTime;
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, searchQuery, selectedType, sortBy]);

  const exportResults = (format: 'json' | 'csv' | 'pdf') => {
    if (onExport) {
      onExport(filteredResults, format);
    }
    notifications.show({
      title: 'Export Started',
      message: `Exporting ${filteredResults.length} results as ${format.toUpperCase()}`,
      color: 'blue'
    });
  };

  const renderGridView = () => (
    <Grid>
      {filteredResults.map((content) => (
        <Grid.Col key={content.id} span={4}>
          <Card padding="md" withBorder>
            <Stack spacing="sm">
              <Group justify="space-between">
                <Text size="sm" weight={500} truncate>
                  {content.metadata.filename}
                </Text>
                <Badge size="sm" variant="light">
                  {content.type}
                </Badge>
              </Group>
              
              <Text size="xs" color="dimmed" lineClamp={2}>
                {content.analysis.description}
              </Text>
              
              <Group justify="space-between">
                <div>
                  <Text size="xs" color="dimmed">Confidence</Text>
                  <Text size="sm" weight={500}>
                    {(content.analysis.confidence * 100).toFixed(1)}%
                  </Text>
                </div>
                <div>
                  <Text size="xs" color="dimmed">Quality</Text>
                  <Text size="sm" weight={500}>
                    {(content.metadata.quality.overall * 100).toFixed(1)}%
                  </Text>
                </div>
              </Group>
              
              <Group gap="xs">
                {content.analysis.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} size="xs" variant="outline">{tag}</Badge>
                ))}
                {content.analysis.tags.length > 3 && (
                  <Badge size="xs" variant="outline" color="gray">+{content.analysis.tags.length - 3}</Badge>
                )}
              </Group>
              
              <Group justify="space-between">
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconEye size={12} />}
                >
                  View Details
                </Button>
                <ActionIcon
                  size="sm"
                  variant="light"
                  onClick={() => onShare && onShare(content)}
                >
                  <IconShare size={12} />
                </ActionIcon>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );

  const renderTableView = () => (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Confidence</Table.Th>
          <Table.Th>Quality</Table.Th>
          <Table.Th>Tags</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {filteredResults.map((content) => (
          <Table.Tr key={content.id}>
            <Table.Td>
              <Text size="sm" weight={500}>{content.metadata.filename}</Text>
            </Table.Td>
            <Table.Td>
              <Badge size="sm" variant="light">{content.type}</Badge>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{(content.analysis.confidence * 100).toFixed(1)}%</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{(content.metadata.quality.overall * 100).toFixed(1)}%</Text>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                {content.analysis.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} size="xs" variant="outline">{tag}</Badge>
                ))}
                {content.analysis.tags.length > 2 && (
                  <Badge size="xs" variant="outline" color="gray">+{content.analysis.tags.length - 2}</Badge>
                )}
              </Group>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <ActionIcon size="sm" variant="light">
                  <IconEye size={12} />
                </ActionIcon>
                <ActionIcon size="sm" variant="light" onClick={() => onShare && onShare(content)}>
                  <IconShare size={12} />
                </ActionIcon>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  return (
    <Stack>
      <Card>
        <Group justify="space-between" mb="md">
          <Text weight={500}>Results ({filteredResults.length})</Text>
          <Group>
            <Button.Group>
              <Button
                size="xs"
                variant={viewMode === 'grid' ? 'filled' : 'light'}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                size="xs"
                variant={viewMode === 'table' ? 'filled' : 'light'}
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </Button.Group>
            <Button
              size="sm"
              leftSection={<IconDownload size={16} />}
              onClick={() => exportResults('json')}
            >
              Export
            </Button>
          </Group>
        </Group>

        <Group mb="md">
          <TextInput
            placeholder="Search results..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            value={selectedType}
            onChange={(value) => setSelectedType(value as ContentType | 'all')}
            data={[
              { value: 'all', label: 'All Types' },
              { value: 'image', label: 'Images' },
              { value: 'audio', label: 'Audio' },
              { value: 'video', label: 'Video' },
              { value: 'document', label: 'Documents' },
              { value: 'text', label: 'Text' }
            ]}
            leftSection={<IconFilter size={16} />}
          />
          <Select
            placeholder="Sort by"
            value={sortBy}
            onChange={(value) => setSortBy(value as 'name' | 'confidence' | 'date')}
            data={[
              { value: 'date', label: 'Date' },
              { value: 'name', label: 'Name' },
              { value: 'confidence', label: 'Confidence' }
            ]}
          />
        </Group>
      </Card>

      {filteredResults.length === 0 ? (
        <Card>
          <Text size="sm" color="dimmed" ta="center" py="xl">
            No results found. Try adjusting your search or filters.
          </Text>
        </Card>
      ) : (
        <Card>
          {viewMode === 'grid' ? renderGridView() : renderTableView()}
        </Card>
      )}
    </Stack>
  );
};

// ===== MAIN COMPONENT =====

export const MultimodalAIHandlingExercise: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('uploader');
  const [processedContent, setProcessedContent] = useState<MultimodalContent[]>([]);

  const handleUpload = (files: File[]) => {
    notifications.show({
      title: 'Files Uploaded',
      message: `${files.length} files uploaded successfully`,
      color: 'green'
    });
  };

  const handleAnalysisComplete = (content: MultimodalContent) => {
    setProcessedContent(prev => {
      const existing = prev.find(c => c.id === content.id);
      if (existing) {
        return prev.map(c => c.id === content.id ? content : c);
      } else {
        return [...prev, content];
      }
    });
  };

  const handleExport = (content: MultimodalContent[], format: string) => {
    // Simulate export functionality
    const exportData = content.map(c => ({
      filename: c.metadata.filename,
      type: c.type,
      confidence: c.analysis.confidence,
      quality: c.metadata.quality.overall,
      tags: c.analysis.tags.join(', '),
      description: c.analysis.description
    }));

    console.log('Exporting data:', exportData);
    
    // In a real implementation, this would generate and download the file
    notifications.show({
      title: 'Export Complete',
      message: `Exported ${content.length} items as ${format.toUpperCase()}`,
      color: 'green'
    });
  };

  const handleShare = (content: MultimodalContent) => {
    // Simulate sharing functionality
    notifications.show({
      title: 'Share Link Generated',
      message: `Share link created for ${content.metadata.filename}`,
      color: 'blue'
    });
  };

  // Generate some sample processed content for demonstration
  useEffect(() => {
    const sampleContent: MultimodalContent[] = [
      {
        id: 'sample_1',
        type: 'image',
        data: {
          size: 1024000,
          format: 'image/jpeg',
          checksum: 'checksum_1'
        },
        metadata: {
          filename: 'sample_image.jpg',
          uploadTime: Date.now() - 3600000,
          size: 1024000,
          format: 'image/jpeg',
          dimensions: { width: 1920, height: 1080 },
          quality: {
            overall: 0.92,
            technical: 0.95,
            content: 0.88,
            accessibility: 0.94,
            recommendations: ['Consider adding alt text']
          },
          technical: {
            colorSpace: 'sRGB',
            compression: 'JPEG'
          }
        },
        analysis: {
          confidence: 0.94,
          categories: [
            { name: 'photography', confidence: 0.96, hierarchy: ['media', 'visual', 'photography'] },
            { name: 'landscape', confidence: 0.89, hierarchy: ['content', 'scene', 'landscape'] }
          ],
          tags: ['landscape', 'nature', 'mountains', 'scenic', 'outdoor'],
          description: 'A beautiful landscape photograph showing mountains and natural scenery',
          objects: [
            { name: 'mountain', confidence: 0.95, boundingBox: { x: 0, y: 0, width: 1920, height: 600 }, attributes: {} },
            { name: 'sky', confidence: 0.92, boundingBox: { x: 0, y: 0, width: 1920, height: 400 }, attributes: {} }
          ],
          summary: 'High-quality landscape photograph with excellent composition and natural lighting'
        },
        relationships: []
      },
      {
        id: 'sample_2',
        type: 'audio',
        data: {
          size: 5120000,
          format: 'audio/mp3',
          checksum: 'checksum_2'
        },
        metadata: {
          filename: 'sample_audio.mp3',
          uploadTime: Date.now() - 7200000,
          size: 5120000,
          format: 'audio/mp3',
          duration: 180,
          quality: {
            overall: 0.87,
            technical: 0.85,
            content: 0.89,
            accessibility: 0.88,
            recommendations: ['Consider adding transcript']
          },
          technical: {
            bitrate: 128000,
            sampleRate: 44100
          }
        },
        analysis: {
          confidence: 0.91,
          categories: [
            { name: 'music', confidence: 0.94, hierarchy: ['media', 'audio', 'music'] }
          ],
          tags: ['music', 'instrumental', 'classical', 'piano'],
          description: 'Classical piano piece with excellent audio quality',
          audio: {
            music: {
              genre: 'classical',
              tempo: 72,
              key: 'C major',
              energy: 0.4,
              valence: 0.8
            },
            quality: {
              snr: 28,
              clarity: 0.9,
              volume: 0.75
            },
            sounds: [],
            speakers: []
          },
          summary: 'Beautiful classical piano composition with high audio fidelity'
        },
        relationships: []
      }
    ];
    
    setProcessedContent(sampleContent);
  }, []);

  return (
    <Container size="xl" p="md">
      <Stack>
        <div>
          <h1>Multimodal AI Handling</h1>
          <p>Advanced multimodal AI integration and content processing for diverse input types</p>
        </div>

        <Tabs value={selectedDemo} onChange={setSelectedDemo || ''}>
          {/* @ts-ignore */}
          <Tabs.List>
            <Tabs.Tab value="uploader">Content Uploader</Tabs.Tab>
            <Tabs.Tab value="analyzer">Media Analyzer</Tabs.Tab>
            <Tabs.Tab value="results">Results Viewer</Tabs.Tab>
          </Tabs.List>

          {/* @ts-ignore */}
          <Tabs.Panel value="uploader" pt="md">
            <ContentUploader
              onUpload={handleUpload}
              acceptedTypes={['image/*', 'audio/*', 'video/*', 'application/pdf']}
              maxFiles={10}
              maxSize={100 * 1024 * 1024}
            />
          </Tabs.Panel>

          {/* @ts-ignore */}
          <Tabs.Panel value="analyzer" pt="md">
            <MediaAnalyzer
              content={processedContent}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </Tabs.Panel>

          {/* @ts-ignore */}
          <Tabs.Panel value="results" pt="md">
            <ResultsViewer
              results={processedContent}
              onExport={handleExport}
              onShare={handleShare}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default MultimodalAIHandlingExercise;