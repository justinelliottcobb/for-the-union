import * as React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import { Card, Text, Group, Stack, Button, Progress, Badge, Tabs, Grid, Paper, Title, Divider, Select, Switch, Slider, Code, Alert } from '@mantine/core';
import { IconTestPipe, IconCamera, IconClick, IconDatabase, IconCheck, IconX, IconAlert, IconBug, IconChartBar } from '@tabler/icons-react';
import * as d3 from 'd3';

// === TYPES AND INTERFACES ===

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  message?: string;
  error?: string;
  duration?: number;
  screenshot?: string;
  data?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration: number;
  coverage: number;
}

interface VisualDiff {
  baseline: string;
  current: string;
  diff: string;
  similarity: number;
  pixelDifference: number;
  threshold: number;
}

interface InteractionEvent {
  type: 'click' | 'hover' | 'keydown' | 'drag' | 'touch';
  target: string;
  coordinates?: { x: number; y: number };
  key?: string;
  timestamp: number;
}

interface AccessibilityReport {
  violations: AccessibilityViolation[];
  warnings: AccessibilityWarning[];
  score: number;
  compliance: 'AAA' | 'AA' | 'A' | 'fail';
}

interface AccessibilityViolation {
  rule: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  element: string;
  description: string;
  fix: string;
}

interface AccessibilityWarning {
  rule: string;
  element: string;
  description: string;
  recommendation: string;
}

interface TestConfiguration {
  visualTesting: {
    threshold: number;
    browsers: string[];
    viewports: { width: number; height: number }[];
    animations: boolean;
  };
  interactionTesting: {
    eventDelay: number;
    animationDelay: number;
    timeout: number;
  };
  accessibilityTesting: {
    level: 'AAA' | 'AA' | 'A';
    rules: string[];
    includeWarnings: boolean;
  };
  dataTesting: {
    precision: number;
    sampleSize: number;
    edgeCases: boolean;
  };
}

// === CHART TEST UTILS ===

interface ChartTestUtilsContextValue {
  generateTestData: (type: string, count: number, options?: any) => any[];
  createMockData: (schema: any) => any[];
  simulateEvent: (element: Element, event: InteractionEvent) => void;
  queryElement: (selector: string, container?: Element) => Element | null;
  queryAllElements: (selector: string, container?: Element) => Element[];
  waitForElement: (selector: string, timeout?: number) => Promise<Element>;
  measurePerformance: <T>(fn: () => T) => { result: T; duration: number; memory: number };
  createSnapshot: (element: Element) => string;
  compareData: (expected: any, actual: any, precision?: number) => boolean;
  debugTest: (message: string, data?: any) => void;
}

const ChartTestUtilsContext = createContext<ChartTestUtilsContextValue | null>(null);

export const ChartTestUtils: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const debugMode = useRef(false);

  const generateTestData = useCallback((type: string, count: number, options: any = {}): any[] => {
    const { min = 0, max = 100, trend = 'random', categories = ['A', 'B', 'C', 'D'] } = options;

    switch (type) {
      case 'timeseries':
        return Array.from({ length: count }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          value: min + Math.random() * (max - min) + (trend === 'increasing' ? i * 2 : trend === 'decreasing' ? -i * 2 : 0),
          category: categories[Math.floor(Math.random() * categories.length)]
        }));

      case 'scatter':
        return Array.from({ length: count }, (_, i) => ({
          x: min + Math.random() * (max - min),
          y: min + Math.random() * (max - min),
          size: 5 + Math.random() * 15,
          category: categories[Math.floor(Math.random() * categories.length)]
        }));

      case 'categorical':
        return categories.map(category => ({
          category,
          value: min + Math.random() * (max - min),
          count: Math.floor(Math.random() * 1000)
        }));

      case 'hierarchical':
        return categories.map(category => ({
          name: category,
          value: min + Math.random() * (max - min),
          children: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
            name: `${category}-${i}`,
            value: min + Math.random() * (max - min) * 0.1
          }))
        }));

      default:
        return Array.from({ length: count }, (_, i) => ({
          id: i,
          value: min + Math.random() * (max - min),
          label: `Item ${i}`,
          category: categories[Math.floor(Math.random() * categories.length)]
        }));
    }
  }, []);

  const createMockData = useCallback((schema: any): any[] => {
    if (!schema.fields || !schema.count) return [];

    return Array.from({ length: schema.count }, (_, i) => {
      const item: any = { id: i };
      
      schema.fields.forEach((field: any) => {
        switch (field.type) {
          case 'string':
            item[field.name] = field.values?.[Math.floor(Math.random() * field.values.length)] || `${field.name}_${i}`;
            break;
          case 'number':
            const min = field.min || 0;
            const max = field.max || 100;
            item[field.name] = min + Math.random() * (max - min);
            break;
          case 'date':
            const startDate = field.startDate ? new Date(field.startDate) : new Date();
            const endDate = field.endDate ? new Date(field.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            item[field.name] = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
            break;
          case 'boolean':
            item[field.name] = Math.random() > 0.5;
            break;
          default:
            item[field.name] = null;
        }
      });

      return item;
    });
  }, []);

  const simulateEvent = useCallback((element: Element, event: InteractionEvent) => {
    switch (event.type) {
      case 'click':
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: event.coordinates?.x || 0,
          clientY: event.coordinates?.y || 0
        });
        element.dispatchEvent(clickEvent);
        break;

      case 'hover':
        const hoverEvent = new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          clientX: event.coordinates?.x || 0,
          clientY: event.coordinates?.y || 0
        });
        element.dispatchEvent(hoverEvent);
        break;

      case 'keydown':
        const keyEvent = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: event.key || ''
        });
        element.dispatchEvent(keyEvent);
        break;

      case 'drag':
        const dragStartEvent = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true
        });
        element.dispatchEvent(dragStartEvent);
        break;

      case 'touch':
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [
            new Touch({
              identifier: 0,
              target: element,
              clientX: event.coordinates?.x || 0,
              clientY: event.coordinates?.y || 0
            })
          ]
        });
        element.dispatchEvent(touchEvent);
        break;
    }
  }, []);

  const queryElement = useCallback((selector: string, container?: Element): Element | null => {
    return (container || document).querySelector(selector);
  }, []);

  const queryAllElements = useCallback((selector: string, container?: Element): Element[] => {
    return Array.from((container || document).querySelectorAll(selector));
  }, []);

  const waitForElement = useCallback(async (selector: string, timeout: number = 5000): Promise<Element> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        } else {
          setTimeout(checkElement, 100);
        }
      };
      checkElement();
    });
  }, []);

  const measurePerformance = useCallback(<T,>(fn: () => T): { result: T; duration: number; memory: number } => {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const result = fn();
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      result,
      duration: endTime - startTime,
      memory: endMemory - startMemory
    };
  }, []);

  const createSnapshot = useCallback((element: Element): string => {
    // Create a serialized representation of the element for comparison
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    
    return JSON.stringify({
      tagName: element.tagName,
      className: element.className,
      textContent: element.textContent?.slice(0, 100),
      bounds: {
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      styles: {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily
      },
      childCount: element.children.length
    });
  }, []);

  const compareData = useCallback((expected: any, actual: any, precision: number = 0.001): boolean => {
    if (typeof expected !== typeof actual) return false;
    
    if (typeof expected === 'number') {
      return Math.abs(expected - actual) < precision;
    }
    
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual) || expected.length !== actual.length) return false;
      return expected.every((item, index) => compareData(item, actual[index], precision));
    }
    
    if (typeof expected === 'object' && expected !== null) {
      if (typeof actual !== 'object' || actual === null) return false;
      const keys = Object.keys(expected);
      if (keys.length !== Object.keys(actual).length) return false;
      return keys.every(key => compareData(expected[key], actual[key], precision));
    }
    
    return expected === actual;
  }, []);

  const debugTest = useCallback((message: string, data?: any) => {
    if (debugMode.current) {
      console.log(`[TEST DEBUG] ${message}`, data);
    }
  }, []);

  return (
    <ChartTestUtilsContext.Provider value={{
      generateTestData,
      createMockData,
      simulateEvent,
      queryElement,
      queryAllElements,
      waitForElement,
      measurePerformance,
      createSnapshot,
      compareData,
      debugTest
    }}>
      {children}
    </ChartTestUtilsContext.Provider>
  );
};

export const useChartTestUtils = () => {
  const context = useContext(ChartTestUtilsContext);
  if (!context) {
    throw new Error('useChartTestUtils must be used within ChartTestUtils');
  }
  return context;
};

// === SNAPSHOT RENDERER ===

interface SnapshotRendererContextValue {
  captureSnapshot: (element: Element, name: string) => Promise<string>;
  compareSnapshots: (baseline: string, current: string) => VisualDiff;
  updateBaseline: (name: string, snapshot: string) => void;
  getBaseline: (name: string) => string | null;
  generateReport: () => any;
  configureThreshold: (threshold: number) => void;
}

const SnapshotRendererContext = createContext<SnapshotRendererContextValue | null>(null);

export const SnapshotRenderer: React.FC<{ children: React.ReactNode; threshold?: number }> = ({ 
  children, 
  threshold = 0.95 
}) => {
  const [baselines] = useState(new Map<string, string>());
  const [currentThreshold, setCurrentThreshold] = useState(threshold);
  const [snapshots] = useState(new Map<string, string>());

  const captureSnapshot = useCallback(async (element: Element, name: string): Promise<string> => {
    // In a real implementation, this would use html2canvas or similar
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context not available');

    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Simulate screenshot by creating a colored rectangle
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some element-specific visual representation
    ctx.fillStyle = '#4C6EF5';
    ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Add text content if available
    if (element.textContent) {
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.fillText(element.textContent.slice(0, 50), 20, 30);
    }

    const snapshot = canvas.toDataURL();
    snapshots.set(name, snapshot);
    
    return snapshot;
  }, [snapshots]);

  const compareSnapshots = useCallback((baseline: string, current: string): VisualDiff => {
    // Simple comparison - in reality would use image diff algorithms
    const similarity = baseline === current ? 1.0 : 0.8; // Simplified
    const pixelDifference = baseline === current ? 0 : 100; // Simplified

    return {
      baseline,
      current,
      diff: baseline, // Would be actual diff image
      similarity,
      pixelDifference,
      threshold: currentThreshold
    };
  }, [currentThreshold]);

  const updateBaseline = useCallback((name: string, snapshot: string) => {
    baselines.set(name, snapshot);
  }, [baselines]);

  const getBaseline = useCallback((name: string): string | null => {
    return baselines.get(name) || null;
  }, [baselines]);

  const generateReport = useCallback(() => {
    const reports: any[] = [];
    
    snapshots.forEach((snapshot, name) => {
      const baseline = baselines.get(name);
      if (baseline) {
        const diff = compareSnapshots(baseline, snapshot);
        reports.push({
          name,
          passed: diff.similarity >= currentThreshold,
          similarity: diff.similarity,
          pixelDifference: diff.pixelDifference,
          threshold: currentThreshold
        });
      }
    });

    return {
      timestamp: new Date().toISOString(),
      tests: reports,
      passed: reports.filter(r => r.passed).length,
      failed: reports.filter(r => !r.passed).length,
      total: reports.length
    };
  }, [snapshots, baselines, compareSnapshots, currentThreshold]);

  const configureThreshold = useCallback((threshold: number) => {
    setCurrentThreshold(threshold);
  }, []);

  return (
    <SnapshotRendererContext.Provider value={{
      captureSnapshot,
      compareSnapshots,
      updateBaseline,
      getBaseline,
      generateReport,
      configureThreshold
    }}>
      {children}
    </SnapshotRendererContext.Provider>
  );
};

export const useSnapshotRenderer = () => {
  const context = useContext(SnapshotRendererContext);
  if (!context) {
    throw new Error('useSnapshotRenderer must be used within SnapshotRenderer');
  }
  return context;
};

// === INTERACTION TESTER ===

interface InteractionTesterContextValue {
  recordInteraction: (event: InteractionEvent) => void;
  playbackInteractions: (events: InteractionEvent[]) => Promise<void>;
  testClick: (selector: string, expectedResult?: any) => Promise<TestResult>;
  testHover: (selector: string, expectedResult?: any) => Promise<TestResult>;
  testKeyboard: (selector: string, keys: string[], expectedResult?: any) => Promise<TestResult>;
  testDragDrop: (sourceSelector: string, targetSelector: string) => Promise<TestResult>;
  testAccessibility: (element: Element) => Promise<AccessibilityReport>;
  getRecordedEvents: () => InteractionEvent[];
  clearRecording: () => void;
}

const InteractionTesterContext = createContext<InteractionTesterContextValue | null>(null);

export const InteractionTester: React.FC<{ children: React.ReactNode; recordMode?: boolean }> = ({ 
  children, 
  recordMode = false 
}) => {
  const [recordedEvents, setRecordedEvents] = useState<InteractionEvent[]>([]);
  const [isRecording, setIsRecording] = useState(recordMode);
  const testUtils = useChartTestUtils();

  const recordInteraction = useCallback((event: InteractionEvent) => {
    if (isRecording) {
      setRecordedEvents(prev => [...prev, { ...event, timestamp: Date.now() }]);
    }
  }, [isRecording]);

  const playbackInteractions = useCallback(async (events: InteractionEvent[]): Promise<void> => {
    for (const event of events) {
      const element = testUtils.queryElement(event.target);
      if (element) {
        testUtils.simulateEvent(element, event);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between events
      }
    }
  }, [testUtils]);

  const testClick = useCallback(async (selector: string, expectedResult?: any): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const element = await testUtils.waitForElement(selector, 5000);
      
      const clickEvent: InteractionEvent = {
        type: 'click',
        target: selector,
        timestamp: Date.now()
      };

      testUtils.simulateEvent(element, clickEvent);
      recordInteraction(clickEvent);

      // Wait for any state changes
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        name: `Click test: ${selector}`,
        status: 'passed',
        message: 'Click event successfully executed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: `Click test: ${selector}`,
        status: 'failed',
        error: `Click test failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }, [testUtils, recordInteraction]);

  const testHover = useCallback(async (selector: string, expectedResult?: any): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const element = await testUtils.waitForElement(selector, 5000);
      
      const hoverEvent: InteractionEvent = {
        type: 'hover',
        target: selector,
        timestamp: Date.now()
      };

      testUtils.simulateEvent(element, hoverEvent);
      recordInteraction(hoverEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        name: `Hover test: ${selector}`,
        status: 'passed',
        message: 'Hover event successfully executed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: `Hover test: ${selector}`,
        status: 'failed',
        error: `Hover test failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }, [testUtils, recordInteraction]);

  const testKeyboard = useCallback(async (selector: string, keys: string[], expectedResult?: any): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const element = await testUtils.waitForElement(selector, 5000);
      
      for (const key of keys) {
        const keyEvent: InteractionEvent = {
          type: 'keydown',
          target: selector,
          key,
          timestamp: Date.now()
        };

        testUtils.simulateEvent(element, keyEvent);
        recordInteraction(keyEvent);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      return {
        name: `Keyboard test: ${selector} (${keys.join(', ')})`,
        status: 'passed',
        message: 'Keyboard events successfully executed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: `Keyboard test: ${selector}`,
        status: 'failed',
        error: `Keyboard test failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }, [testUtils, recordInteraction]);

  const testDragDrop = useCallback(async (sourceSelector: string, targetSelector: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const sourceElement = await testUtils.waitForElement(sourceSelector, 5000);
      const targetElement = await testUtils.waitForElement(targetSelector, 5000);
      
      const dragEvent: InteractionEvent = {
        type: 'drag',
        target: sourceSelector,
        timestamp: Date.now()
      };

      testUtils.simulateEvent(sourceElement, dragEvent);
      recordInteraction(dragEvent);

      // Simulate drop
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true
      });
      targetElement.dispatchEvent(dropEvent);

      return {
        name: `Drag & Drop test: ${sourceSelector} → ${targetSelector}`,
        status: 'passed',
        message: 'Drag and drop successfully executed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: `Drag & Drop test: ${sourceSelector} → ${targetSelector}`,
        status: 'failed',
        error: `Drag and drop test failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }, [testUtils, recordInteraction]);

  const testAccessibility = useCallback(async (element: Element): Promise<AccessibilityReport> => {
    const violations: AccessibilityViolation[] = [];
    const warnings: AccessibilityWarning[] = [];

    // Check for missing alt text on images
    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        violations.push({
          rule: 'alt-text',
          severity: 'serious',
          element: img.tagName,
          description: 'Image missing alt text',
          fix: 'Add descriptive alt attribute to image'
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      if (level > lastLevel + 1) {
        warnings.push({
          rule: 'heading-hierarchy',
          element: heading.tagName,
          description: 'Heading level skipped',
          recommendation: 'Use proper heading hierarchy'
        });
      }
      lastLevel = level;
    });

    // Check for keyboard focusable elements
    const focusableElements = element.querySelectorAll('button, a, input, select, textarea, [tabindex]');
    focusableElements.forEach(el => {
      const tabIndex = el.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        warnings.push({
          rule: 'tabindex',
          element: el.tagName,
          description: 'Positive tabindex found',
          recommendation: 'Use tabindex="0" or remove tabindex'
        });
      }
    });

    // Calculate accessibility score
    const totalChecks = violations.length + warnings.length + 10; // Base checks
    const issues = violations.length * 2 + warnings.length; // Weight violations more
    const score = Math.max(0, ((totalChecks - issues) / totalChecks) * 100);

    // Determine compliance level
    let compliance: AccessibilityReport['compliance'] = 'fail';
    if (score >= 95) compliance = 'AAA';
    else if (score >= 85) compliance = 'AA';
    else if (score >= 75) compliance = 'A';

    return {
      violations,
      warnings,
      score: Math.round(score),
      compliance
    };
  }, []);

  const getRecordedEvents = useCallback(() => recordedEvents, [recordedEvents]);

  const clearRecording = useCallback(() => {
    setRecordedEvents([]);
  }, []);

  // Setup event recording if in record mode
  useEffect(() => {
    if (!isRecording) return;

    const handleEvent = (e: Event) => {
      const target = e.target as Element;
      if (!target) return;

      const selector = target.id ? `#${target.id}` : 
                      target.className ? `.${target.className.split(' ')[0]}` :
                      target.tagName.toLowerCase();

      recordInteraction({
        type: e.type as any,
        target: selector,
        timestamp: Date.now()
      });
    };

    document.addEventListener('click', handleEvent);
    document.addEventListener('mouseenter', handleEvent);
    document.addEventListener('keydown', handleEvent);

    return () => {
      document.removeEventListener('click', handleEvent);
      document.removeEventListener('mouseenter', handleEvent);
      document.removeEventListener('keydown', handleEvent);
    };
  }, [isRecording, recordInteraction]);

  return (
    <InteractionTesterContext.Provider value={{
      recordInteraction,
      playbackInteractions,
      testClick,
      testHover,
      testKeyboard,
      testDragDrop,
      testAccessibility,
      getRecordedEvents,
      clearRecording
    }}>
      {children}
    </InteractionTesterContext.Provider>
  );
};

export const useInteractionTester = () => {
  const context = useContext(InteractionTesterContext);
  if (!context) {
    throw new Error('useInteractionTester must be used within InteractionTester');
  }
  return context;
};

// === DATA VALIDATOR ===

interface DataValidatorContextValue {
  validateDataAccuracy: (expected: any[], actual: any[], tolerance?: number) => TestResult;
  validateDataTypes: (data: any[], schema: any) => TestResult;
  validateCalculations: (data: any[], calculations: any[]) => TestResult;
  validateAggregations: (data: any[], aggregations: any[]) => TestResult;
  testEdgeCases: (data: any[], testCases: any[]) => TestResult[];
  validatePerformance: (fn: () => any, thresholds: { time: number; memory: number }) => TestResult;
  generateDataReport: () => any;
}

const DataValidatorContext = createContext<DataValidatorContextValue | null>(null);

export const DataValidator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const testUtils = useChartTestUtils();

  const validateDataAccuracy = useCallback((expected: any[], actual: any[], tolerance: number = 0.001): TestResult => {
    const startTime = Date.now();

    try {
      if (expected.length !== actual.length) {
        return {
          name: 'Data accuracy validation',
          status: 'failed',
          error: `Array lengths don't match: expected ${expected.length}, got ${actual.length}`,
          duration: Date.now() - startTime
        };
      }

      for (let i = 0; i < expected.length; i++) {
        if (!testUtils.compareData(expected[i], actual[i], tolerance)) {
          return {
            name: 'Data accuracy validation',
            status: 'failed',
            error: `Data mismatch at index ${i}: expected ${JSON.stringify(expected[i])}, got ${JSON.stringify(actual[i])}`,
            duration: Date.now() - startTime
          };
        }
      }

      return {
        name: 'Data accuracy validation',
        status: 'passed',
        message: `Successfully validated ${expected.length} data points`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'Data accuracy validation',
        status: 'failed',
        error: `Validation error: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }, [testUtils]);

  const validateDataTypes = useCallback((data: any[], schema: any): TestResult => {
    const startTime = Date.now();

    try {
      const errors: string[] = [];

      data.forEach((item, index) => {
        schema.fields.forEach((field: any) => {
          const value = item[field.name];
          
          if (field.required && (value === null || value === undefined)) {
            errors.push(`Item ${index}: Missing required field '${field.name}'`);
          }

          if (value !== null && value !== undefined) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== field.type) {
              errors.push(`Item ${index}: Field '${field.name}' expected ${field.type}, got ${actualType}`);
            }

            if (field.type === 'number' && (isNaN(value) || !isFinite(value))) {
              errors.push(`Item ${index}: Field '${field.name}' is not a valid number`);
            }
          }
        });
      });

      if (errors.length > 0) {
        return {
          name: 'Data type validation',
          status: 'failed',
          error: errors.join('; '),
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Data type validation',
        status: 'passed',
        message: `Successfully validated ${data.length} items against schema`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'Data type validation',
        status: 'failed',
        error: `Type validation error: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }, []);

  const validateCalculations = useCallback((data: any[], calculations: any[]): TestResult => {
    const startTime = Date.now();

    try {
      const errors: string[] = [];

      calculations.forEach(calc => {
        let expected: number;
        
        switch (calc.type) {
          case 'sum':
            expected = data.reduce((sum, item) => sum + (item[calc.field] || 0), 0);
            break;
          case 'average':
            expected = data.reduce((sum, item) => sum + (item[calc.field] || 0), 0) / data.length;
            break;
          case 'min':
            expected = Math.min(...data.map(item => item[calc.field] || Infinity));
            break;
          case 'max':
            expected = Math.max(...data.map(item => item[calc.field] || -Infinity));
            break;
          case 'count':
            expected = data.filter(item => item[calc.field] != null).length;
            break;
          default:
            errors.push(`Unknown calculation type: ${calc.type}`);
            return;
        }

        if (Math.abs(expected - calc.expected) > (calc.tolerance || 0.001)) {
          errors.push(`Calculation '${calc.type}' of field '${calc.field}': expected ${calc.expected}, got ${expected}`);
        }
      });

      if (errors.length > 0) {
        return {
          name: 'Calculation validation',
          status: 'failed',
          error: errors.join('; '),
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Calculation validation',
        status: 'passed',
        message: `Successfully validated ${calculations.length} calculations`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'Calculation validation',
        status: 'failed',
        error: `Calculation validation error: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }, []);

  const validateAggregations = useCallback((data: any[], aggregations: any[]): TestResult => {
    const startTime = Date.now();

    try {
      const errors: string[] = [];

      aggregations.forEach(agg => {
        const groups = new Map();
        
        data.forEach(item => {
          const key = item[agg.groupBy];
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key).push(item);
        });

        groups.forEach((group, key) => {
          const expected = agg.expectedGroups.find((eg: any) => eg.key === key);
          if (!expected) {
            errors.push(`Unexpected group: ${key}`);
            return;
          }

          if (group.length !== expected.count) {
            errors.push(`Group '${key}': expected ${expected.count} items, got ${group.length}`);
          }
        });
      });

      if (errors.length > 0) {
        return {
          name: 'Aggregation validation',
          status: 'failed',
          error: errors.join('; '),
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Aggregation validation',
        status: 'passed',
        message: `Successfully validated ${aggregations.length} aggregations`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'Aggregation validation',
        status: 'failed',
        error: `Aggregation validation error: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }, []);

  const testEdgeCases = useCallback((data: any[], testCases: any[]): TestResult[] => {
    return testCases.map(testCase => {
      const startTime = Date.now();

      try {
        const filteredData = data.filter(testCase.filter);
        
        if (filteredData.length !== testCase.expectedCount) {
          return {
            name: `Edge case: ${testCase.name}`,
            status: 'failed',
            error: `Expected ${testCase.expectedCount} items, got ${filteredData.length}`,
            duration: Date.now() - startTime
          };
        }

        return {
          name: `Edge case: ${testCase.name}`,
          status: 'passed',
          message: `Edge case validation passed`,
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          name: `Edge case: ${testCase.name}`,
          status: 'failed',
          error: `Edge case test error: ${error}`,
          duration: Date.now() - startTime
        };
      }
    });
  }, []);

  const validatePerformance = useCallback((fn: () => any, thresholds: { time: number; memory: number }): TestResult => {
    const performance = testUtils.measurePerformance(fn);
    const errors: string[] = [];

    if (performance.duration > thresholds.time) {
      errors.push(`Execution time ${performance.duration.toFixed(2)}ms exceeds threshold ${thresholds.time}ms`);
    }

    if (performance.memory > thresholds.memory) {
      errors.push(`Memory usage ${(performance.memory / 1024 / 1024).toFixed(2)}MB exceeds threshold ${(thresholds.memory / 1024 / 1024).toFixed(2)}MB`);
    }

    if (errors.length > 0) {
      return {
        name: 'Performance validation',
        status: 'failed',
        error: errors.join('; '),
        duration: performance.duration,
        data: { memory: performance.memory }
      };
    }

    return {
      name: 'Performance validation',
      status: 'passed',
      message: `Performance within thresholds: ${performance.duration.toFixed(2)}ms, ${(performance.memory / 1024 / 1024).toFixed(2)}MB`,
      duration: performance.duration,
      data: { memory: performance.memory }
    };
  }, [testUtils]);

  const generateDataReport = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      summary: 'Data validation report generated',
      testTypes: ['accuracy', 'types', 'calculations', 'aggregations', 'edge-cases', 'performance'],
      recommendations: [
        'Ensure data precision meets requirements',
        'Validate all edge cases thoroughly',
        'Monitor performance with large datasets'
      ]
    };
  }, []);

  return (
    <DataValidatorContext.Provider value={{
      validateDataAccuracy,
      validateDataTypes,
      validateCalculations,
      validateAggregations,
      testEdgeCases,
      validatePerformance,
      generateDataReport
    }}>
      {children}
    </DataValidatorContext.Provider>
  );
};

export const useDataValidator = () => {
  const context = useContext(DataValidatorContext);
  if (!context) {
    throw new Error('useDataValidator must be used within DataValidator');
  }
  return context;
};

// === TEST CHART COMPONENT ===

const TestChart: React.FC<{ data: any[]; type: string }> = ({ data, type }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (type === 'line') {
      const xScale = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([0, width - margin.left - margin.right]);

      const yScale = d3.scaleLinear()
        .domain(d3.extent(data, (d: any) => d.value) as [number, number])
        .range([height - margin.top - margin.bottom, 0]);

      const line = d3.line<any>()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.value));

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#4C6EF5')
        .attr('stroke-width', 2)
        .attr('d', line);
    }
  }, [data, type]);

  return <svg ref={svgRef} width={400} height={200} style={{ border: '1px solid #ddd' }} />;
};

// === TESTING DASHBOARD ===

export const TestingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('utils');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const testUtils = useChartTestUtils();
  const snapshotRenderer = useSnapshotRenderer();
  const interactionTester = useInteractionTester();
  const dataValidator = useDataValidator();

  const sampleData = useMemo(() => testUtils.generateTestData('timeseries', 50, { trend: 'increasing' }), [testUtils]);

  const runVisualTests = useCallback(async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    try {
      // Test chart rendering
      const chartElement = testUtils.queryElement('[data-testid="test-chart"]');
      if (chartElement) {
        const snapshot = await snapshotRenderer.captureSnapshot(chartElement, 'test-chart');
        const baseline = snapshotRenderer.getBaseline('test-chart');
        
        if (baseline) {
          const diff = snapshotRenderer.compareSnapshots(baseline, snapshot);
          results.push({
            name: 'Visual regression test',
            status: diff.similarity >= 0.95 ? 'passed' : 'failed',
            message: `Similarity: ${(diff.similarity * 100).toFixed(1)}%`,
            duration: 150
          });
        } else {
          snapshotRenderer.updateBaseline('test-chart', snapshot);
          results.push({
            name: 'Visual baseline creation',
            status: 'passed',
            message: 'Baseline snapshot created',
            duration: 100
          });
        }
      }
    } catch (error) {
      results.push({
        name: 'Visual test error',
        status: 'failed',
        error: `${error}`,
        duration: 50
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  }, [testUtils, snapshotRenderer]);

  const runInteractionTests = useCallback(async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    try {
      // Test button clicks
      const clickResult = await interactionTester.testClick('[data-testid="test-button"]');
      results.push(clickResult);

      // Test keyboard navigation
      const keyboardResult = await interactionTester.testKeyboard('[data-testid="test-input"]', ['Tab', 'Enter']);
      results.push(keyboardResult);

    } catch (error) {
      results.push({
        name: 'Interaction test error',
        status: 'failed',
        error: `${error}`,
        duration: 50
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  }, [interactionTester]);

  const runDataTests = useCallback(async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    // Test data accuracy
    const expected = sampleData;
    const actual = sampleData; // In real test, this would be processed data
    const accuracyResult = dataValidator.validateDataAccuracy(expected, actual);
    results.push(accuracyResult);

    // Test calculations
    const calculations = [
      { type: 'count', field: 'value', expected: sampleData.length },
      { type: 'sum', field: 'value', expected: sampleData.reduce((s, d) => s + d.value, 0) }
    ];
    const calcResult = dataValidator.validateCalculations(sampleData, calculations);
    results.push(calcResult);

    // Test performance
    const perfResult = dataValidator.validatePerformance(
      () => sampleData.map(d => d.value * 2),
      { time: 100, memory: 1024 * 1024 }
    );
    results.push(perfResult);

    setTestResults(results);
    setIsRunningTests(false);
  }, [sampleData, dataValidator]);

  const runAccessibilityTests = useCallback(async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    try {
      const testElement = document.querySelector('[data-testid="test-container"]');
      if (testElement) {
        const a11yReport = await interactionTester.testAccessibility(testElement);
        results.push({
          name: 'Accessibility compliance',
          status: a11yReport.compliance !== 'fail' ? 'passed' : 'failed',
          message: `Score: ${a11yReport.score}%, Compliance: ${a11yReport.compliance.toUpperCase()}`,
          duration: 200,
          data: a11yReport
        });
      }
    } catch (error) {
      results.push({
        name: 'Accessibility test error',
        status: 'failed',
        error: `${error}`,
        duration: 50
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  }, [interactionTester]);

  return (
    <div data-testid="test-container">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Visualization Testing Dashboard</Title>
        <Group>
          <Button 
            loading={isRunningTests}
            onClick={runVisualTests}
            leftSection={<IconCamera size={16} />}
          >
            Run Visual Tests
          </Button>
          <Button 
            loading={isRunningTests}
            onClick={runInteractionTests}
            leftSection={<IconClick size={16} />}
          >
            Run Interaction Tests
          </Button>
          <Button 
            loading={isRunningTests}
            onClick={runDataTests}
            leftSection={<IconDatabase size={16} />}
          >
            Run Data Tests
          </Button>
        </Group>
      </Group>

      <Grid mb="lg">
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconCheck size={24} color="#51CF66" />
              <div>
                <Text size="lg" fw={600}>{testResults.filter(r => r.status === 'passed').length}</Text>
                <Text size="sm" c="dimmed">Passed</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconX size={24} color="#FF6B6B" />
              <div>
                <Text size="lg" fw={600}>{testResults.filter(r => r.status === 'failed').length}</Text>
                <Text size="sm" c="dimmed">Failed</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconAlert size={24} color="#FFB84D" />
              <div>
                <Text size="lg" fw={600}>{testResults.filter(r => r.status === 'pending').length}</Text>
                <Text size="sm" c="dimmed">Pending</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconTestPipe size={24} color="#4C6EF5" />
              <div>
                <Text size="lg" fw={600}>{testResults.length}</Text>
                <Text size="sm" c="dimmed">Total</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'utils')}>
        <Tabs.List>
          <Tabs.Tab value="utils" leftSection={<IconTestPipe size={16} />}>
            Test Utils
          </Tabs.Tab>
          <Tabs.Tab value="visual" leftSection={<IconCamera size={16} />}>
            Visual Testing
          </Tabs.Tab>
          <Tabs.Tab value="interaction" leftSection={<IconClick size={16} />}>
            Interactions
          </Tabs.Tab>
          <Tabs.Tab value="data" leftSection={<IconDatabase size={16} />}>
            Data Validation
          </Tabs.Tab>
          <Tabs.Tab value="results" leftSection={<IconChartBar size={16} />}>
            Test Results
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="utils" pt="lg">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Test Data Generation</Title>
                <Stack gap="md">
                  <Button onClick={() => testUtils.generateTestData('timeseries', 10)} fullWidth>
                    Generate Time Series
                  </Button>
                  <Button onClick={() => testUtils.generateTestData('scatter', 10)} fullWidth>
                    Generate Scatter Data
                  </Button>
                  <Button onClick={() => testUtils.generateTestData('categorical', 10)} fullWidth>
                    Generate Categories
                  </Button>
                  <Code block>Sample Data: {sampleData.length} points</Code>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Test Chart</Title>
                <div data-testid="test-chart">
                  <TestChart data={sampleData} type="line" />
                </div>
                <Group mt="md">
                  <Button data-testid="test-button" size="sm">Test Button</Button>
                  <input data-testid="test-input" placeholder="Test input" style={{ padding: '4px' }} />
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="visual" pt="lg">
          <Card>
            <Title order={3} mb="md">Visual Regression Testing</Title>
            <Stack gap="md">
              <Group>
                <Button onClick={runVisualTests} loading={isRunningTests}>
                  Capture Screenshot
                </Button>
                <Button onClick={() => snapshotRenderer.configureThreshold(0.9)}>
                  Set Threshold (90%)
                </Button>
              </Group>
              <Text size="sm" c="dimmed">
                Visual regression testing compares screenshots to detect unintended changes
              </Text>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="interaction" pt="lg">
          <Card>
            <Title order={3} mb="md">Interaction Testing</Title>
            <Stack gap="md">
              <Group>
                <Button onClick={runInteractionTests} loading={isRunningTests}>
                  Test Interactions
                </Button>
                <Button onClick={runAccessibilityTests} loading={isRunningTests}>
                  Test Accessibility
                </Button>
              </Group>
              <Text size="sm" c="dimmed">
                Interaction testing simulates user events and validates responses
              </Text>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="data" pt="lg">
          <Card>
            <Title order={3} mb="md">Data Validation</Title>
            <Stack gap="md">
              <Button onClick={runDataTests} loading={isRunningTests}>
                Validate Data
              </Button>
              <Text size="sm" c="dimmed">
                Data validation ensures accuracy and integrity of visualization data
              </Text>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="results" pt="lg">
          <Card>
            <Title order={3} mb="md">Test Results</Title>
            <Stack gap="sm">
              {testResults.map((result, index) => (
                <Alert
                  key={index}
                  color={result.status === 'passed' ? 'green' : result.status === 'failed' ? 'red' : 'yellow'}
                  icon={result.status === 'passed' ? <IconCheck size={16} /> : 
                        result.status === 'failed' ? <IconX size={16} /> : <IconAlert size={16} />}
                >
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{result.name}</Text>
                      <Text size="sm">{result.message || result.error}</Text>
                    </div>
                    {result.duration && (
                      <Badge variant="light">{result.duration}ms</Badge>
                    )}
                  </Group>
                </Alert>
              ))}
              {testResults.length === 0 && (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No test results yet. Run some tests to see results here.
                </Text>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

// === MAIN TESTING COMPONENT ===

export default function Exercise11() {
  return (
    <ChartTestUtils>
      <SnapshotRenderer threshold={0.95}>
        <InteractionTester>
          <DataValidator>
            <TestingDashboard />
          </DataValidator>
        </InteractionTester>
      </SnapshotRenderer>
    </ChartTestUtils>
  );
}