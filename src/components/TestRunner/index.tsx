import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Badge,
  Alert,
  Button,
  ScrollArea,
  Divider,
  Progress,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import {
  IconCheck,
  IconX,
  IconClock,
  IconPlay,
  IconRefresh,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ExerciseRunner } from '@lib/exercise-runner';
import { FileWatcher } from '@lib/file-watcher';
import type { Exercise, ExerciseResult, ExerciseStatus, TestResult, CompilationError } from '@/types';

interface TestRunnerProps {
  exercise: Exercise;
  onStatusChange?: (status: ExerciseStatus) => void;
}

export function TestRunner({ exercise, onStatusChange }: TestRunnerProps) {
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRun, setAutoRun] = useState(true);
  const [exerciseRunner] = useState(() => new ExerciseRunner());
  const [fileWatcher] = useState(() => new FileWatcher());

  const runExercise = useCallback(async () => {
    setIsRunning(true);
    
    try {
      const code = await exerciseRunner.loadExerciseCode(exercise.filePath);
      const exerciseResult = await exerciseRunner.runExercise(exercise, code);
      
      setResult(exerciseResult);
      onStatusChange?.(exerciseResult.status);

      // Show notification for status changes
      if (exerciseResult.status === 'completed') {
        notifications.show({
          title: 'Exercise Completed!',
          message: 'Great job! All tests are passing.',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      } else if (exerciseResult.status === 'failed' && exerciseResult.compilationErrors.length === 0) {
        notifications.show({
          title: 'Tests Failed',
          message: 'Some tests are still failing. Keep trying!',
          color: 'red',
          icon: <IconX size={16} />,
        });
      }
    } catch (error) {
      console.error('Error running exercise:', error);
      notifications.show({
        title: 'Execution Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
    } finally {
      setIsRunning(false);
    }
  }, [exercise, exerciseRunner, onStatusChange]);

  useEffect(() => {
    // Initial run
    runExercise();

    // Set up file watcher if auto-run is enabled
    if (autoRun) {
      const handleFileChange = (filePath: string, content: string) => {
        console.log(`File changed: ${filePath}`);
        runExercise();
      };

      fileWatcher.watchExercise(exercise, handleFileChange);

      return () => {
        fileWatcher.unwatchExercise(exercise, handleFileChange);
      };
    }
  }, [exercise, autoRun, runExercise]);

  useEffect(() => {
    fileWatcher.startWatching();

    return () => {
      fileWatcher.stopWatching();
    };
  }, []);

  const handleManualRun = () => {
    runExercise();
  };

  const toggleAutoRun = () => {
    setAutoRun(!autoRun);
  };

  const getStatusColor = (status: ExerciseStatus) => {
    switch (status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'in_progress': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: ExerciseStatus) => {
    switch (status) {
      case 'completed': return <IconCheck size={16} />;
      case 'failed': return <IconX size={16} />;
      case 'in_progress': return <IconClock size={16} />;
      default: return <IconClock size={16} />;
    }
  };

  return (
    <Stack style={{ height: '100%' }}>
      {/* Header */}
      <Card withBorder padding="md">
        <Group justify="space-between">
          <Group>
            <Title order={4}>Test Results</Title>
            {result && (
              <Badge
                color={getStatusColor(result.status)}
                variant="light"
                leftSection={getStatusIcon(result.status)}
              >
                {result.status.replace('_', ' ')}
              </Badge>
            )}
          </Group>
          
          <Group>
            <Tooltip label={autoRun ? 'Disable auto-run' : 'Enable auto-run'}>
              <Badge
                variant={autoRun ? 'filled' : 'outline'}
                style={{ cursor: 'pointer' }}
                onClick={toggleAutoRun}
              >
                Auto-run: {autoRun ? 'ON' : 'OFF'}
              </Badge>
            </Tooltip>
            
            <Button
              size="xs"
              leftSection={<IconPlay size={14} />}
              onClick={handleManualRun}
              loading={isRunning}
              variant="light"
            >
              Run Tests
            </Button>
            
            <ActionIcon
              variant="subtle"
              onClick={handleManualRun}
              loading={isRunning}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {result && (
          <Group mt="xs" gap="md">
            <Text size="sm" c="dimmed">
              Execution time: {Math.round(result.totalExecutionTime)}ms
            </Text>
            {result.tests.length > 0 && (
              <Text size="sm" c="dimmed">
                Tests: {result.tests.filter(t => t.passed).length}/{result.tests.length} passing
              </Text>
            )}
          </Group>
        )}
      </Card>

      {/* Results */}
      <ScrollArea style={{ flexGrow: 1 }}>
        <Stack>
          {/* Compilation Errors */}
          {result?.compilationErrors && result.compilationErrors.length > 0 && (
            <Card withBorder padding="md">
              <Group justify="space-between" mb="md">
                <Title order={5} c="red">
                  <IconX size={16} style={{ marginRight: 8 }} />
                  Compilation Errors
                </Title>
                <Badge color="red" variant="light">
                  {result.compilationErrors.length}
                </Badge>
              </Group>
              
              <Stack gap="sm">
                {result.compilationErrors.map((error, index) => (
                  <Alert key={index} color="red" variant="light">
                    <Text size="sm" fw={500}>
                      {error.file && `${error.file}:`}
                      {error.line && error.column && `${error.line}:${error.column} - `}
                      Error {error.code && `TS${error.code}`}
                    </Text>
                    <Text size="sm" mt="xs">
                      {error.message}
                    </Text>
                  </Alert>
                ))}
              </Stack>
            </Card>
          )}

          {/* Test Results */}
          {result?.tests && result.tests.length > 0 && (
            <Card withBorder padding="md">
              <Group justify="space-between" mb="md">
                <Title order={5}>Test Results</Title>
                <Group gap="xs">
                  <Badge color="green" variant="light">
                    {result.tests.filter(t => t.passed).length} passed
                  </Badge>
                  {result.tests.filter(t => !t.passed).length > 0 && (
                    <Badge color="red" variant="light">
                      {result.tests.filter(t => !t.passed).length} failed
                    </Badge>
                  )}
                </Group>
              </Group>

              <Progress
                value={(result.tests.filter(t => t.passed).length / result.tests.length) * 100}
                color={result.tests.every(t => t.passed) ? 'green' : 'red'}
                size="md"
                mb="md"
              />

              <Stack gap="sm">
                {result.tests.map((test, index) => (
                  <TestResultItem key={index} test={test} />
                ))}
              </Stack>
            </Card>
          )}

          {/* Console Output */}
          {result?.consoleOutput && result.consoleOutput.length > 0 && (
            <Card withBorder padding="md">
              <Title order={5} mb="md">Console Output</Title>
              <CodeHighlight
                code={result.consoleOutput.join('\n')}
                language="text"
                withCopyButton={false}
              />
            </Card>
          )}

          {/* No results yet */}
          {!result && !isRunning && (
            <Card withBorder padding="md">
              <Stack align="center" justify="center" style={{ minHeight: 200 }}>
                <Text c="dimmed">No test results yet</Text>
                <Button
                  leftSection={<IconPlay size={16} />}
                  onClick={handleManualRun}
                  variant="light"
                >
                  Run Tests
                </Button>
              </Stack>
            </Card>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

function TestResultItem({ test }: { test: TestResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Alert
      color={test.passed ? 'green' : 'red'}
      variant="light"
      style={{ cursor: test.error ? 'pointer' : 'default' }}
      onClick={() => test.error && setExpanded(!expanded)}
    >
      <Group justify="space-between">
        <Group>
          {test.passed ? (
            <IconCheck size={16} color="green" />
          ) : (
            <IconX size={16} color="red" />
          )}
          <Text size="sm" fw={500}>
            {test.name}
          </Text>
        </Group>
        
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {Math.round(test.executionTime)}ms
          </Text>
          {!test.passed && test.error && (
            <Text size="xs" c="dimmed">
              Click to expand
            </Text>
          )}
        </Group>
      </Group>

      {expanded && test.error && (
        <>
          <Divider my="xs" />
          <CodeHighlight
            code={test.error}
            language="text"
            withCopyButton={false}
          />
          {test.expected !== undefined && test.actual !== undefined && (
            <>
              <Divider my="xs" />
              <Group grow>
                <div>
                  <Text size="xs" fw={500} c="green" mb="xs">Expected:</Text>
                  <CodeHighlight
                    code={JSON.stringify(test.expected, null, 2)}
                    language="json"
                    withCopyButton={false}
                  />
                </div>
                <div>
                  <Text size="xs" fw={500} c="red" mb="xs">Actual:</Text>
                  <CodeHighlight
                    code={JSON.stringify(test.actual, null, 2)}
                    language="json"
                    withCopyButton={false}
                  />
                </div>
              </Group>
            </>
          )}
        </>
      )}
    </Alert>
  );
}