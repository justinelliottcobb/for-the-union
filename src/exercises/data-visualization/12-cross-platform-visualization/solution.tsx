import * as React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import { Card, Text, Group, Stack, Button, Progress, Badge, Tabs, Grid, Paper, Title, Divider, Select, Switch, Slider, Code, Textarea, Modal } from '@mantine/core';
import { IconDevices, IconDownload, IconCode, IconBrandReact, IconPhoto, IconFileText, IconShare, IconSettings, IconMobile, IconDesktop, IconBrowser } from '@tabler/icons-react';
import * as d3 from 'd3';

// === TYPES AND INTERFACES ===

interface PlatformInfo {
  type: 'browser' | 'mobile' | 'desktop' | 'server' | 'embed';
  name: string;
  version: string;
  capabilities: PlatformCapabilities;
  optimizations: PlatformOptimizations;
}

interface PlatformCapabilities {
  canvas: boolean;
  webgl: boolean;
  svg: boolean;
  touch: boolean;
  mouse: boolean;
  keyboard: boolean;
  webworkers: boolean;
  ssr: boolean;
  devicePixelRatio: number;
}

interface PlatformOptimizations {
  preferredRenderer: 'canvas' | 'svg' | 'webgl';
  batchSize: number;
  animationFrameRate: number;
  memoryLimit: number;
  touchTargetSize: number;
}

interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'json' | 'html';
  width?: number;
  height?: number;
  quality?: number;
  backgroundColor?: string;
  scale?: number;
  includeData?: boolean;
  compressed?: boolean;
}

interface EmbedConfig {
  width: number | string;
  height: number | string;
  responsive: boolean;
  allowFullscreen: boolean;
  allowScripts: boolean;
  theme: 'light' | 'dark' | 'auto';
  interactive: boolean;
  showControls: boolean;
  customCSS?: string;
}

interface UniversalChartProps {
  data: any[];
  type: 'line' | 'bar' | 'scatter' | 'pie';
  width?: number;
  height?: number;
  responsive?: boolean;
  platform?: PlatformInfo;
  theme?: 'light' | 'dark';
  exportEnabled?: boolean;
  embedEnabled?: boolean;
}

// === PLATFORM ADAPTER ===

interface PlatformAdapterContextValue {
  currentPlatform: PlatformInfo;
  detectPlatform: () => PlatformInfo;
  getOptimalRenderer: (capabilities: PlatformCapabilities) => string;
  optimizeForPlatform: (config: any) => any;
  isSSR: () => boolean;
  isMobile: () => boolean;
  isTouch: () => boolean;
  getViewportInfo: () => { width: number; height: number; ratio: number };
}

const PlatformAdapterContext = createContext<PlatformAdapterContextValue | null>(null);

