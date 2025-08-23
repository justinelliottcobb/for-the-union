import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, JsonInput } from '@mantine/core';

// ===== CONSUMER-DRIVEN CONTRACT TESTING FRAMEWORK =====

interface ContractDefinition {
  consumer: string;
  provider: string;
  interactions: Interaction[];
  version: string;
  metadata: ContractMetadata;
}

interface Interaction {
  description: string;
  providerState?: string;
  request: RequestSpec;
  response: ResponseSpec;
  matchers?: MatchingRule[];
}

interface RequestSpec {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
}

interface ResponseSpec {
  status: number;
  headers?: Record<string, string>;
  body?: any;
}

interface MatchingRule {
  path: string;
  matcher: 'type' | 'regex' | 'equality' | 'number' | 'integer';
  value?: any;
}

interface ContractMetadata {
  createdAt: string;
  tags: string[];
  environment: string;
}

// Consumer-Driven Contract Testing Framework
const ContractValidator: React.FC = () => {
  const [contracts, setContracts] = useState<ContractDefinition[]>([]);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const createContract = useCallback((consumer: string, provider: string) => {
    const contract: ContractDefinition = {
      consumer,
      provider,
      version: '1.0.0',
      interactions: [
        {
          description: 'Get user profile',
          providerState: 'user exists',
          request: {
            method: 'GET',
            path: '/api/users/123',
            headers: { 'Authorization': 'Bearer token' }
          },
          response: {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
              id: 123,
              name: 'John Doe',
              email: 'john@example.com'
            }
          },
          matchers: [
            { path: '$.id', matcher: 'integer' },
            { path: '$.name', matcher: 'type', value: 'string' },
            { path: '$.email', matcher: 'regex', value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' }
          ]
        }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        tags: ['api', 'user-service'],
        environment: 'development'
      }
    };

    setContracts(prev => [...prev, contract]);
    return contract;
  }, []);

  const validateContract = useCallback(async (contract: ContractDefinition) => {
    setIsValidating(true);
    
    // Simulate contract validation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = {
      contractId: `${contract.consumer}-${contract.provider}`,
      status: 'passed',
      interactions: contract.interactions.map(interaction => ({
        description: interaction.description,
        status: Math.random() > 0.2 ? 'passed' : 'failed',
        timing: Math.floor(Math.random() * 500) + 50,
        matchers: interaction.matchers?.map(matcher => ({
          path: matcher.path,
          status: Math.random() > 0.1 ? 'passed' : 'failed',
          message: `${matcher.matcher} validation ${Math.random() > 0.1 ? 'passed' : 'failed'}`
        })) || []
      }))
    };

    setValidationResults(prev => [...prev, result]);
    setIsValidating(false);
  }, []);

  const runAllContractTests = useCallback(async () => {
    for (const contract of contracts) {
      await validateContract(contract);
    }
  }, [contracts, validateContract]);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Contract Validator</Text>
          <Group>
            <Button 
              onClick={() => createContract('frontend-app', 'user-service')}
              variant="light"
              size="sm"
            >
              Create Contract
            </Button>
            <Button 
              onClick={runAllContractTests}
              loading={isValidating}
              disabled={contracts.length === 0}
            >
              Validate All Contracts
            </Button>
          </Group>
        </Group>

        {contracts.map((contract, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Text fw={500}>{contract.consumer} → {contract.provider}</Text>
              <Badge color="blue">v{contract.version}</Badge>
            </Group>
            
            <Text size="sm" c="dimmed" mb="md">
              {contract.interactions.length} interactions defined
            </Text>

            {validationResults
              .filter(result => result.contractId === `${contract.consumer}-${contract.provider}`)
              .map((result, idx) => (
                <Alert key={idx} color={result.status === 'passed' ? 'green' : 'red'} mb="sm">
                  <Text fw={500}>Validation {result.status}</Text>
                  {result.interactions.map((interaction: any, iIdx: number) => (
                    <Text key={iIdx} size="sm">
                      {interaction.description}: {interaction.status} ({interaction.timing}ms)
                    </Text>
                  ))}
                </Alert>
              ))
            }
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

// ===== SCHEMA VALIDATION AND ENFORCEMENT =====

interface SchemaDefinition {
  id: string;
  name: string;
  version: string;
  schema: any;
  type: 'json-schema' | 'openapi';
  validation: SchemaValidation;
}

interface SchemaValidation {
  rules: ValidationRule[];
  constraints: SchemaConstraint[];
  performance: PerformanceMetrics;
}

interface ValidationRule {
  path: string;
  type: string;
  required: boolean;
  constraints?: any;
}

interface SchemaConstraint {
  field: string;
  constraint: string;
  value: any;
}

interface PerformanceMetrics {
  validationTime: number;
  cacheHits: number;
  errors: number;
}

const SchemaChecker: React.FC = () => {
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([]);
  const [testData, setTestData] = useState('{"name": "John", "age": 30, "email": "john@example.com"}');
  const [validationResults, setValidationResults] = useState<any[]>([]);

  const createSchema = useCallback(() => {
    const schema: SchemaDefinition = {
      id: `schema-${Date.now()}`,
      name: 'User Schema',
      version: '1.0.0',
      type: 'json-schema',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          age: { type: 'integer', minimum: 0, maximum: 150 },
          email: { type: 'string', format: 'email' }
        },
        required: ['name', 'email'],
        additionalProperties: false
      },
      validation: {
        rules: [
          { path: 'name', type: 'string', required: true },
          { path: 'age', type: 'integer', required: false },
          { path: 'email', type: 'string', required: true }
        ],
        constraints: [
          { field: 'name', constraint: 'minLength', value: 1 },
          { field: 'age', constraint: 'range', value: [0, 150] },
          { field: 'email', constraint: 'format', value: 'email' }
        ],
        performance: {
          validationTime: 0,
          cacheHits: 0,
          errors: 0
        }
      }
    };

    setSchemas(prev => [...prev, schema]);
  }, []);

  const validateData = useCallback(async (schema: SchemaDefinition, data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const startTime = performance.now();
      
      // Simulate schema validation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const endTime = performance.now();
      const validationTime = endTime - startTime;

      // Simple validation logic
      const errors: string[] = [];
      
      if (!parsedData.name || typeof parsedData.name !== 'string') {
        errors.push('name is required and must be a string');
      }
      
      if (!parsedData.email || !parsedData.email.includes('@')) {
        errors.push('email is required and must be valid');
      }
      
      if (parsedData.age !== undefined && (typeof parsedData.age !== 'number' || parsedData.age < 0)) {
        errors.push('age must be a non-negative number');
      }

      const result = {
        schemaId: schema.id,
        valid: errors.length === 0,
        errors,
        validationTime: Math.round(validationTime),
        timestamp: new Date().toISOString()
      };

      setValidationResults(prev => [...prev, result]);
      
      // Update performance metrics
      setSchemas(prev => prev.map(s => 
        s.id === schema.id 
          ? {
              ...s,
              validation: {
                ...s.validation,
                performance: {
                  validationTime: Math.round(validationTime),
                  cacheHits: s.validation.performance.cacheHits + (Math.random() > 0.5 ? 1 : 0),
                  errors: s.validation.performance.errors + errors.length
                }
              }
            }
          : s
      ));

    } catch (error) {
      setValidationResults(prev => [...prev, {
        schemaId: schema.id,
        valid: false,
        errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
        validationTime: 0,
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  const runSchemaValidation = useCallback(() => {
    schemas.forEach(schema => validateData(schema, testData));
  }, [schemas, testData, validateData]);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Schema Checker</Text>
          <Group>
            <Button onClick={createSchema} variant="light" size="sm">
              Add Schema
            </Button>
            <Button 
              onClick={runSchemaValidation}
              disabled={schemas.length === 0}
            >
              Validate Data
            </Button>
          </Group>
        </Group>

        <JsonInput
          label="Test Data"
          placeholder="Enter JSON data to validate"
          value={testData}
          onChange={setTestData}
          minRows={4}
        />

        {schemas.map((schema, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Text fw={500}>{schema.name}</Text>
              <Badge color="cyan">v{schema.version}</Badge>
            </Group>
            
            <Group mb="sm">
              <Text size="sm" c="dimmed">Type: {schema.type}</Text>
              <Text size="sm" c="dimmed">
                Performance: {schema.validation.performance.validationTime}ms
              </Text>
              <Text size="sm" c="dimmed">
                Cache hits: {schema.validation.performance.cacheHits}
              </Text>
            </Group>

            {validationResults
              .filter(result => result.schemaId === schema.id)
              .slice(-1)
              .map((result, idx) => (
                <Alert key={idx} color={result.valid ? 'green' : 'red'}>
                  <Text fw={500}>
                    Validation {result.valid ? 'Passed' : 'Failed'}
                  </Text>
                  {result.errors.length > 0 && (
                    <Stack gap="xs" mt="sm">
                      {result.errors.map((error, eIdx) => (
                        <Text key={eIdx} size="sm">• {error}</Text>
                      ))}
                    </Stack>
                  )}
                  <Text size="xs" c="dimmed" mt="sm">
                    Completed in {result.validationTime}ms
                  </Text>
                </Alert>
              ))
            }
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

// ===== API VERSION MANAGEMENT =====

interface APIVersion {
  version: string;
  status: 'active' | 'deprecated' | 'sunset';
  releaseDate: string;
  deprecationDate?: string;
  sunsetDate?: string;
  breaking_changes: string[];
  compatibility: CompatibilityInfo;
}

interface CompatibilityInfo {
  backward_compatible: boolean;
  migration_required: boolean;
  migration_guide?: string;
  affected_endpoints: string[];
}

const APIVersionManager: React.FC = () => {
  const [versions, setVersions] = useState<APIVersion[]>([
    {
      version: '2.1.0',
      status: 'active',
      releaseDate: '2024-01-15',
      breaking_changes: [],
      compatibility: {
        backward_compatible: true,
        migration_required: false,
        affected_endpoints: []
      }
    },
    {
      version: '2.0.0',
      status: 'deprecated',
      releaseDate: '2023-06-01',
      deprecationDate: '2024-01-15',
      sunsetDate: '2024-06-01',
      breaking_changes: [
        'Removed legacy authentication endpoint',
        'Changed user profile response structure',
        'Updated error response format'
      ],
      compatibility: {
        backward_compatible: false,
        migration_required: true,
        migration_guide: 'Update authentication flow and handle new user profile structure',
        affected_endpoints: ['/auth/login', '/users/profile', '/api/errors']
      }
    }
  ]);

  const [compatibilityMatrix, setCompatibilityMatrix] = useState<any>({});

  const checkCompatibility = useCallback((fromVersion: string, toVersion: string) => {
    const from = versions.find(v => v.version === fromVersion);
    const to = versions.find(v => v.version === toVersion);
    
    if (!from || !to) return null;

    const isCompatible = from.compatibility.backward_compatible && 
                        to.breaking_changes.length === 0;
    
    const result = {
      compatible: isCompatible,
      migration_required: !isCompatible,
      breaking_changes: to.breaking_changes,
      affected_endpoints: to.compatibility.affected_endpoints,
      risk_level: to.breaking_changes.length > 2 ? 'high' : 
                 to.breaking_changes.length > 0 ? 'medium' : 'low'
    };

    setCompatibilityMatrix((prev: any) => ({
      ...prev,
      [`${fromVersion}->${toVersion}`]: result
    }));

    return result;
  }, [versions]);

  const createNewVersion = useCallback(() => {
    const newVersion: APIVersion = {
      version: '2.2.0',
      status: 'active',
      releaseDate: new Date().toISOString().split('T')[0],
      breaking_changes: ['Updated authentication header format'],
      compatibility: {
        backward_compatible: false,
        migration_required: true,
        migration_guide: 'Update Authorization header from "Bearer" to "Token"',
        affected_endpoints: ['/api/*']
      }
    };

    setVersions(prev => [newVersion, ...prev]);
  }, []);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>API Version Manager</Text>
          <Group>
            <Button onClick={createNewVersion} variant="light" size="sm">
              Create Version
            </Button>
            <Button 
              onClick={() => checkCompatibility('2.0.0', '2.1.0')}
              size="sm"
            >
              Check Compatibility
            </Button>
          </Group>
        </Group>

        {versions.map((version, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Text fw={500}>API v{version.version}</Text>
              <Badge 
                color={
                  version.status === 'active' ? 'green' : 
                  version.status === 'deprecated' ? 'orange' : 'red'
                }
              >
                {version.status}
              </Badge>
            </Group>

            <Group mb="sm">
              <Text size="sm" c="dimmed">Released: {version.releaseDate}</Text>
              {version.deprecationDate && (
                <Text size="sm" c="orange">Deprecated: {version.deprecationDate}</Text>
              )}
              {version.sunsetDate && (
                <Text size="sm" c="red">Sunset: {version.sunsetDate}</Text>
              )}
            </Group>

            {version.breaking_changes.length > 0 && (
              <Alert color="orange" mb="sm">
                <Text fw={500} mb="xs">Breaking Changes:</Text>
                <Stack gap="xs">
                  {version.breaking_changes.map((change, idx) => (
                    <Text key={idx} size="sm">• {change}</Text>
                  ))}
                </Stack>
              </Alert>
            )}

            <Group>
              <Badge variant="light" size="sm">
                Backward Compatible: {version.compatibility.backward_compatible ? 'Yes' : 'No'}
              </Badge>
              <Badge variant="light" size="sm">
                Migration: {version.compatibility.migration_required ? 'Required' : 'Not Required'}
              </Badge>
            </Group>
          </Card>
        ))}

        {Object.keys(compatibilityMatrix).length > 0 && (
          <Card withBorder>
            <Text fw={500} mb="md">Compatibility Analysis</Text>
            {Object.entries(compatibilityMatrix).map(([key, result]: [string, any]) => (
              <Alert 
                key={key} 
                color={result.compatible ? 'green' : 'red'} 
                mb="sm"
              >
                <Text fw={500}>{key}</Text>
                <Text size="sm">
                  Compatible: {result.compatible ? 'Yes' : 'No'}
                </Text>
                <Text size="sm">
                  Risk Level: {result.risk_level}
                </Text>
                {result.breaking_changes.length > 0 && (
                  <Text size="sm" mt="xs">
                    Breaking Changes: {result.breaking_changes.join(', ')}
                  </Text>
                )}
              </Alert>
            ))}
          </Card>
        )}
      </Stack>
    </Card>
  );
};

// ===== BREAKING CHANGE DETECTOR =====

interface APIChange {
  type: 'added' | 'removed' | 'modified';
  severity: 'major' | 'minor' | 'patch';
  path: string;
  description: string;
  breaking: boolean;
  migration?: string;
}

interface ChangeDetectionResult {
  changes: APIChange[];
  breaking_changes: APIChange[];
  suggested_version: string;
  compatibility_score: number;
}

const BreakingChangeDetector: React.FC = () => {
  const [currentSpec, setCurrentSpec] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [detectionResult, setDetectionResult] = useState<ChangeDetectionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const detectChanges = useCallback(async () => {
    if (!currentSpec || !newSpec) return;

    setIsAnalyzing(true);
    
    // Simulate change detection
    await new Promise(resolve => setTimeout(resolve, 2000));

    const changes: APIChange[] = [
      {
        type: 'removed',
        severity: 'major',
        path: '/api/users/legacy',
        description: 'Removed legacy user endpoint',
        breaking: true,
        migration: 'Use /api/users instead with updated response format'
      },
      {
        type: 'modified',
        severity: 'minor',
        path: '/api/users',
        description: 'Added optional "avatar" field to user response',
        breaking: false
      },
      {
        type: 'added',
        severity: 'minor',
        path: '/api/users/preferences',
        description: 'Added new user preferences endpoint',
        breaking: false
      }
    ];

    const breaking_changes = changes.filter(change => change.breaking);
    const compatibility_score = Math.max(0, 100 - (breaking_changes.length * 20));
    
    const suggested_version = breaking_changes.length > 0 ? '3.0.0' :
                             changes.some(c => c.severity === 'minor') ? '2.1.0' : '2.0.1';

    const result: ChangeDetectionResult = {
      changes,
      breaking_changes,
      suggested_version,
      compatibility_score
    };

    setDetectionResult(result);
    setIsAnalyzing(false);
  }, [currentSpec, newSpec]);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Breaking Change Detector</Text>
          <Button 
            onClick={detectChanges}
            loading={isAnalyzing}
            disabled={!currentSpec || !newSpec}
          >
            Analyze Changes
          </Button>
        </Group>

        <Group grow>
          <JsonInput
            label="Current API Spec"
            placeholder="Paste current OpenAPI specification"
            value={currentSpec}
            onChange={setCurrentSpec}
            minRows={6}
          />
          <JsonInput
            label="New API Spec"
            placeholder="Paste updated OpenAPI specification"
            value={newSpec}
            onChange={setNewSpec}
            minRows={6}
          />
        </Group>

        {detectionResult && (
          <Card withBorder>
            <Group justify="apart" mb="md">
              <Text fw={500}>Change Analysis Results</Text>
              <Group>
                <Badge color="blue">
                  Suggested Version: {detectionResult.suggested_version}
                </Badge>
                <Badge 
                  color={detectionResult.compatibility_score > 80 ? 'green' : 
                         detectionResult.compatibility_score > 60 ? 'orange' : 'red'}
                >
                  Compatibility: {detectionResult.compatibility_score}%
                </Badge>
              </Group>
            </Group>

            <Progress 
              value={detectionResult.compatibility_score} 
              color={detectionResult.compatibility_score > 80 ? 'green' : 
                     detectionResult.compatibility_score > 60 ? 'orange' : 'red'}
              mb="md"
            />

            {detectionResult.breaking_changes.length > 0 && (
              <Alert color="red" mb="md">
                <Text fw={500} mb="sm">
                  ⚠️ {detectionResult.breaking_changes.length} Breaking Changes Detected
                </Text>
                <Stack gap="xs">
                  {detectionResult.breaking_changes.map((change, idx) => (
                    <div key={idx}>
                      <Text size="sm" fw={500}>
                        {change.type.toUpperCase()}: {change.path}
                      </Text>
                      <Text size="sm" c="dimmed">{change.description}</Text>
                      {change.migration && (
                        <Text size="sm" c="blue" fs="italic">
                          Migration: {change.migration}
                        </Text>
                      )}
                    </div>
                  ))}
                </Stack>
              </Alert>
            )}

            <Text fw={500} mb="sm">All Changes ({detectionResult.changes.length})</Text>
            <Stack gap="xs">
              {detectionResult.changes.map((change, idx) => (
                <Group key={idx} justify="apart">
                  <Group>
                    <Badge 
                      size="xs" 
                      color={
                        change.type === 'added' ? 'green' :
                        change.type === 'removed' ? 'red' : 'orange'
                      }
                    >
                      {change.type}
                    </Badge>
                    <Badge size="xs" variant="light">
                      {change.severity}
                    </Badge>
                    <Text size="sm">{change.path}</Text>
                  </Group>
                  {change.breaking && (
                    <Badge color="red" size="xs">BREAKING</Badge>
                  )}
                </Group>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
};

// ===== MAIN COMPONENT =====

export const APIContractTestingExercise: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Stack>
        <div>
          <h1>API Contract Testing</h1>
          <p>Consumer-driven contract testing and comprehensive schema validation</p>
        </div>

        <Tabs defaultValue="contracts">
          <Tabs.List>
            <Tabs.Tab value="contracts">Contract Testing</Tabs.Tab>
            <Tabs.Tab value="schemas">Schema Validation</Tabs.Tab>
            <Tabs.Tab value="versions">Version Management</Tabs.Tab>
            <Tabs.Tab value="changes">Change Detection</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="contracts" pt="md">
            <ContractValidator />
          </Tabs.Panel>

          <Tabs.Panel value="schemas" pt="md">
            <SchemaChecker />
          </Tabs.Panel>

          <Tabs.Panel value="versions" pt="md">
            <APIVersionManager />
          </Tabs.Panel>

          <Tabs.Panel value="changes" pt="md">
            <BreakingChangeDetector />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
};

export default APIContractTestingExercise;