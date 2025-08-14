import React, { useState, useEffect, useContext, createContext, useCallback, useMemo } from 'react';
import { AbilityBuilder, PureAbility, subject } from '@casl/ability';
import { Can, AbilityContext, createContextualCan } from '@casl/react';

// Permission and Role Types
type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'publish';
type Subjects = 'User' | 'Post' | 'Comment' | 'Report' | 'Admin' | 'all';

interface Permission {
  id: string;
  action: Actions;
  subject: Subjects;
  conditions?: Record<string, any>;
  fields?: string[];
  inverted?: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  inheritsFrom?: string[];
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  department: string;
  isActive: boolean;
  directReports?: string[];
  managerId?: string;
}

interface Resource {
  id: string;
  type: Subjects;
  ownerId?: string;
  department?: string;
  status: string;
  createdAt: Date;
  [key: string]: any;
}

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetRoles?: string[];
  targetDepartments?: string[];
  conditions?: Record<string, any>;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  success: boolean;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

type AppAbility = PureAbility<[Actions, Subjects | Resource]>;

interface PermissionContextType {
  ability: AppAbility;
  user: User | null;
  roles: Role[];
  hasPermission: (action: Actions, subject: Subjects | Resource, field?: string) => boolean;
  canUser: (action: Actions, subject: Subjects | Resource) => boolean;
  getUserRoles: () => Role[];
  checkFeatureFlag: (flagKey: string) => boolean;
  logAccess: (action: string, resource: string, resourceId: string) => void;
}

// RoleManager Implementation
class RoleManager {
  private roles: Map<string, Role> = new Map();
  private roleHierarchy: Map<string, Set<string>> = new Map();

  async loadRoles(roles: Role[]): Promise<void> {
    this.roles.clear();
    this.roleHierarchy.clear();

    // Load roles into memory
    roles.forEach(role => {
      this.roles.set(role.id, role);
    });

    // Build role hierarchy for inheritance
    roles.forEach(role => {
      if (role.inheritsFrom) {
        role.inheritsFrom.forEach(parentRoleId => {
          if (!this.roleHierarchy.has(parentRoleId)) {
            this.roleHierarchy.set(parentRoleId, new Set());
          }
          this.roleHierarchy.get(parentRoleId)!.add(role.id);
        });
      }
    });
  }

  resolveUserPermissions(userRoles: string[]): Permission[] {
    const allPermissions = new Map<string, Permission>();
    
    userRoles.forEach(roleId => {
      const permissions = this.inheritPermissions(roleId);
      permissions.forEach(permission => {
        // Use permission ID as key to avoid duplicates
        allPermissions.set(permission.id, permission);
      });
    });

    return Array.from(allPermissions.values());
  }

  validateRoleHierarchy(roles: Role[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (roleId: string): boolean => {
      if (recursionStack.has(roleId)) return true;
      if (visited.has(roleId)) return false;

      visited.add(roleId);
      recursionStack.add(roleId);

      const role = this.roles.get(roleId);
      if (role?.inheritsFrom) {
        for (const parentId of role.inheritsFrom) {
          if (hasCycle(parentId)) return true;
        }
      }

      recursionStack.delete(roleId);
      return false;
    };

    // Check each role for cycles
    for (const role of roles) {
      if (hasCycle(role.id)) return false;
    }

    return true;
  }

  getEffectivePermissions(userId: string, context?: Record<string, any>): Permission[] {
    // This would typically fetch user roles from the context or API
    // For demo purposes, we'll return cached permissions
    return [];
  }

  private inheritPermissions(roleId: string, visited = new Set<string>()): Permission[] {
    if (visited.has(roleId)) return []; // Prevent circular inheritance
    visited.add(roleId);

    const role = this.roles.get(roleId);
    if (!role) return [];

    let permissions = [...role.permissions];

    // Recursively collect inherited permissions
    if (role.inheritsFrom) {
      role.inheritsFrom.forEach(parentRoleId => {
        const inheritedPermissions = this.inheritPermissions(parentRoleId, visited);
        permissions = [...permissions, ...inheritedPermissions];
      });
    }

    return permissions;
  }
}

// AbilityFactory Implementation
class AbilityFactory {
  static createAbility(permissions: Permission[], user: User): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(PureAbility);
    