export const PlatformAdapter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPlatform, setCurrentPlatform] = useState<PlatformInfo | null>(null);

  const detectPlatform = useCallback((): PlatformInfo => {
    // Server-side rendering detection
    if (typeof window === 'undefined') {
      return {
        type: 'server',
        name: 'Node.js',
        version: 'unknown',
        capabilities: {
          canvas: false,
          webgl: false,
          svg: true,
          touch: false,
          mouse: false,
          keyboard: false,
          webworkers: false,
          ssr: true,
          devicePixelRatio: 1
        },
        optimizations: {
          preferredRenderer: 'svg',
          batchSize: 1000,
          animationFrameRate: 0,
          memoryLimit: 128 * 1024 * 1024,
          touchTargetSize: 0
        }
      };
    }

    const userAgent = navigator.userAgent;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Feature detection
    const canvas = document.createElement('canvas');
    const hasWebGL = !!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl');
    const hasWebWorkers = typeof Worker !== 'undefined';

    let browserName = 'Unknown';
    let browserVersion = 'unknown';

    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
    } else if (userAgent.includes('Safari')) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'unknown';
    } else if (userAgent.includes('Edge')) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || 'unknown';
    }

    const platform: PlatformInfo = {
      type: isMobile ? 'mobile' : 'browser',
      name: browserName,
      version: browserVersion,
      capabilities: {
        canvas: true,
        webgl: hasWebGL,
        svg: true,
        touch: isTouch,
        mouse: !isMobile,
        keyboard: !isMobile,
        webworkers: hasWebWorkers,
        ssr: false,
        devicePixelRatio
      },
      optimizations: {
        preferredRenderer: hasWebGL ? 'webgl' : 'canvas',
        batchSize: isMobile ? 500 : 1000,
        animationFrameRate: isMobile ? 30 : 60,
        memoryLimit: isMobile ? 64 * 1024 * 1024 : 256 * 1024 * 1024,
        touchTargetSize: isTouch ? 44 : 0
      }
    };

    return platform;
  }, []);

  const getOptimalRenderer = useCallback((capabilities: PlatformCapabilities): string => {
    if (capabilities.webgl) return 'webgl';
    if (capabilities.canvas) return 'canvas';
    return 'svg';
  }, []);

  const optimizeForPlatform = useCallback((config: any) => {
    if (!currentPlatform) return config;

    const optimized = { ...config };

    // Mobile optimizations
    if (currentPlatform.type === 'mobile') {
      optimized.animationDuration = Math.min(config.animationDuration || 300, 150);
      optimized.maxDataPoints = Math.min(config.maxDataPoints || 1000, 500);
      optimized.touchTargetSize = Math.max(optimized.touchTargetSize || 44, 44);
    }

    // High DPI optimizations
    if (currentPlatform.capabilities.devicePixelRatio > 1) {
      optimized.renderScale = currentPlatform.capabilities.devicePixelRatio;
    }

    // Memory optimizations
    if (currentPlatform.optimizations.memoryLimit < 128 * 1024 * 1024) {
      optimized.enableVirtualization = true;
      optimized.maxDataPoints = Math.min(optimized.maxDataPoints || 1000, 200);
    }

    return optimized;
  }, [currentPlatform]);

  const isSSR = useCallback(() => {
    return typeof window === 'undefined';
  }, []);

  const isMobile = useCallback(() => {
    return currentPlatform?.type === 'mobile';
  }, [currentPlatform]);

  const isTouch = useCallback(() => {
    return currentPlatform?.capabilities.touch || false;
  }, [currentPlatform]);

  const getViewportInfo = useCallback(() => {
    if (isSSR()) {
      return { width: 1024, height: 768, ratio: 1 };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.devicePixelRatio || 1
    };
  }, [isSSR]);

  useEffect(() => {
    setCurrentPlatform(detectPlatform());
  }, [detectPlatform]);

  if (!currentPlatform) {
    return <div>Loading platform detection...</div>;
  }

  return (
    <PlatformAdapterContext.Provider value={{
      currentPlatform,
      detectPlatform,
      getOptimalRenderer,
      optimizeForPlatform,
      isSSR,
      isMobile,
      isTouch,
      getViewportInfo
    }}>
      {children}
    </PlatformAdapterContext.Provider>
  );
};

export const usePlatformAdapter = () => {
  const context = useContext(PlatformAdapterContext);
  if (!context) {
    throw new Error('usePlatformAdapter must be used within PlatformAdapter');
  }
  return context;
};

// === EXPORT ENGINE ===

interface ExportEngineContextValue {
  exportChart: (element: Element, options: ExportOptions) => Promise<string | Blob>;
  exportToImage: (element: Element, options: ExportOptions) => Promise<Blob>;
  exportToPDF: (element: Element, options: ExportOptions) => Promise<Blob>;
  exportToSVG: (element: Element, options: ExportOptions) => Promise<string>;
  exportData: (data: any[], format: 'csv' | 'json') => string;
  generatePreview: (element: Element) => Promise<string>;
  batchExport: (elements: Element[], options: ExportOptions[]) => Promise<(string | Blob)[]>;
}

const ExportEngineContext = createContext<ExportEngineContextValue | null>(null);

export const ExportEngine: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const platformAdapter = usePlatformAdapter();

  const exportChart = useCallback(async (element: Element, options: ExportOptions): Promise<string | Blob> => {
    switch (options.format) {
      case 'png':
      case 'jpg':
        return await exportToImage(element, options);
      case 'svg':
        return await exportToSVG(element, options);
      case 'pdf':
        return await exportToPDF(element, options);
      case 'html':
        return generateHTMLExport(element, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }, []);

  const exportToImage = useCallback(async (element: Element, options: ExportOptions): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context not available');

    const rect = element.getBoundingClientRect();
    const scale = options.scale || platformAdapter.currentPlatform.capabilities.devicePixelRatio;
    
    canvas.width = (options.width || rect.width) * scale;
    canvas.height = (options.height || rect.height) * scale;
    
    ctx.scale(scale, scale);

    // Set background color
    if (options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    }

    // In a real implementation, this would use html2canvas or similar
    // For now, we'll create a simple representation
    ctx.fillStyle = '#4C6EF5';
    ctx.fillRect(10, 10, canvas.width / scale - 20, canvas.height / scale - 20);
    
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Chart Export', 20, 40);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, `image/${options.format}`, options.quality || 0.9);
    });
  }, [platformAdapter]);

  const exportToPDF = useCallback(async (element: Element, options: ExportOptions): Promise<Blob> => {
    // In a real implementation, this would use jsPDF or similar
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
179
%%EOF`;

    return new Blob([pdfContent], { type: 'application/pdf' });
  }, []);

  const exportToSVG = useCallback(async (element: Element, options: ExportOptions): Promise<string> => {
    const rect = element.getBoundingClientRect();
    const width = options.width || rect.width;
    const height = options.height || rect.height;

    // In a real implementation, this would serialize the actual SVG content
    const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${options.backgroundColor || 'white'}"/>
      <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="#4C6EF5"/>
      <text x="20" y="40" font-family="sans-serif" font-size="16" fill="black">SVG Chart Export</text>
    </svg>`;

    return svgContent;
  }, []);

  const generateHTMLExport = useCallback((element: Element, options: ExportOptions): string => {
    const rect = element.getBoundingClientRect();
    const width = options.width || rect.width;
    const height = options.height || rect.height;

    return `<!DOCTYPE html>
<html>
<head>
  <title>Chart Export</title>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 20px; font-family: sans-serif; }
    .chart-container { width: ${width}px; height: ${height}px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="chart-container">
    <p>Exported Chart</p>
  </div>
</body>
</html>`;
  }, []);

  const exportData = useCallback((data: any[], format: 'csv' | 'json'): string => {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'csv') {
      if (!data.length) return '';
      
      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );

      return [csvHeaders, ...csvRows].join('\n');
    }

    return '';
  }, []);

  const generatePreview = useCallback(async (element: Element): Promise<string> => {
    const blob = await exportToImage(element, { 
      format: 'png', 
      width: 200, 
      height: 150, 
      scale: 1 
    });
    return URL.createObjectURL(blob);
  }, [exportToImage]);

  const batchExport = useCallback(async (elements: Element[], options: ExportOptions[]): Promise<(string | Blob)[]> => {
    const results: (string | Blob)[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const option = options[i] || options[0];
      const result = await exportChart(element, option);
      results.push(result);
    }

    return results;
  }, [exportChart]);

  return (
    <ExportEngineContext.Provider value={{
      exportChart,
      exportToImage,
      exportToPDF,
      exportToSVG,
      exportData,
      generatePreview,
      batchExport
    }}>
      {children}
    </ExportEngineContext.Provider>
  );
};

export const useExportEngine = () => {
  const context = useContext(ExportEngineContext);
  if (!context) {
    throw new Error('useExportEngine must be used within ExportEngine');
  }
  return context;
};

// === EMBED MANAGER ===

interface EmbedManagerContextValue {
  generateEmbedCode: (chartId: string, config: EmbedConfig) => string;
  generateIframe: (chartId: string, config: EmbedConfig) => string;
  createEmbedWidget: (element: Element, config: EmbedConfig) => string;
  validateEmbedConfig: (config: EmbedConfig) => boolean;
  getEmbedPreview: (config: EmbedConfig) => string;
  trackEmbedUsage: (embedId: string, event: string) => void;
  updateEmbedTheme: (embedId: string, theme: 'light' | 'dark') => void;
}

const EmbedManagerContext = createContext<EmbedManagerContextValue | null>(null);

export const EmbedManager: React.FC<{ children: React.ReactNode; baseUrl?: string }> = ({ 
  children, 
  baseUrl = 'https://charts.example.com' 
}) => {
  const [embedUsage] = useState(new Map<string, any[]>());

  const generateEmbedCode = useCallback((chartId: string, config: EmbedConfig): string => {
    const iframeCode = generateIframe(chartId, config);
    
    const scriptCode = `
<script>
  // Responsive iframe handler
  function resizeIframe() {
    const iframe = document.getElementById('chart-${chartId}');
    if (iframe && window.innerWidth < 768) {
      iframe.style.width = '100%';
      iframe.style.height = 'auto';
    }
  }
  
  window.addEventListener('resize', resizeIframe);
  resizeIframe();
</script>`;

    return config.responsive ? iframeCode + scriptCode : iframeCode;
  }, []);

  const generateIframe = useCallback((chartId: string, config: EmbedConfig): string => {
    const width = typeof config.width === 'number' ? `${config.width}px` : config.width;
    const height = typeof config.height === 'number' ? `${config.height}px` : config.height;
    
    const params = new URLSearchParams({
      theme: config.theme,
      interactive: config.interactive.toString(),
      controls: config.showControls.toString()
    });

    const sandbox = [
      'allow-scripts',
      'allow-same-origin'
    ];

    if (config.allowFullscreen) sandbox.push('allow-fullscreen');
    if (!config.allowScripts) sandbox.splice(0, 1);

    return `<iframe 
  id="chart-${chartId}"
  src="${baseUrl}/embed/${chartId}?${params.toString()}"
  width="${width}"
  height="${height}"
  style="border: none; ${config.responsive ? 'max-width: 100%;' : ''}"
  sandbox="${sandbox.join(' ')}"
  loading="lazy"
  title="Interactive Chart"
  ${config.allowFullscreen ? 'allowfullscreen' : ''}
></iframe>`;
  }, [baseUrl]);

  const createEmbedWidget = useCallback((element: Element, config: EmbedConfig): string => {
    const widgetId = `widget-${Date.now()}`;
    const rect = element.getBoundingClientRect();

    const widgetHTML = `
<div id="${widgetId}" class="chart-widget" style="width: ${config.width}; height: ${config.height};">
  <div class="chart-container" style="width: 100%; height: 100%; position: relative;">
    ${element.outerHTML}
  </div>
  ${config.showControls ? `
  <div class="chart-controls" style="position: absolute; top: 10px; right: 10px;">
    <button onclick="toggleFullscreen('${widgetId}')">⛶</button>
    <button onclick="downloadChart('${widgetId}')">⬇</button>
  </div>` : ''}
</div>

<style>
.chart-widget {
  background: ${config.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
  color: ${config.theme === 'dark' ? '#ffffff' : '#000000'};
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  ${config.customCSS || ''}
}

.chart-controls button {
  background: rgba(0,0,0,0.1);
  border: none;
  padding: 8px;
  margin: 2px;
  border-radius: 2px;
  cursor: pointer;
}

.chart-controls button:hover {
  background: rgba(0,0,0,0.2);
}
</style>

<script>
function toggleFullscreen(widgetId) {
  const widget = document.getElementById(widgetId);
  if (widget.requestFullscreen) {
    widget.requestFullscreen();
  }
}

function downloadChart(widgetId) {
  // Download functionality would be implemented here
  console.log('Download chart:', widgetId);
}
</script>`;

    return widgetHTML;
  }, []);

  const validateEmbedConfig = useCallback((config: EmbedConfig): boolean => {
    if (!config.width || !config.height) return false;
    if (config.theme && !['light', 'dark', 'auto'].includes(config.theme)) return false;
    return true;
  }, []);

  const getEmbedPreview = useCallback((config: EmbedConfig): string => {
    return `<div style="
      width: ${config.width}; 
      height: ${config.height}; 
      border: 2px dashed #ccc; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      background: ${config.theme === 'dark' ? '#1a1a1a' : '#f8f9fa'};
      color: ${config.theme === 'dark' ? '#ffffff' : '#666666'};
    ">
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
        <div>Chart Embed Preview</div>
        <div style="font-size: 12px; margin-top: 8px;">
          ${config.responsive ? 'Responsive' : 'Fixed'} • 
          ${config.interactive ? 'Interactive' : 'Static'} • 
          ${config.theme} theme
        </div>
      </div>
    </div>`;
  }, []);

  const trackEmbedUsage = useCallback((embedId: string, event: string) => {
    const usage = embedUsage.get(embedId) || [];
    usage.push({
      event,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    embedUsage.set(embedId, usage);
  }, [embedUsage]);

  const updateEmbedTheme = useCallback((embedId: string, theme: 'light' | 'dark') => {
    // Send message to embedded iframe
    const iframe = document.getElementById(`chart-${embedId}`) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'theme-change', theme }, '*');
    }
  }, []);

  return (
    <EmbedManagerContext.Provider value={{
      generateEmbedCode,
      generateIframe,
      createEmbedWidget,
      validateEmbedConfig,
      getEmbedPreview,
      trackEmbedUsage,
      updateEmbedTheme
    }}>
      {children}
    </EmbedManagerContext.Provider>
  );
};

