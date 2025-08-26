import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput, Code, ScrollArea, Divider, ActionIcon, Modal, Slider, Switch, Paper, Container } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconSettings, IconCopy, IconCheck, IconX, IconRefresh, IconAdjustments, IconBolt, IconClock } from '@tabler/icons-react';

// ===== STREAMING UI TYPES =====

interface StreamingUIConfig {
  renderMode: 'character' | 'word' | 'chunk' | 'adaptive';
  speed: StreamingSpeed;
  animation: AnimationConfig;
  interruption: InterruptionConfig;
  progress: ProgressConfig;
  markdown: MarkdownConfig;
}

interface StreamingSpeed {
  base: number;
  variance: number;
  acceleration: number;
  punctuationDelay: number;
  lineBreakDelay: number;
}

interface AnimationConfig {
  transitions: boolean;
  easing: string;
  duration: number;
  stagger: number;
}

interface InterruptionConfig {
  allowPause: boolean;
  allowCancel: boolean;
  preserveState: boolean;
  resumePosition: boolean;
}

interface ProgressConfig {
  showProgress: boolean;
  showTimeEstimate: boolean;
  showSpeed: boolean;
  updateInterval: number;
}

interface MarkdownConfig {
  enableSyntaxHighlighting: boolean;
  enableCodeCopy: boolean;
  enableLinkPreviews: boolean;
  sanitizeContent: boolean;
}

interface StreamState {
  status: 'idle' | 'streaming' | 'paused' | 'completed' | 'cancelled' | 'error';
  position: number;
  totalLength: number;
  speed: number;
  startTime: number;
  pauseTime?: number;
  completionTime?: number;
  error?: string;
}

interface ProgressEstimate {
  percentage: number;
  remainingTime: number;
  confidence: number;
  milestones: Milestone[];
}

interface Milestone {
  position: number;
  type: string;
  description: string;
  timestamp: number;
}

interface ParsedContent {
  type: 'text' | 'heading' | 'code' | 'list' | 'table' | 'link' | 'image';
  content: string;
  metadata?: Record<string, any>;
  children?: ParsedContent[];
}

interface StreamMetrics {
  charactersPerSecond: number;
  wordsPerMinute: number;
  accuracy: number;
  totalTime: number;
  pauseCount: number;
  errorCount: number;
}

// ===== STREAMING MARKDOWN COMPONENT =====

interface StreamingMarkdownProps {
  content: string;
  speed?: number;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  config?: Partial<MarkdownConfig>;
}