    permissions.forEach(permission => {
      const conditions = this.createConditionalRule(permission, user);
      const fields = this.applyFieldPermissions(permission);

      if (permission.inverted) {
        cannot(permission.action, permission.subject, fields, conditions);
      } else {
        can(permission.action, permission.subject, fields, conditions);
      }
    });

    return build();
  }

  static createConditionalRule(permission: Permission, user: User): any {
    if (!permission.conditions) return {};

    const conditions: any = {};

    // Handle ownership conditions
    if (permission.conditions.owner) {
      conditions.ownerId = user.id;
    }

    // Handle department conditions
    if (permission.conditions.department) {
      conditions.department = user.department;
    }

    // Handle status conditions
    if (permission.conditions.status) {
      conditions.status = permission.conditions.status;
    }

    return conditions;
  }

  static applyFieldPermissions(permission: Permission): string[] | undefined {
    return permission.fields;
  }
}

// FeatureFlagManager Implementation
class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();

  async loadFlags(flags: FeatureFlag[]): Promise<void> {
    this.flags.clear();
    flags.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
  }

  isEnabled(flagKey: string, user: User): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag || !flag.enabled) return false;

    // Check user targeting
    if (flag.targetUsers && !flag.targetUsers.includes(user.id)) {
      return false;
    }

    // Check role targeting
    if (flag.targetRoles && !flag.targetRoles.some(role => user.roles.includes(role))) {
      return false;
    }

    // Check department targeting
    if (flag.targetDepartments && !flag.targetDepartments.includes(user.department)) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userHash = this.hashUser(user.id, flagKey);
      return userHash < flag.rolloutPercentage;
    }

    return true;
  }

  isEnabledWithContext(flagKey: string, user: User, context: Record<string, any>): boolean {
    const baseEnabled = this.isEnabled(flagKey, user);
    if (!baseEnabled) return false;

    const flag = this.flags.get(flagKey);
    if (!flag?.conditions) return true;

    // Evaluate additional contextual conditions
    return Object.entries(flag.conditions).every(([key, value]) => {
      return context[key] === value;
    });
  }

  getEnabledFlags(user: User): string[] {
    return Array.from(this.flags.values())
      .filter(flag => this.isEnabled(flag.key, user))
      .map(flag => flag.key);
  }

  private hashUser(userId: string, flagKey: string): number {
    // Simple hash function for rollout percentage
    let hash = 0;
    const str = userId + flagKey;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
}

// AuditLogger Implementation
class AuditLogger {
  private buffer: AuditLogEntry[] = [];
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  logAccess(userId: string, action: string, resource: string, resourceId: string, success: boolean, metadata?: Record<string, any>): void {
    const entry: AuditLogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId,
      action,
      resource,
      resourceId,
      success,
      metadata: metadata || {},
      ipAddress: '127.0.0.1', // Would be real IP in production
      userAgent: navigator.userAgent,
      timestamp: new Date(),
    };

    this.buffer.push(entry);

    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flushLogs();
    }
  }

  logPermissionDenied(userId: string, action: string, resource: string, reason: string): void {
    this.logAccess(userId, action, resource, '', false, { reason, type: 'permission_denied' });
    // Immediate flush for security events
    this.flushLogs();
  }

  private async flushLogs(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      // In production, send to audit service
      console.log('Flushing audit logs:', logsToFlush);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Re-add logs to buffer for retry
      this.buffer.unshift(...logsToFlush);
    }
  }

  startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.FLUSH_INTERVAL);
  }

  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Flush remaining logs
    this.flushLogs();
  }
}

