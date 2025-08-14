import { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: RBAC type definitions
  results.push({
    name: 'RBAC Type System Definition',
    passed: compiledCode.includes('interface Permission') && 
            compiledCode.includes('interface Role') && 
            compiledCode.includes('interface User') &&
            compiledCode.includes('interface Resource') &&
            compiledCode.includes('interface FeatureFlag') &&
            compiledCode.includes('interface AuditLogEntry'),
    message: compiledCode.includes('interface Permission') ? 
      'RBAC type system properly defined with Permission, Role, User, Resource, FeatureFlag, and AuditLogEntry interfaces' : 
      'RBAC type definitions are missing or incomplete. Should include comprehensive type system for permissions and roles'
  });

  // Test 2: RoleManager class exists
  results.push({
    name: 'RoleManager Core Implementation',
    passed: compiledCode.includes('class RoleManager') &&
            compiledCode.includes('loadRoles') &&
            compiledCode.includes('resolveUserPermissions') &&
            compiledCode.includes('validateRoleHierarchy') &&
            compiledCode.includes('getEffectivePermissions') &&
            compiledCode.includes('inheritPermissions'),
    message: compiledCode.includes('class RoleManager') ? 
      'RoleManager class implemented with role loading, permission resolution, and hierarchy management' : 
      'RoleManager class is missing or incomplete. Should include role management, inheritance, and permission resolution'
  });

  // Test 3: AbilityFactory class exists
  results.push({
    name: 'AbilityFactory CASL Integration',
    passed: compiledCode.includes('class AbilityFactory') &&
            compiledCode.includes('createAbility') &&
            compiledCode.includes('createConditionalRule') &&
            compiledCode.includes('applyFieldPermissions') &&
            compiledCode.includes('AbilityBuilder') &&
            compiledCode.includes('PureAbility'),
    message: compiledCode.includes('class AbilityFactory') ? 
      'AbilityFactory class implemented with CASL integration and permission rule creation' : 
      'AbilityFactory class is missing or incomplete. Should integrate with CASL and handle permission rules'
  });

  // Test 4: FeatureFlagManager class exists
  results.push({
    name: 'FeatureFlagManager Implementation',
    passed: compiledCode.includes('class FeatureFlagManager') &&
            compiledCode.includes('loadFlags') &&
            compiledCode.includes('isEnabled') &&
            compiledCode.includes('isEnabledWithContext') &&
            compiledCode.includes('getEnabledFlags'),
    message: compiledCode.includes('class FeatureFlagManager') ? 
      'FeatureFlagManager class implemented with flag evaluation and targeting' : 
      'FeatureFlagManager class is missing or incomplete. Should handle feature flag evaluation and user targeting'
  });

  // Test 5: AuditLogger class exists
  results.push({
    name: 'AuditLogger Security Compliance',
    passed: compiledCode.includes('class AuditLogger') &&
            compiledCode.includes('logAccess') &&
            compiledCode.includes('logPermissionDenied') &&
            compiledCode.includes('flushLogs') &&
            compiledCode.includes('startAutoFlush') &&
            compiledCode.includes('stopAutoFlush'),
    message: compiledCode.includes('class AuditLogger') ? 
      'AuditLogger class implemented with access logging and batch processing' : 
      'AuditLogger class is missing or incomplete. Should include audit logging, batching, and automatic flushing'
  });

  // Test 6: PermissionProvider component exists
  results.push({
    name: 'PermissionProvider Context Implementation',
    passed: compiledCode.includes('PermissionProvider:') &&
            compiledCode.includes('PermissionContext') &&
            compiledCode.includes('AbilityContext') &&
            compiledCode.includes('useState') &&
            compiledCode.includes('useEffect') &&
            compiledCode.includes('useMemo'),
    message: compiledCode.includes('PermissionProvider:') ? 
      'PermissionProvider component implemented with context management and ability integration' : 
      'PermissionProvider component is missing or incomplete. Should provide permission context and ability management'
  });

  // Test 7: usePermissions hook exists
  results.push({
    name: 'usePermissions Custom Hook',
    passed: compiledCode.includes('function usePermissions') &&
            compiledCode.includes('useContext') &&
            compiledCode.includes('PermissionContext') &&
            (compiledCode.includes('throw new Error') || compiledCode.includes('throw')),
    message: compiledCode.includes('function usePermissions') ? 
      'usePermissions hook implemented with context access and error handling' : 
      'usePermissions hook is missing or incomplete. Should use context and throw error if used outside provider'
  });

  // Test 8: RoleGuard component exists
  results.push({
    name: 'RoleGuard Access Control Component',
    passed: compiledCode.includes('RoleGuard:') &&
            compiledCode.includes('requiredRoles') &&
            compiledCode.includes('requiredPermissions') &&
            compiledCode.includes('hasPermission') &&
            compiledCode.includes('mode') &&
            (compiledCode.includes('any') || compiledCode.includes('all')),
    message: compiledCode.includes('RoleGuard:') ? 
      'RoleGuard component implemented with role and permission checking' : 
      'RoleGuard component is missing or incomplete. Should handle role and permission-based access control'
  });

  // Test 9: FeatureFlag component exists
  results.push({
    name: 'FeatureFlag Conditional Rendering',
    passed: compiledCode.includes('FeatureFlag:') &&
            compiledCode.includes('checkFeatureFlag') &&
            compiledCode.includes('flag') &&
            compiledCode.includes('fallback') &&
            compiledCode.includes('useMemo'),
    message: compiledCode.includes('FeatureFlag:') ? 
      'FeatureFlag component implemented with conditional rendering and flag checking' : 
      'FeatureFlag component is missing or incomplete. Should handle feature flag evaluation and conditional rendering'
  });

  // Test 10: PermissionButton component exists
  results.push({
    name: 'PermissionButton Access Control',
    passed: compiledCode.includes('PermissionButton:') &&
            compiledCode.includes('action') &&
            compiledCode.includes('subject') &&
            compiledCode.includes('hasPermission') &&
            compiledCode.includes('logAccess') &&
            compiledCode.includes('onClick'),
    message: compiledCode.includes('PermissionButton:') ? 
      'PermissionButton component implemented with permission checking and action logging' : 
      'PermissionButton component is missing or incomplete. Should check permissions and log actions'
  });

  // Test 11: CASL integration
  results.push({
    name: 'CASL Authorization Library Integration',
    passed: compiledCode.includes('@casl/ability') &&
            compiledCode.includes('@casl/react') &&
            compiledCode.includes('Can') &&
            compiledCode.includes('AbilityContext') &&
            compiledCode.includes('createContextualCan'),
    message: compiledCode.includes('@casl/ability') ? 
      'CASL library properly integrated with ability context and Can component' : 
      'CASL integration is missing or incomplete. Should use @casl/ability and @casl/react for permission checking'
  });

  // Test 12: Role hierarchy and inheritance
  results.push({
    name: 'Role Hierarchy and Inheritance',
    passed: compiledCode.includes('inheritsFrom') &&
            compiledCode.includes('roleHierarchy') &&
            compiledCode.includes('inheritPermissions') &&
            compiledCode.includes('resolveUserPermissions') &&
            (compiledCode.includes('level') || compiledCode.includes('hierarchy')),
    message: compiledCode.includes('inheritsFrom') ? 
      'Role hierarchy and inheritance properly implemented with permission resolution' : 
      'Role hierarchy is missing or incomplete. Should handle role inheritance and permission resolution'
  });

  // Test 13: Permission caching and optimization
  results.push({
    name: 'Permission Caching and Performance',
    passed: compiledCode.includes('useMemo') &&
            compiledCode.includes('useCallback') &&
            (compiledCode.includes('cache') || compiledCode.includes('Map')) &&
            compiledCode.includes('getEffectivePermissions'),
    message: compiledCode.includes('useMemo') ? 
      'Permission caching and performance optimization implemented with memoization' : 
      'Permission caching is missing or incomplete. Should use memoization and caching for performance'
  });

  // Test 14: Audit logging and compliance
  results.push({
    name: 'Audit Logging and Security Compliance',
    passed: compiledCode.includes('logAccess') &&
            compiledCode.includes('logPermissionDenied') &&
            compiledCode.includes('AuditLogEntry') &&
            compiledCode.includes('timestamp') &&
            (compiledCode.includes('metadata') || compiledCode.includes('context')),
    message: compiledCode.includes('logAccess') ? 
      'Audit logging properly implemented with access tracking and security compliance' : 
      'Audit logging is missing or incomplete. Should track access attempts and permission denials'
  });

  // Test 15: Component integration test
  const componentResult = createComponentTest(
    'AuthorizationRBACDemo',
    compiledCode,
    {
      requiredElements: ['PermissionProvider', 'button', 'div'],
      customValidation: (code) => code.includes('Authorization') || code.includes('RBAC') || code.includes('Permission'),
      errorMessage: 'AuthorizationRBACDemo component should render RBAC demonstration interface'
    }
  );
  results.push(componentResult);

  return results;
}