const useStreamingMarkdown = (content: string, speed: number = 50) => {
  const [renderedContent, setRenderedContent] = useState('');
  const [position, setPosition] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(0);

  const parseMarkdownChunk = useCallback((chunk: string): ParsedContent[] => {
    const lines = chunk.split('\n');
    const parsed: ParsedContent[] = [];

    for (const line of lines) {
      if (line.startsWith('# ')) {
        parsed.push({ type: 'heading', content: line.substring(2), metadata: { level: 1 } });
      } else if (line.startsWith('## ')) {
        parsed.push({ type: 'heading', content: line.substring(3), metadata: { level: 2 } });
      } else if (line.startsWith('```')) {
        parsed.push({ type: 'code', content: line.substring(3), metadata: { language: line.substring(3) } });
      } else if (line.startsWith('- ')) {
        parsed.push({ type: 'list', content: line.substring(2), metadata: { listType: 'unordered' } });
      } else if (line.match(/^\[.*\]\(.*\)$/)) {
        const match = line.match(/^\[(.*)\]\((.*)\)$/);
        if (match) {
          parsed.push({ type: 'link', content: match[1], metadata: { url: match[2] } });
        }
      } else {
        parsed.push({ type: 'text', content: line });
      }
    }

    return parsed;
  }, []);

  const renderMarkdownElement = useCallback((element: ParsedContent): string => {
    switch (element.type) {
      case 'heading':
        const level = element.metadata?.level || 1;
        return `<h${level} class="streaming-heading">${element.content}</h${level}>`;
      case 'code':
        if (element.metadata?.language) {
          return `<div class="code-block"><div class="code-header">${element.metadata.language}</div><pre><code class="language-${element.metadata.language}">${element.content}</code></pre></div>`;
        }
        return `<pre><code>${element.content}</code></pre>`;
      case 'list':
        return `<li class="streaming-list-item">${element.content}</li>`;
      case 'link':
        return `<a href="${element.metadata?.url}" class="streaming-link" target="_blank">${element.content}</a>`;
      case 'text':
        return `<p class="streaming-paragraph">${element.content}</p>`;
      default:
        return element.content;
    }
  }, []);

  const startStreaming = useCallback(() => {
    if (isStreaming || position >= content.length) return;
    
    setIsStreaming(true);
    setIsPaused(false);
    lastUpdateRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setPosition(prev => {
        if (prev >= content.length) {
          setIsStreaming(false);
          clearInterval(intervalRef.current!);
          return prev;
        }

        const now = Date.now();
        const elapsed = now - lastUpdateRef.current;
        const charactersToAdd = Math.max(1, Math.floor((elapsed / 1000) * (speed / 60)));
        
        lastUpdateRef.current = now;
        return Math.min(prev + charactersToAdd, content.length);
      });
    }, 16); // ~60fps
  }, [content.length, isStreaming, position, speed]);

  const pauseStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsStreaming(false);
    setIsPaused(true);
  }, []);

  const resumeStreaming = useCallback(() => {
    if (isPaused && position < content.length) {
      startStreaming();
    }
  }, [isPaused, position, content.length, startStreaming]);

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsStreaming(false);
    setIsPaused(false);
    setPosition(0);
    setRenderedContent('');
  }, []);

  const resetStreaming = useCallback(() => {
    stopStreaming();
    setPosition(0);
    setRenderedContent('');
  }, [stopStreaming]);

  // Update rendered content when position changes
  useEffect(() => {
    const currentChunk = content.substring(0, position);
    const parsedContent = parseMarkdownChunk(currentChunk);
    const rendered = parsedContent.map(renderMarkdownElement).join('\n');
    setRenderedContent(rendered);
  }, [position, content, parseMarkdownChunk, renderMarkdownElement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    renderedContent,
    position,
    isStreaming,
    isPaused,
    progress: content.length > 0 ? (position / content.length) * 100 : 0,
    startStreaming,
    pauseStreaming,
    resumeStreaming,
    stopStreaming,
    resetStreaming
  };
};