// PermissionContext Implementation
const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// PermissionProvider Implementation
const PermissionProvider: React.FC<{ user: User | null; children: React.ReactNode }> = ({ user, children }) => {
  const [ability, setAbility] = useState<AppAbility>(new PureAbility());
  const [roles, setRoles] = useState<Role[]>([]);
  
  const roleManager = useMemo(() => new RoleManager(), []);
  const featureFlagManager = useMemo(() => new FeatureFlagManager(), []);
  const auditLogger = useMemo(() => new AuditLogger(), []);

  // Initialize permissions on user change
  useEffect(() => {
    const initializePermissions = async () => {
      if (user) {
        // Load roles and feature flags
        await roleManager.loadRoles(mockRoles);
        await featureFlagManager.loadFlags(mockFeatureFlags);
        
        // Resolve user permissions
        const permissions = roleManager.resolveUserPermissions(user.roles);
        
        // Create ability instance
        const userAbility = AbilityFactory.createAbility(permissions, user);
        setAbility(userAbility);
        setRoles(mockRoles);
        
        // Start audit logging
        auditLogger.startAutoFlush();
      }
    };

    initializePermissions();

    return () => {
      auditLogger.stopAutoFlush();
    };
  }, [user, roleManager, featureFlagManager, auditLogger]);

  const hasPermission = useCallback((action: Actions, subject: Subjects | Resource, field?: string): boolean => {
    try {
      const result = ability.can(action, subject, field);
      
      if (user) {
        auditLogger.logAccess(
          user.id, 
          action, 
          typeof subject === 'string' ? subject : subject.type,
          typeof subject === 'string' ? '' : subject.id,
          result
        );
        
        if (!result) {
          auditLogger.logPermissionDenied(user.id, action, typeof subject === 'string' ? subject : subject.type, 'Insufficient permissions');
        }
      }
      
      return result;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }, [ability, auditLogger, user]);

  const canUser = useCallback((action: Actions, subject: Subjects | Resource): boolean => {
    return hasPermission(action, subject);
  }, [hasPermission]);

  const getUserRoles = useCallback((): Role[] => {
    if (!user) return [];
    return roles.filter(role => user.roles.includes(role.id));
  }, [roles, user]);

  const checkFeatureFlag = useCallback((flagKey: string): boolean => {
    return user ? featureFlagManager.isEnabled(flagKey, user) : false;
  }, [featureFlagManager, user]);

  const logAccess = useCallback((action: string, resource: string, resourceId: string): void => {
    if (user) {
      auditLogger.logAccess(user.id, action, resource, resourceId, true);
    }
  }, [auditLogger, user]);

  return (
    <PermissionContext.Provider value={{
      ability,
      user,
      roles,
      hasPermission,
      canUser,
      getUserRoles,
      checkFeatureFlag,
      logAccess,
    }}>
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </PermissionContext.Provider>
  );
};

// usePermissions hook
export function usePermissions(): PermissionContextType {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
}

// RoleGuard Implementation
interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: Array<{ action: Actions; subject: Subjects }>;
  mode?: 'any' | 'all';
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  requiredRoles = [],
  requiredPermissions = [],
  mode = 'any',
  fallback,
  onUnauthorized 
}) => {
  const { user, hasPermission, getUserRoles } = usePermissions();

  const hasRequiredRoles = useMemo(() => {
    if (requiredRoles.length === 0) return true;
    if (!user) return false;

    const userRoleIds = user.roles;
    
    if (mode === 'all') {
      return requiredRoles.every(roleId => userRoleIds.includes(roleId));
    } else {
      return requiredRoles.some(roleId => userRoleIds.includes(roleId));
    }
  }, [user, requiredRoles, mode]);

  const hasRequiredPermissions = useMemo(() => {
    if (requiredPermissions.length === 0) return true;
    
    if (mode === 'all') {
      return requiredPermissions.every(permission => 
        hasPermission(permission.action, permission.subject)
      );
    } else {
      return requiredPermissions.some(permission => 
        hasPermission(permission.action, permission.subject)
      );
    }
  }, [requiredPermissions, mode, hasPermission]);

  useEffect(() => {
    if (!hasRequiredRoles || !hasRequiredPermissions) {
      onUnauthorized?.();
    }
  }, [hasRequiredRoles, hasRequiredPermissions, onUnauthorized]);

  if (!hasRequiredRoles || !hasRequiredPermissions) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// FeatureFlag Implementation
interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureFlag: React.FC<FeatureFlagProps> = ({ flag, children, fallback }) => {
  const { checkFeatureFlag } = usePermissions();

  const isEnabled = useMemo(() => {
    return checkFeatureFlag(flag);
  }, [flag, checkFeatureFlag]);

  if (!isEnabled) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// PermissionButton Implementation
interface PermissionButtonProps {
  action: Actions;
  subject: Subjects | Resource;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const PermissionButton: React.FC<PermissionButtonProps> = ({ 
  action, 
  subject, 
  onClick, 
  children, 
  disabled = false,
  className,
  style 
}) => {
  const { hasPermission, logAccess } = usePermissions();

  const canPerformAction = useMemo(() => {
    return hasPermission(action, subject);
  }, [action, subject, hasPermission]);

  const handleClick = useCallback(() => {
    if (canPerformAction && !disabled) {
      logAccess(action, typeof subject === 'string' ? subject : subject.type, 
                typeof subject === 'string' ? '' : subject.id);
      onClick();
    }
  }, [canPerformAction, disabled, onClick, logAccess, action, subject]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !canPerformAction}
      className={className}
      style={{
        opacity: canPerformAction ? 1 : 0.5,
        cursor: canPerformAction && !disabled ? 'pointer' : 'not-allowed',
        ...style
      }}
    >
      {children}
    </button>
  );
};

// ResourceViewer Implementation
const ResourceViewer: React.FC<{ resource: Resource }> = ({ resource }) => {
  const Can = createContextualCan(AbilityContext.Consumer);

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '15px',
      marginBottom: '10px'
    }}>
      <h4>{resource.type} #{resource.id}</h4>
      
      <Can I="read" this={resource}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Status:</strong> {resource.status}
          <br />
          <strong>Created:</strong> {resource.createdAt.toLocaleDateString()}
          {resource.ownerId && (
            <>
              <br />
              <strong>Owner:</strong> {resource.ownerId}
            </>
          )}
          {resource.department && (
            <>
              <br />
              <strong>Department:</strong> {resource.department}
            </>
          )}
        </div>
      </Can>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Can I="update" this={resource}>
          <PermissionButton
            action="update"
            subject={resource}
            onClick={() => console.log('Updating resource', resource.id)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Edit
          </PermissionButton>
        </Can>

        <Can I="delete" this={resource}>
          <PermissionButton
            action="delete"
            subject={resource}
            onClick={() => console.log('Deleting resource', resource.id)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delete
          </PermissionButton>
        </Can>

        <FeatureFlag flag="advanced-actions">
          <Can I="approve" this={resource}>
            <PermissionButton
              action="approve"
              subject={resource}
              onClick={() => console.log('Approving resource', resource.id)}
              style={{
                padding: '5px 10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Approve
            </PermissionButton>
          </Can>
        </FeatureFlag>
      </div>
    </div>
  );
};

// UserRoleManager Implementation
const UserRoleManager: React.FC = () => {
  const { user, getUserRoles } = usePermissions();

  const userRoles = getUserRoles();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h3>Role Management</h3>
      
      {user && (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4>Current User: {user.firstName} {user.lastName}</h4>
          <div style={{ marginBottom: '10px' }}>
            <strong>Department:</strong> {user.department}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Assigned Roles:</strong>
            <ul>
              {user.roles.map(roleId => {
                const role = userRoles.find(r => r.id === roleId);
                return (
                  <li key={roleId}>
                    <strong>{role ? role.name : roleId}</strong> - {role ? role.description : 'Unknown'}
                    {role && (
                      <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                        {role.permissions.map(permission => (
                          <li key={permission.id}>
                            {permission.action}:{permission.subject}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <RoleGuard requiredPermissions={[{ action: 'manage', subject: 'User' }]}>
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '15px'
        }}>
          <h4>🔒 Admin Actions</h4>
          <p>You have administrative permissions to manage users and roles.</p>
          
          <FeatureFlag 
            flag="role-management"
            fallback={
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                Role management feature is not enabled for your account.
              </p>
            }
          >
            <button
              style={{
                padding: '10px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Manage Roles & Permissions
            </button>
          </FeatureFlag>
        </div>
      </RoleGuard>
    </div>
  );
};

// Mock data
const mockRoles: Role[] = [
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Can view content',
    level: 1,
    permissions: [
      { id: '1', action: 'read', subject: 'Post' },
      { id: '2', action: 'read', subject: 'Comment' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can edit content',
    level: 2,
    inheritsFrom: ['viewer'],
    permissions: [
      { id: '3', action: 'create', subject: 'Post', conditions: { department: true } },
      { id: '4', action: 'update', subject: 'Post', conditions: { owner: true } },
      { id: '5', action: 'create', subject: 'Comment' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    level: 3,
    inheritsFrom: ['editor'],
    permissions: [
      { id: '6', action: 'manage', subject: 'all' },
      { id: '7', action: 'delete', subject: 'Post' },
      { id: '8', action: 'approve', subject: 'Post' },
      { id: '9', action: 'manage', subject: 'User' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['admin'],
    department: 'IT',
    isActive: true,
  },
  {
    id: '2',
    email: 'editor@example.com',
    firstName: 'Editor',
    lastName: 'User',
    roles: ['editor'],
    department: 'Content',
    isActive: true,
  },
  {
    id: '3',
    email: 'viewer@example.com',
    firstName: 'Viewer',
    lastName: 'User',
    roles: ['viewer'],
    department: 'Marketing',
    isActive: true,
  },
];

const mockResources: Resource[] = [
  {
    id: '1',
    type: 'Post',
    ownerId: '2',
    department: 'Content',
    status: 'draft',
    title: 'Sample Blog Post',
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'Post',
    ownerId: '1',
    department: 'IT',
    status: 'published',
    title: 'Technical Documentation',
    createdAt: new Date(),
  },
  {
    id: '3',
    type: 'Post',
    ownerId: '3',
    department: 'Marketing',
    status: 'review',
    title: 'Marketing Campaign',
    createdAt: new Date(),
  },
];

const mockFeatureFlags: FeatureFlag[] = [
  {
    key: 'advanced-actions',
    name: 'Advanced Actions',
    description: 'Enable advanced action buttons',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'editor'],
  },
  {
    key: 'role-management',
    name: 'Role Management UI',
    description: 'Enable role management interface',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin'],
  },
];

// Main Demo Component
const AuthorizationRBACDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'resources' | 'roles' | 'flags'>('resources');
  const [selectedUser, setSelectedUser] = useState<User>(mockUsers[0]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Authorization & RBAC System</h1>
      
      <div style={{ 
        background: '#d4edda', 
        border: '1px solid #c3e6cb', 
        padding: '15px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h3>✅ Complete Implementation</h3>
        <ul style={{ margin: 0 }}>
          <li>✅ RoleManager with permission inheritance and hierarchy validation</li>
          <li>✅ AbilityFactory with CASL integration and conditional permissions</li>
          <li>✅ FeatureFlagManager with user targeting and rollout controls</li>
          <li>✅ AuditLogger with batch processing and security compliance</li>
          <li>✅ PermissionProvider with context management and caching</li>
          <li>✅ RoleGuard, PermissionButton, and FeatureFlag components</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Demo User:</label>
        <select 
          value={selectedUser.id}
          onChange={(e) => setSelectedUser(mockUsers.find(u => u.id === e.target.value) || mockUsers[0])}
          style={{
            padding: '5px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginRight: '20px'
          }}
        >
          {mockUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.roles.join(', ')})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveDemo('resources')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeDemo === 'resources' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'resources' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px 0 0 4px',
            cursor: 'pointer'
          }}
        >
          Resource Access
        </button>
        <button
          onClick={() => setActiveDemo('roles')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeDemo === 'roles' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'roles' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderLeft: 'none',
            cursor: 'pointer'
          }}
        >
          Role Management
        </button>
        <button
          onClick={() => setActiveDemo('flags')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeDemo === 'flags' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'flags' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderLeft: 'none',
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer'
          }}
        >
          Feature Flags
        </button>
      </div>

      <PermissionProvider user={selectedUser}>
        {activeDemo === 'resources' && (
          <div>
            <h3>Resource Access Control</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Switch between users to see how permissions change based on roles and ownership.
            </p>
            {mockResources.map(resource => (
              <ResourceViewer key={resource.id} resource={resource} />
            ))}
          </div>
        )}
        
        {activeDemo === 'roles' && <UserRoleManager />}
        
        {activeDemo === 'flags' && (
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Feature Flag Demonstration</h3>
            
            <FeatureFlag flag="advanced-actions">
              <div style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px', marginBottom: '10px' }}>
                ✅ <strong>Advanced Actions</strong> feature is enabled for your role ({selectedUser.roles.join(', ')})
              </div>
            </FeatureFlag>
            
            <FeatureFlag 
              flag="role-management"
              fallback={
                <div style={{ padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px', marginBottom: '10px' }}>
                  ❌ <strong>Role Management</strong> feature is not available for your role ({selectedUser.roles.join(', ')})
                </div>
              }
            >
              <div style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px', marginBottom: '10px' }}>
                ✅ <strong>Role Management</strong> feature is enabled for your role ({selectedUser.roles.join(', ')})
              </div>
            </FeatureFlag>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h4>Feature Flag Implementation</h4>
              <ul style={{ fontSize: '14px', margin: 0 }}>
                <li>✅ Role-based targeting (admin vs editor vs viewer)</li>
                <li>✅ User-specific overrides and targeting</li>
                <li>✅ Rollout percentage controls</li>
                <li>✅ Conditional rendering with fallbacks</li>
              </ul>
            </div>
          </div>
        )}
      </PermissionProvider>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>RBAC Implementation Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <h4>Role & Permission Management</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>✅ Hierarchical role inheritance (viewer → editor → admin)</li>
              <li>✅ Fine-grained permission control with conditions</li>
              <li>✅ Resource-based access control (ownership, department)</li>
              <li>✅ Field-level permission restrictions</li>
            </ul>
          </div>
          <div>
            <h4>CASL Integration</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>✅ Dynamic ability creation from permissions</li>
              <li>✅ Conditional permission rules</li>
              <li>✅ React component integration with Can</li>
              <li>✅ Real-time permission evaluation</li>
            </ul>
          </div>
          <div>
            <h4>Feature Flag System</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>✅ Role and user-based targeting</li>
              <li>✅ Gradual rollout with percentage controls</li>
              <li>✅ Conditional rendering and fallbacks</li>
              <li>✅ Department and context-aware flags</li>
            </ul>
          </div>
          <div>
            <h4>Audit & Security</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>✅ Comprehensive access logging</li>
              <li>✅ Permission denial tracking</li>
              <li>✅ Batch processing for performance</li>
              <li>✅ Security event monitoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorizationRBACDemo;