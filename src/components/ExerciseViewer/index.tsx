import React, { useState, useEffect } from 'react';
import { Stack, Tabs, ScrollArea, Loader, Text, Alert } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Exercise } from '@/types';

interface ExerciseViewerProps {
  exercise: Exercise;
}

export function ExerciseViewer({ exercise }: ExerciseViewerProps) {
  const [instructions, setInstructions] = useState<string>('');
  const [solutionCode, setSolutionCode] = useState<string>('');
  const [currentCode, setCurrentCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExerciseContent();
  }, [exercise]);

  // No custom polling - let Vite handle file changes with HMR

  const convertPathToUrl = (path: string): string => {
    // Convert relative paths to URLs that Vite dev server can serve
    if (path.startsWith('./src/')) {
      return path.replace('./src/', '/src/');
    }
    if (path.startsWith('./exercise-files/')) {
      // Add ?raw query parameter to get raw file content instead of module
      return path.replace('./', '/') + '?raw';
    }
    return path;
  };

  const loadCurrentExerciseCode = async () => {
    if (!exercise.filePath) return;
    
    try {
      const url = convertPathToUrl(exercise.filePath);
      const codeResponse = await fetch(`${url}?t=${Date.now()}`);
      if (codeResponse.ok) {
        let content = await codeResponse.text();
        
        // Handle Vite's ?raw parameter response - can be either string or template literal format
        if (content.startsWith('export default `')) {
          // Template literal format
          const stringStart = content.indexOf('export default `') + 'export default `'.length;
          const stringEnd = content.lastIndexOf('`;');
          if (stringStart < stringEnd) {
            content = content.substring(stringStart, stringEnd);
          }
        } else if (content.startsWith('export default "')) {
          // String format
          const stringStart = content.indexOf('export default "') + 'export default "'.length;
          const stringEnd = content.lastIndexOf('";');
          if (stringStart < stringEnd) {
            const rawContent = content.substring(stringStart, stringEnd);
            // Decode the escaped string content
            content = rawContent
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
          }
        }
        
        setCurrentCode(content);
      }
    } catch (err) {
      console.warn('Could not load exercise code:', err);
    }
  };

  const loadExerciseContent = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load instructions
      if (exercise.instructionsPath) {
        try {
          const url = convertPathToUrl(exercise.instructionsPath);
          const instructionsResponse = await fetch(url);
          if (instructionsResponse.ok) {
            setInstructions(await instructionsResponse.text());
          } else {
            console.warn('Could not load instructions from:', url);
            setInstructions(generateDefaultInstructions(exercise));
          }
        } catch (err) {
          console.warn('Could not load instructions:', err);
          setInstructions(generateDefaultInstructions(exercise));
        }
      } else {
        setInstructions(generateDefaultInstructions(exercise));
      }

      // Load current exercise code
      await loadCurrentExerciseCode();

      // Load solution (if available)
      if (exercise.solutionPath) {
        try {
          const url = convertPathToUrl(exercise.solutionPath);
          const solutionResponse = await fetch(url);
          if (solutionResponse.ok) {
            setSolutionCode(await solutionResponse.text());
          } else {
            console.warn('Could not load solution from:', url);
          }
        } catch (err) {
          console.warn('Could not load solution:', err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercise content');
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultInstructions = (exercise: Exercise): string => {
    return `# ${exercise.title}

${exercise.description}

## Learning Objectives
${exercise.learningObjectives.map(obj => `- ${obj}`).join('\n')}

## Prerequisites
${exercise.prerequisites.length > 0 
  ? exercise.prerequisites.map(prereq => `- ${prereq}`).join('\n')
  : 'None'
}

## Instructions

1. Open the exercise file in your editor
2. Follow the TODO comments and TypeScript errors
3. Implement the required functionality
4. Run the tests to verify your solution

## Hints
${exercise.hints.map((hint, index) => `${index + 1}. ${hint}`).join('\n')}

**Estimated time:** ${exercise.estimatedTime} minutes  
**Difficulty:** ${exercise.difficulty}/5
`;
  };

  const generateDefaultExerciseCode = (exercise: Exercise): string => {
    return `// ${exercise.title}
// ${exercise.description}

// TODO: Implement your solution here

export {};
`;
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 200 }}>
        <Loader size="md" />
        <Text c="dimmed">Loading exercise content...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error loading exercise">
        {error}
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="instructions" style={{ height: '100%' }}>
      <Tabs.List>
        <Tabs.Tab value="instructions">Instructions</Tabs.Tab>
        <Tabs.Tab value="code">Current Code</Tabs.Tab>
        {solutionCode && <Tabs.Tab value="solution">Solution</Tabs.Tab>}
      </Tabs.List>

      <Tabs.Panel value="instructions" style={{ height: 'calc(100% - 42px)' }}>
        <ScrollArea style={{ height: '100%' }}>
          <div className="exercise-instructions">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : 'typescript';
                  
                  return !inline ? (
                    <CodeHighlight
                      code={String(children).replace(/\n$/, '')}
                      language={language}
                      withCopyButton
                      {...props}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                // Prevent p elements from containing pre elements
                p: ({ children, ...props }) => {
                  // Check if any child is a CodeHighlight (which renders as pre)
                  const hasCodeBlock = React.Children.toArray(children).some(child =>
                    React.isValidElement(child) && 
                    (child.type === CodeHighlight || 
                     (child.props && child.props.className?.includes('language-')))
                  );
                  
                  if (hasCodeBlock) {
                    return <div {...props}>{children}</div>;
                  }
                  
                  return <p {...props}>{children}</p>;
                },
              }}
            >
              {instructions}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </Tabs.Panel>

      <Tabs.Panel value="code" style={{ height: 'calc(100% - 42px)' }}>
        <ScrollArea style={{ height: '100%' }}>
          <CodeHighlight
            code={currentCode}
            language="typescript"
            withCopyButton
          />
        </ScrollArea>
      </Tabs.Panel>

      {solutionCode && (
        <Tabs.Panel value="solution" style={{ height: 'calc(100% - 42px)' }}>
          <ScrollArea style={{ height: '100%' }}>
            <Alert color="yellow" title="Solution" mb="md">
              Try to solve the exercise yourself before looking at the solution!
            </Alert>
            <CodeHighlight
              code={solutionCode}
              language="typescript"
              withCopyButton
            />
          </ScrollArea>
        </Tabs.Panel>
      )}
    </Tabs>
  );
}