const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({
  content,
  speed = 50,
  onComplete,
  onProgress,
  config = {}
}) => {
  const {
    renderedContent,
    position,
    isStreaming,
    isPaused,
    progress,
    startStreaming,
    pauseStreaming,
    resumeStreaming,
    stopStreaming,
    resetStreaming
  } = useStreamingMarkdown(content, speed);

  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    onProgress?.(progress);
  }, [progress, onProgress]);

  useEffect(() => {
    if (progress >= 100 && !isStreaming) {
      onComplete?.();
    }
  }, [progress, isStreaming, onComplete]);

  return (
    <Stack>
      {showControls && (
        <Group>
          <Button
            onClick={isStreaming ? pauseStreaming : isPaused ? resumeStreaming : startStreaming}
            leftSection={isStreaming ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
            disabled={progress >= 100 && !isPaused}
          >
            {isStreaming ? 'Pause' : isPaused ? 'Resume' : 'Start'}
          </Button>
          <Button
            onClick={stopStreaming}
            leftSection={<IconPlayerStop size={16} />}
            variant="outline"
          >
            Stop
          </Button>
          <Button
            onClick={resetStreaming}
            leftSection={<IconRefresh size={16} />}
            variant="subtle"
          >
            Reset
          </Button>
          <Progress value={progress} size="sm" style={{ flex: 1 }} />
          <Text size="xs">{progress.toFixed(1)}%</Text>
        </Group>
      )}
      
      <Paper p="md" withBorder style={{ minHeight: 300, maxHeight: 500, overflow: 'auto' }}>
        <div
          className="streaming-markdown-content"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
          style={{ 
            fontFamily: 'var(--mantine-font-family)',
            lineHeight: 1.6,
            color: 'var(--mantine-color-text)'
          }}
        />
        {isStreaming && (
          <span className="streaming-cursor" style={{
            display: 'inline-block',
            width: '2px',
            height: '1.2em',
            backgroundColor: 'var(--mantine-color-blue-6)',
            animation: 'blink 1s infinite',
            marginLeft: '1px'
          }} />
        )}
      </Paper>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .streaming-heading {
          color: var(--mantine-color-blue-6);
          margin: 1rem 0 0.5rem 0;
        }
        .streaming-paragraph {
          margin: 0.5rem 0;
        }
        .streaming-link {
          color: var(--mantine-color-blue-6);
          text-decoration: underline;
        }
        .code-block {
          background: var(--mantine-color-gray-1);
          border-radius: 4px;
          margin: 1rem 0;
          overflow: hidden;
        }
        .code-header {
          background: var(--mantine-color-gray-3);
          padding: 0.5rem;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .code-block pre {
          margin: 0;
          padding: 1rem;
          background: transparent;
          overflow-x: auto;
        }
      `}</style>
    </Stack>
  );
};

// ===== TYPEWRITER EFFECT COMPONENT =====

interface TypewriterEffectProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  showCursor?: boolean;
  cursorColor?: string;
  className?: string;
}

const useTypewriterEffect = (text: string, speed: number = 50, delay: number = 0) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const indexRef = useRef(0);

  const startTyping = useCallback(() => {
    if (isTyping || isComplete) return;
    
    setIsTyping(true);
    setIsComplete(false);
    indexRef.current = 0;
    setDisplayText('');

    const typeNextCharacter = () => {
      if (indexRef.current < text.length) {
        setDisplayText(prev => prev + text[indexRef.current]);
        indexRef.current++;
        
        // Variable delays for more natural typing
        const char = text[indexRef.current - 1];
        let nextDelay = speed;
        
        if (char === '.' || char === '!' || char === '?') {
          nextDelay *= 3; // Longer pause after sentences
        } else if (char === ',' || char === ';' || char === ':') {
          nextDelay *= 2; // Medium pause after punctuation
        } else if (char === ' ') {
          nextDelay *= 1.2; // Slight pause after words
        }
        
        // Add random variance (±20%)
        nextDelay *= (0.8 + Math.random() * 0.4);
        
        timeoutRef.current = setTimeout(typeNextCharacter, nextDelay);
      } else {
        setIsTyping(false);
        setIsComplete(true);
      }
    };

    timeoutRef.current = setTimeout(typeNextCharacter, delay);
  }, [text, speed, delay, isTyping, isComplete]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsTyping(false);
  }, []);

  const resetTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsTyping(false);
    setIsComplete(false);
    setDisplayText('');
    indexRef.current = 0;
  }, []);

  const skipToEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayText(text);
    setIsTyping(false);
    setIsComplete(true);
    indexRef.current = text.length;
  }, [text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    displayText,
    isTyping,
    isComplete,
    progress: text.length > 0 ? (displayText.length / text.length) * 100 : 0,
    startTyping,
    stopTyping,
    resetTyping,
    skipToEnd
  };
};

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  text,
  speed = 50,
  delay = 0,
  onComplete,
  showCursor = true,
  cursorColor = '#228be6',
  className = ''
}) => {
  const {
    displayText,
    isTyping,
    isComplete,
    progress,
    startTyping,
    stopTyping,
    resetTyping,
    skipToEnd
  } = useTypewriterEffect(text, speed, delay);

  useEffect(() => {
    if (isComplete) {
      onComplete?.();
    }
  }, [isComplete, onComplete]);

  return (
    <div className={className}>
      <Group mb="md">
        <Button onClick={startTyping} disabled={isTyping || isComplete} size="sm">
          Start Typing
        </Button>
        <Button onClick={stopTyping} disabled={!isTyping} size="sm" variant="outline">
          Stop
        </Button>
        <Button onClick={resetTyping} size="sm" variant="subtle">
          Reset
        </Button>
        <Button onClick={skipToEnd} disabled={isComplete} size="sm" variant="light">
          Skip to End
        </Button>
        <Progress value={progress} size="sm" style={{ flex: 1 }} />
      </Group>
      
      <Paper p="md" withBorder style={{ minHeight: 200, position: 'relative' }}>
        <div style={{ fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {displayText}
          {showCursor && (isTyping || !isComplete) && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '1.2em',
                backgroundColor: cursorColor,
                animation: 'blink 1s infinite',
                marginLeft: '1px'
              }}
            />
          )}
        </div>
      </Paper>
    </div>
  );
};

// ===== PROGRESS INDICATOR COMPONENT =====

interface ProgressIndicatorProps {
  progress: number;
  speed?: number;
  estimatedTimeRemaining?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const useProgressEstimation = (progress: number, speed: number) => {
  const [startTime] = useState(() => Date.now());
  const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const progressHistoryRef = useRef<Array<{ progress: number; time: number }>>([]);

  useEffect(() => {
    const now = Date.now();
    progressHistoryRef.current.push({ progress, time: now });
    
    // Keep only last 10 data points for better accuracy
    if (progressHistoryRef.current.length > 10) {
      progressHistoryRef.current.shift();
    }

    // Calculate estimated total time based on progress history
    if (progressHistoryRef.current.length >= 2 && progress > 0 && progress < 100) {
      const history = progressHistoryRef.current;
      const firstPoint = history[0];
      const lastPoint = history[history.length - 1];
      
      const progressDelta = lastPoint.progress - firstPoint.progress;
      const timeDelta = lastPoint.time - firstPoint.time;
      
      if (progressDelta > 0 && timeDelta > 0) {
        const progressRate = progressDelta / timeDelta; // progress per ms
        const remaining = 100 - progress;
        const estimatedRemainingMs = remaining / progressRate;
        
        setRemainingTime(Math.max(0, estimatedRemainingMs));
        setEstimatedTotal((now - startTime) + estimatedRemainingMs);
      }
    }
  }, [progress, startTime]);

  const formatTime = useCallback((ms: number | null): string => {
    if (ms === null) return '--:--';
    
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    estimatedTotal: formatTime(estimatedTotal),
    remainingTime: formatTime(remainingTime),
    elapsedTime: formatTime(Date.now() - startTime),
    progressRate: speed
  };
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  speed = 0,
  estimatedTimeRemaining,
  showDetails = true,
  size = 'md'
}) => {
  const { estimatedTotal, remainingTime, elapsedTime, progressRate } = useProgressEstimation(progress, speed);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const animation = setInterval(() => {
      setDisplayProgress(prev => {
        const diff = progress - prev;
        if (Math.abs(diff) < 0.1) return progress;
        return prev + diff * 0.1;
      });
    }, 16);

    return () => clearInterval(animation);
  }, [progress]);

  const progressSize = size === 'sm' ? 'sm' : size === 'lg' ? 'xl' : 'md';
  const circularSize = size === 'sm' ? 60 : size === 'lg' ? 120 : 80;

  return (
    <Stack spacing="sm">
      <Group>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Progress.Root size={progressSize} style={{ width: 200 }}>
            <Progress.Section value={displayProgress} color="blue">
              <Progress.Label>{displayProgress.toFixed(1)}%</Progress.Label>
            </Progress.Section>
          </Progress.Root>
          
          {/* Circular progress indicator */}
          <div style={{ marginLeft: 16 }}>
            <svg width={circularSize} height={circularSize} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={circularSize / 2}
                cy={circularSize / 2}
                r={(circularSize - 10) / 2}
                fill="none"
                stroke="var(--mantine-color-gray-3)"
                strokeWidth="6"
              />
              <circle
                cx={circularSize / 2}
                cy={circularSize / 2}
                r={(circularSize - 10) / 2}
                fill="none"
                stroke="var(--mantine-color-blue-6)"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * ((circularSize - 10) / 2)}`}
                strokeDashoffset={`${2 * Math.PI * ((circularSize - 10) / 2) * (1 - displayProgress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: circularSize,
                height: circularSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size === 'sm' ? '0.8rem' : size === 'lg' ? '1.2rem' : '1rem',
                fontWeight: 'bold'
              }}
            >
              {Math.round(displayProgress)}%
            </div>
          </div>
        </div>
      </Group>

      {showDetails && (
        <Group spacing="xl">
          <div>
            <Text size="xs" color="dimmed">Elapsed</Text>
            <Text size="sm" weight={500}>{elapsedTime}</Text>
          </div>
          <div>
            <Text size="xs" color="dimmed">Remaining</Text>
            <Text size="sm" weight={500}>{remainingTime}</Text>
          </div>
          <div>
            <Text size="xs" color="dimmed">Total Est.</Text>
            <Text size="sm" weight={500}>{estimatedTotal}</Text>
          </div>
          <div>
            <Text size="xs" color="dimmed">Speed</Text>
            <Text size="sm" weight={500}>{speed.toFixed(1)} cps</Text>
          </div>
        </Group>
      )}
    </Stack>
  );
};

// ===== INTERRUPTIBLE STREAM COMPONENT =====

interface InterruptibleStreamProps {
  content: string;
  autoStart?: boolean;
  config?: Partial<StreamingUIConfig>;
  onStateChange?: (state: StreamState) => void;
}

const useInterruptibleStream = (content: string, config: Partial<StreamingUIConfig> = {}) => {
  const [state, setState] = useState<StreamState>({
    status: 'idle',
    position: 0,
    totalLength: content.length,
    speed: config.speed?.base || 50,
    startTime: 0
  });

  const [streamedContent, setStreamedContent] = useState('');
  const intervalRef = useRef<NodeJS.Timeout>();
  const speedRef = useRef(config.speed?.base || 50);

  const updateState = useCallback((updates: Partial<StreamState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const startStream = useCallback(() => {
    if (state.status === 'streaming') return;
    
    const startTime = Date.now();
    updateState({ 
      status: 'streaming', 
      startTime: state.status === 'paused' ? state.startTime : startTime,
      pauseTime: undefined 
    });

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.position >= prev.totalLength) {
          clearInterval(intervalRef.current!);
          return {
            ...prev,
            status: 'completed',
            completionTime: Date.now()
          };
        }

        const newPosition = Math.min(prev.position + 1, prev.totalLength);
        const currentSpeed = (newPosition - prev.position) / ((Date.now() - prev.startTime) / 1000);
        
        return {
          ...prev,
          position: newPosition,
          speed: currentSpeed > 0 ? currentSpeed : prev.speed
        };
      });
    }, 1000 / speedRef.current);
  }, [state.status, state.startTime, updateState]);

  const pauseStream = useCallback(() => {
    if (state.status !== 'streaming') return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    updateState({ status: 'paused', pauseTime: Date.now() });
  }, [state.status, updateState]);

  const resumeStream = useCallback(() => {
    if (state.status !== 'paused') return;
    startStream();
  }, [state.status, startStream]);

  const cancelStream = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    updateState({ status: 'cancelled' });
  }, [updateState]);

  const resetStream = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setState({
      status: 'idle',
      position: 0,
      totalLength: content.length,
      speed: config.speed?.base || 50,
      startTime: 0
    });
    
    setStreamedContent('');
  }, [content.length, config.speed?.base]);

  const adjustSpeed = useCallback((newSpeed: number) => {
    speedRef.current = newSpeed;
    updateState({ speed: newSpeed });
    
    // Restart interval with new speed if currently streaming
    if (state.status === 'streaming' && intervalRef.current) {
      clearInterval(intervalRef.current);
      startStream();
    }
  }, [state.status, startStream, updateState]);

  // Update streamed content when position changes
  useEffect(() => {
    setStreamedContent(content.substring(0, state.position));
  }, [content, state.position]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    streamedContent,
    progress: state.totalLength > 0 ? (state.position / state.totalLength) * 100 : 0,
    startStream,
    pauseStream,
    resumeStream,
    cancelStream,
    resetStream,
    adjustSpeed
  };
};

const InterruptibleStream: React.FC<InterruptibleStreamProps> = ({
  content,
  autoStart = false,
  config = {},
  onStateChange
}) => {
  const {
    state,
    streamedContent,
    progress,
    startStream,
    pauseStream,
    resumeStream,
    cancelStream,
    resetStream,
    adjustSpeed
  } = useInterruptibleStream(content, config);

  const [speedSetting, setSpeedSetting] = useState(config.speed?.base || 50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  useEffect(() => {
    if (autoStart && state.status === 'idle') {
      startStream();
    }
  }, [autoStart, state.status, startStream]);

  const getStatusColor = (status: StreamState['status']) => {
    switch (status) {
      case 'streaming': return 'blue';
      case 'paused': return 'yellow';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: StreamState['status']) => {
    switch (status) {
      case 'streaming': return <IconPlayerPlay size={16} />;
      case 'paused': return <IconPlayerPause size={16} />;
      case 'completed': return <IconCheck size={16} />;
      case 'cancelled': return <IconX size={16} />;
      case 'error': return <IconX size={16} />;
      default: return <IconPlayerStop size={16} />;
    }
  };

  return (
    <Stack>
      {/* Status and Controls */}
      <Group>
        <Badge color={getStatusColor(state.status)} leftSection={getStatusIcon(state.status)}>
          {state.status.toUpperCase()}
        </Badge>
        
        <Group spacing="xs">
          <Button
            onClick={state.status === 'streaming' ? pauseStream : 
                    state.status === 'paused' ? resumeStream : startStream}
            disabled={state.status === 'completed' || state.status === 'cancelled'}
            size="sm"
          >
            {state.status === 'streaming' ? 'Pause' : 
             state.status === 'paused' ? 'Resume' : 'Start'}
          </Button>
          
          <Button
            onClick={cancelStream}
            disabled={state.status === 'idle' || state.status === 'completed' || state.status === 'cancelled'}
            size="sm"
            variant="outline"
            color="red"
          >
            Cancel
          </Button>
          
          <Button onClick={resetStream} size="sm" variant="subtle">
            Reset
          </Button>
        </Group>

        <ActionIcon onClick={() => setShowAdvanced(!showAdvanced)} variant="subtle">
          <IconSettings size={16} />
        </ActionIcon>
      </Group>

      {/* Progress Indicator */}
      <ProgressIndicator
        progress={progress}
        speed={state.speed}
        showDetails={showAdvanced}
      />

      {/* Advanced Controls */}
      {showAdvanced && (
        <Paper p="md" withBorder>
          <Stack spacing="sm">
            <div>
              <Text size="sm" weight={500} mb="xs">Speed Control</Text>
              <Slider
                value={speedSetting}
                onChange={setSpeedSetting}
                onChangeEnd={adjustSpeed}
                min={10}
                max={200}
                step={10}
                marks={[
                  { value: 10, label: 'Slow' },
                  { value: 50, label: 'Normal' },
                  { value: 100, label: 'Fast' },
                  { value: 200, label: 'Very Fast' }
                ]}
                style={{ marginTop: 20 }}
              />
            </div>
            
            <Group>
              <div>
                <Text size="xs" color="dimmed">Position</Text>
                <Text size="sm">{state.position} / {state.totalLength}</Text>
              </div>
              <div>
                <Text size="xs" color="dimmed">Current Speed</Text>
                <Text size="sm">{state.speed.toFixed(1)} cps</Text>
              </div>
              {state.startTime > 0 && (
                <div>
                  <Text size="xs" color="dimmed">Elapsed</Text>
                  <Text size="sm">{((Date.now() - state.startTime) / 1000).toFixed(1)}s</Text>
                </div>
              )}
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Content Display */}
      <Paper p="md" withBorder style={{ minHeight: 300, maxHeight: 500, overflow: 'auto' }}>
        <div style={{ 
          fontFamily: 'monospace', 
          lineHeight: 1.6, 
          whiteSpace: 'pre-wrap',
          position: 'relative'
        }}>
          {streamedContent}
          {state.status === 'streaming' && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '1.2em',
                backgroundColor: 'var(--mantine-color-blue-6)',
                animation: 'blink 1s infinite',
                marginLeft: '1px'
              }}
            />
          )}
        </div>
      </Paper>

      {/* Stream Metrics */}
      {(state.status === 'completed' || state.status === 'cancelled') && (
        <Alert color={state.status === 'completed' ? 'green' : 'yellow'}>
          <Text size="sm">
            Stream {state.status}. 
            {state.completionTime && state.startTime && (
              <> Total time: {((state.completionTime - state.startTime) / 1000).toFixed(1)}s</>
            )}
          </Text>
        </Alert>
      )}
    </Stack>
  );
};

// ===== MAIN COMPONENT =====

export const StreamingUIPatternsExercise: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('markdown');
  
  const sampleContent = {
    markdown: `# Streaming Markdown Demo

This is a **demonstration** of real-time markdown streaming with syntax highlighting and progressive rendering.

## Features

- Real-time parsing
- Syntax highlighting  
- Progressive rendering
- User controls

### Code Example

\`\`\`javascript
function streamingDemo() {
  console.log("Streaming in progress...");
  return "Amazing results!";
}
\`\`\`

### List Example

- ✅ Streaming markdown
- ✅ Typewriter effects
- ✅ Progress tracking
- ✅ User interruption

[Visit our docs](https://example.com) for more information.

> This content is being streamed in real-time with configurable speed and natural animation patterns.`,

    typewriter: `Welcome to the Advanced Streaming UI Patterns exercise!

This typewriter effect demonstrates natural typing patterns with:
• Variable character timing
• Punctuation pauses
• Random speed variations
• Realistic typing rhythm

Perfect for creating engaging AI interfaces that feel human and responsive.`,

    interruptible: `This is a long piece of content designed to demonstrate interruptible streaming capabilities. 

You can start, pause, resume, cancel, and adjust the speed of this stream at any time. The system maintains state across interruptions and provides accurate progress tracking.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

The streaming system supports various rendering modes including character-by-character, word-by-word, and adaptive chunking based on content analysis and user preferences.`
  };

  return (
    <Container size="xl" p="md">
      <Stack>
        <div>
          <h1>Streaming UI Patterns</h1>
          <p>Advanced streaming UI patterns and user experience design for AI applications</p>
        </div>

        <Tabs value={selectedDemo} onChange={setSelectedDemo || ''}>
          {/* @ts-ignore */}
          <Tabs.List>
            <Tabs.Tab value="markdown">Streaming Markdown</Tabs.Tab>
            <Tabs.Tab value="typewriter">Typewriter Effect</Tabs.Tab>
            <Tabs.Tab value="progress">Progress Indicator</Tabs.Tab>
            <Tabs.Tab value="interruptible">Interruptible Stream</Tabs.Tab>
          </Tabs.List>

          {/* @ts-ignore */}
          <Tabs.Panel value="markdown" pt="md">
            <Card>
              <Text size="sm" color="dimmed" mb="md">
                Real-time markdown parsing and rendering with syntax highlighting
              </Text>
              <StreamingMarkdown
                content={sampleContent.markdown}
                speed={80}
                onComplete={() => notifications.show({
                  title: 'Streaming Complete',
                  message: 'Markdown streaming finished successfully',
                  color: 'green'
                })}
              />
            </Card>
          </Tabs.Panel>

          {/* @ts-ignore */}
          <Tabs.Panel value="typewriter" pt="md">
            <Card>
              <Text size="sm" color="dimmed" mb="md">
                Natural typewriter animation with variable timing
              </Text>
              <TypewriterEffect
                text={sampleContent.typewriter}
                speed={60}
                onComplete={() => notifications.show({
                  title: 'Typing Complete',
                  message: 'Typewriter animation finished',
                  color: 'blue'
                })}
                showCursor={true}
              />
            </Card>
          </Tabs.Panel>

          {/* @ts-ignore */}
          <Tabs.Panel value="progress" pt="md">
            <Card>
              <Text size="sm" color="dimmed" mb="md">
                Intelligent progress tracking with time estimation
              </Text>
              <Stack spacing="xl">
                <ProgressIndicator progress={25} speed={45} showDetails={true} size="md" />
                <ProgressIndicator progress={75} speed={62} showDetails={true} size="lg" />
                <ProgressIndicator progress={90} speed={38} showDetails={false} size="sm" />
              </Stack>
            </Card>
          </Tabs.Panel>

          {/* @ts-ignore */}
          <Tabs.Panel value="interruptible" pt="md">
            <Card>
              <Text size="sm" color="dimmed" mb="md">
                User-controlled streaming with pause, resume, and cancellation
              </Text>
              <InterruptibleStream
                content={sampleContent.interruptible}
                config={{
                  speed: { base: 60, variance: 0.2, acceleration: 1.1, punctuationDelay: 2, lineBreakDelay: 3 },
                  interruption: { allowPause: true, allowCancel: true, preserveState: true, resumePosition: true }
                }}
                onStateChange={(state) => {
                  console.log('Stream state changed:', state);
                }}
              />
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default StreamingUIPatternsExercise;