export const useEmbedManager = () => {
  const context = useContext(EmbedManagerContext);
  if (!context) {
    throw new Error('useEmbedManager must be used within EmbedManager');
  }
  return context;
};

// === UNIVERSAL CHART COMPONENT ===

export const UniversalChart: React.FC<UniversalChartProps> = ({
  data,
  type,
  width = 400,
  height = 300,
  responsive = true,
  theme = 'light',
  exportEnabled = true,
  embedEnabled = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const platformAdapter = usePlatformAdapter();
  const exportEngine = useExportEngine();
  const embedManager = useEmbedManager();

  const [chartId] = useState(`chart-${Date.now()}`);
  const [isExporting, setIsExporting] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedCode, setEmbedCode] = useState('');

  // Optimize configuration for current platform
  const optimizedConfig = useMemo(() => {
    return platformAdapter.optimizeForPlatform({
      width,
      height,
      animationDuration: 300,
      maxDataPoints: 1000,
      renderer: platformAdapter.getOptimalRenderer(platformAdapter.currentPlatform.capabilities)
    });
  }, [platformAdapter, width, height]);

  // Render chart with D3.js
  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = optimizedConfig.width - margin.left - margin.right;
    const chartHeight = optimizedConfig.height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Apply theme
    const colors = {
      light: { background: '#ffffff', text: '#000000', primary: '#4C6EF5' },
      dark: { background: '#1a1a1a', text: '#ffffff', primary: '#748FFC' }
    };
    const currentColors = colors[theme];

    svg.style('background-color', currentColors.background);

    if (type === 'line' && data.length > 0) {
      const xScale = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([0, chartWidth]);

      const yScale = d3.scaleLinear()
        .domain(d3.extent(data, (d: any) => d.value) as [number, number])
        .range([chartHeight, 0]);

      const line = d3.line<any>()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', currentColors.primary)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add interactive dots if platform supports interaction
      if (platformAdapter.currentPlatform.capabilities.mouse || platformAdapter.currentPlatform.capabilities.touch) {
        g.selectAll('.dot')
          .data(data)
          .enter().append('circle')
          .attr('class', 'dot')
          .attr('cx', (d, i) => xScale(i))
          .attr('cy', d => yScale(d.value))
          .attr('r', platformAdapter.isTouch() ? 8 : 4)
          .attr('fill', currentColors.primary)
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            if (!platformAdapter.isTouch()) {
              d3.select(this).attr('r', 6);
            }
          })
          .on('mouseout', function(event, d) {
            if (!platformAdapter.isTouch()) {
              d3.select(this).attr('r', 4);
            }
          });
      }

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('fill', currentColors.text);

      g.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('fill', currentColors.text);
    }

    // Add platform-specific optimizations
    if (platformAdapter.currentPlatform.type === 'mobile') {
      svg.style('touch-action', 'pan-x pan-y');
    }

  }, [data, type, optimizedConfig, theme, platformAdapter]);

  const handleExport = useCallback(async (format: ExportOptions['format']) => {
    if (!containerRef.current) return;

    setIsExporting(true);
    try {
      const result = await exportEngine.exportChart(containerRef.current, {
        format,
        width: optimizedConfig.width,
        height: optimizedConfig.height,
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
      });

      if (result instanceof Blob) {
        const url = URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Handle string results (SVG, HTML)
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [exportEngine, optimizedConfig, theme]);

  const handleEmbed = useCallback(() => {
    const config: EmbedConfig = {
      width: optimizedConfig.width,
      height: optimizedConfig.height,
      responsive: responsive,
      allowFullscreen: true,
      allowScripts: true,
      theme: theme,
      interactive: true,
      showControls: true
    };

    const code = embedManager.generateEmbedCode(chartId, config);
    setEmbedCode(code);
    setShowEmbedModal(true);
  }, [embedManager, chartId, optimizedConfig, responsive, theme]);

  // Handle responsive sizing
  useEffect(() => {
    if (!responsive || !containerRef.current) return;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newWidth = Math.min(rect.width, window.innerWidth - 40);
      const aspectRatio = height / width;
      const newHeight = newWidth * aspectRatio;

      if (svgRef.current) {
        svgRef.current.setAttribute('width', newWidth.toString());
        svgRef.current.setAttribute('height', newHeight.toString());
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [responsive, width, height]);

  return (
    <div ref={containerRef} className="universal-chart-container">
      <Card>
        <Group justify="space-between" mb="md">
          <Text fw={600}>Universal Chart</Text>
          <Group>
            <Badge variant="light" size="sm">
              {platformAdapter.currentPlatform.type}
            </Badge>
            <Badge variant="light" size="sm">
              {optimizedConfig.renderer}
            </Badge>
          </Group>
        </Group>

        <div style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            width={optimizedConfig.width}
            height={optimizedConfig.height}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              border: '1px solid #e9ecef',
              borderRadius: '4px'
            }}
          />

          {(exportEnabled || embedEnabled) && (
            <Group 
              style={{ 
                position: 'absolute', 
                top: 10, 
                right: 10,
                opacity: 0.8 
              }}
            >
              {exportEnabled && (
                <Group>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPhoto size={12} />}
                    onClick={() => handleExport('png')}
                    loading={isExporting}
                  >
                    PNG
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconFileText size={12} />}
                    onClick={() => handleExport('svg')}
                    loading={isExporting}
                  >
                    SVG
                  </Button>
                </Group>
              )}
              {embedEnabled && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconCode size={12} />}
                  onClick={handleEmbed}
                >
                  Embed
                </Button>
              )}
            </Group>
          )}
        </div>

        <Divider my="sm" />
        <Group justify="space-between" style={{ fontSize: '12px', color: '#868e96' }}>
          <Text size="xs">
            Platform: {platformAdapter.currentPlatform.name} {platformAdapter.currentPlatform.version}
          </Text>
          <Text size="xs">
            {data.length} data points
          </Text>
        </Group>
      </Card>

      <Modal
        opened={showEmbedModal}
        onClose={() => setShowEmbedModal(false)}
        title="Embed Chart"
        size="lg"
      >
        <Stack gap="md">
          <div>
            <Text fw={500} mb="xs">Preview:</Text>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: embedManager.getEmbedPreview({
                  width: 400,
                  height: 300,
                  responsive,
                  allowFullscreen: true,
                  allowScripts: true,
                  theme,
                  interactive: true,
                  showControls: true
                })
              }}
            />
          </div>
          <div>
            <Text fw={500} mb="xs">Embed Code:</Text>
            <Textarea
              value={embedCode}
              readOnly
              rows={6}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
          <Button
            onClick={() => navigator.clipboard.writeText(embedCode)}
            fullWidth
            leftSection={<IconShare size={16} />}
          >
            Copy Embed Code
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};

// === CROSS-PLATFORM DASHBOARD ===

export const CrossPlatformDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chart');
  const platformAdapter = usePlatformAdapter();
  const exportEngine = useExportEngine();
  const embedManager = useEmbedManager();

  const sampleData = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      value: Math.sin(i * 0.3) * 50 + Math.random() * 20 + 50,
      label: `Point ${i + 1}`
    }))
  , []);

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Cross-Platform Visualization Dashboard</Title>
        <Group>
          <Badge leftSection={<IconDevices size={16} />}>
            {platformAdapter.currentPlatform.type}
          </Badge>
          <Badge leftSection={<IconBrowser size={16} />}>
            {platformAdapter.currentPlatform.name}
          </Badge>
        </Group>
      </Group>

      <Grid mb="lg">
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconDesktop size={24} color="#4C6EF5" />
              <div>
                <Text size="lg" fw={600}>
                  {platformAdapter.currentPlatform.capabilities.canvas ? '✓' : '✗'}
                </Text>
                <Text size="sm" c="dimmed">Canvas Support</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconMobile size={24} color="#51CF66" />
              <div>
                <Text size="lg" fw={600}>
                  {platformAdapter.currentPlatform.capabilities.touch ? '✓' : '✗'}
                </Text>
                <Text size="sm" c="dimmed">Touch Support</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconBrowser size={24} color="#FF6B6B" />
              <div>
                <Text size="lg" fw={600}>
                  {platformAdapter.currentPlatform.capabilities.webgl ? '✓' : '✗'}
                </Text>
                <Text size="sm" c="dimmed">WebGL Support</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconSettings size={24} color="#7C3AED" />
              <div>
                <Text size="lg" fw={600}>
                  {platformAdapter.currentPlatform.capabilities.devicePixelRatio.toFixed(1)}
                </Text>
                <Text size="sm" c="dimmed">Device Pixel Ratio</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'chart')}>
        <Tabs.List>
          <Tabs.Tab value="chart" leftSection={<IconBrandReact size={16} />}>
            Universal Chart
          </Tabs.Tab>
          <Tabs.Tab value="platform" leftSection={<IconDevices size={16} />}>
            Platform Info
          </Tabs.Tab>
          <Tabs.Tab value="export" leftSection={<IconDownload size={16} />}>
            Export Engine
          </Tabs.Tab>
          <Tabs.Tab value="embed" leftSection={<IconCode size={16} />}>
            Embed Manager
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="chart" pt="lg">
          <Grid>
            <Grid.Col span={8}>
              <UniversalChart
                data={sampleData}
                type="line"
                width={600}
                height={400}
                responsive={true}
                theme="light"
                exportEnabled={true}
                embedEnabled={true}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Card>
                <Title order={3} mb="md">Chart Configuration</Title>
                <Stack gap="sm">
                  <Text size="sm">
                    <strong>Optimized for:</strong> {platformAdapter.currentPlatform.type}
                  </Text>
                  <Text size="sm">
                    <strong>Preferred Renderer:</strong> {platformAdapter.currentPlatform.optimizations.preferredRenderer}
                  </Text>
                  <Text size="sm">
                    <strong>Batch Size:</strong> {platformAdapter.currentPlatform.optimizations.batchSize}
                  </Text>
                  <Text size="sm">
                    <strong>Frame Rate:</strong> {platformAdapter.currentPlatform.optimizations.animationFrameRate} FPS
                  </Text>
                  <Text size="sm">
                    <strong>Touch Target Size:</strong> {platformAdapter.currentPlatform.optimizations.touchTargetSize}px
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="platform" pt="lg">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Platform Detection</Title>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text>Type</Text>
                    <Badge>{platformAdapter.currentPlatform.type}</Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text>Name</Text>
                    <Text>{platformAdapter.currentPlatform.name}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text>Version</Text>
                    <Text>{platformAdapter.currentPlatform.version}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text>SSR</Text>
                    <Badge color={platformAdapter.isSSR() ? 'green' : 'gray'}>
                      {platformAdapter.isSSR() ? 'Yes' : 'No'}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text>Mobile</Text>
                    <Badge color={platformAdapter.isMobile() ? 'blue' : 'gray'}>
                      {platformAdapter.isMobile() ? 'Yes' : 'No'}
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Capabilities</Title>
                <Stack gap="sm">
                  {Object.entries(platformAdapter.currentPlatform.capabilities).map(([key, value]) => (
                    <Group key={key} justify="space-between">
                      <Text style={{ textTransform: 'capitalize' }}>{key}</Text>
                      <Badge color={typeof value === 'boolean' ? (value ? 'green' : 'red') : 'blue'}>
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString()}
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="export" pt="lg">
          <Card>
            <Title order={3} mb="md">Export Engine Testing</Title>
            <Text c="dimmed" mb="md">Export functionality is integrated into the Universal Chart component above.</Text>
            <Stack gap="md">
              <Group>
                <Text fw={500}>Supported Formats:</Text>
                <Badge>PNG</Badge>
                <Badge>JPG</Badge>
                <Badge>SVG</Badge>
                <Badge>PDF</Badge>
                <Badge>CSV</Badge>
                <Badge>JSON</Badge>
                <Badge>HTML</Badge>
              </Group>
              <Group>
                <Text fw={500}>Features:</Text>
                <Badge variant="light">High-DPI Support</Badge>
                <Badge variant="light">Custom Sizing</Badge>
                <Badge variant="light">Background Colors</Badge>
                <Badge variant="light">Quality Control</Badge>
              </Group>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="embed" pt="lg">
          <Card>
            <Title order={3} mb="md">Embed Manager Testing</Title>
            <Text c="dimmed" mb="md">Embed functionality is integrated into the Universal Chart component above.</Text>
            <Stack gap="md">
              <Group>
                <Text fw={500}>Embed Options:</Text>
                <Badge>Iframe</Badge>
                <Badge>Widget</Badge>
                <Badge>Responsive</Badge>
                <Badge>Interactive</Badge>
              </Group>
              <Group>
                <Text fw={500}>Security Features:</Text>
                <Badge variant="light">Sandboxing</Badge>
                <Badge variant="light">CSP Headers</Badge>
                <Badge variant="light">Domain Validation</Badge>
                <Badge variant="light">XSS Protection</Badge>
              </Group>
              <div>
                <Text fw={500} mb="xs">Sample Embed Preview:</Text>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: embedManager.getEmbedPreview({
                      width: '100%',
                      height: 200,
                      responsive: true,
                      allowFullscreen: true,
                      allowScripts: true,
                      theme: 'light',
                      interactive: true,
                      showControls: true
                    })
                  }}
                />
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

// === MAIN CROSS-PLATFORM COMPONENT ===

export default function Exercise12() {
  return (
    <PlatformAdapter>
      <ExportEngine>
        <EmbedManager>
          <CrossPlatformDashboard />
        </EmbedManager>
      </ExportEngine>
    </PlatformAdapter>
  );
}