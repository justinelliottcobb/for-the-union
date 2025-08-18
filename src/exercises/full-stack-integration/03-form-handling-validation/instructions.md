# Enterprise Form Handling & Validation

## Overview

In this exercise, you'll build enterprise-grade form handling using React Hook Form, Zod validation, and advanced patterns for server-side validation integration. This exercise focuses on patterns that Staff Frontend Engineers use to create robust, user-friendly forms in production applications with complex validation requirements.

**Difficulty:** ⭐⭐⭐⭐ (75 minutes)

## Learning Objectives

By completing this exercise, you will:

- Master React Hook Form for complex form scenarios
- Integrate Zod schemas for comprehensive validation
- Handle server-side validation and error mapping
- Implement dynamic field dependencies and conditional logic
- Create reusable form components and validation patterns
- Build async validation and debounced field validation

## Background

Modern applications require sophisticated form handling that goes beyond basic validation. Enterprise forms need to handle:
- Complex field dependencies and conditional logic
- Server-side validation integration
- Async validation for real-time feedback
- Dynamic form generation from schemas
- File upload and multi-step form flows
- Accessibility and internationalization

React Hook Form provides excellent performance and DX, while Zod ensures type-safe validation that works both client and server-side.

## Requirements

### Core Components

1. **DynamicForm Generator**
   - Schema-driven form generation
   - Conditional field rendering
   - Type-safe field components
   - Custom validation rules

2. **ValidationProvider**
   - Centralized validation logic
   - Server error mapping
   - Async validation handling
   - Error message localization

3. **SubmissionHandler**
   - Optimistic form submissions
   - Progress tracking
   - Error recovery strategies
   - File upload integration

### Key Features

1. **Field Dependencies**
   - Conditional field visibility
   - Dynamic validation rules
   - Cross-field validation
   - Cascading value updates

2. **Async Validation**
   - Debounced field validation
   - Real-time uniqueness checks
   - Server-side rule validation
   - Loading state management

3. **Error Handling**
   - Client-side validation
   - Server error integration
   - Field-level error display
   - Form-level error summary

## Implementation Tasks

### Task 1: Advanced Form Schema Definition

Create type-safe form schemas:

```typescript
interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  validation?: z.ZodSchema;
  asyncValidation?: (value: any) => Promise<string | null>;
  dependencies?: FieldDependency[];
  options?: SelectOption[]; // For select fields
}

interface FieldDependency {
  field: string;
  condition: (value: any) => boolean;
  action: 'show' | 'hide' | 'enable' | 'disable' | 'validate';
  target?: string;
}

interface FormSchema {
  fields: FormFieldConfig[];
  validation: z.ZodSchema;
  onSubmit: (data: any) => Promise<any>;
}
```

### Task 2: Dynamic Form Generator

Implement schema-driven form generation:

```typescript
interface DynamicFormProps {
  schema: FormSchema;
  initialValues?: Record<string, any>;
  onSubmit: (data: any) => Promise<void>;
  onValidationError?: (errors: FieldErrors) => void;
}

function DynamicForm({ schema, initialValues, onSubmit }: DynamicFormProps) {
  // Generate form fields from schema
  // Handle field dependencies
  // Manage conditional rendering
  // Integrate with React Hook Form
}
```

### Task 3: Advanced Validation System

Create comprehensive validation handling:

```typescript
class ValidationManager {
  // Client-side validation
  validateField(field: string, value: any, schema: z.ZodSchema): ValidationResult;
  
  // Server-side validation integration
  mapServerErrors(serverErrors: any[]): FieldErrors;
  
  // Async validation with debouncing
  validateAsync(field: string, value: any, validator: AsyncValidator): Promise<string | null>;
  
  // Cross-field validation
  validateFieldDependencies(field: string, allValues: any, dependencies: FieldDependency[]): ValidationResult;
}
```

### Task 4: Custom Form Components

Build reusable form field components:

```typescript
// Base form field with validation
interface FormFieldProps {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

// Specialized field components
function TextInput({ name, validation, asyncValidation, ...props }: TextInputProps);
function SelectField({ name, options, validation, ...props }: SelectFieldProps);
function FileUpload({ name, accept, multiple, validation, ...props }: FileUploadProps);
function CheckboxGroup({ name, options, validation, ...props }: CheckboxGroupProps);
```

### Task 5: Multi-Step Form Management

Implement wizard-style forms:

```typescript
interface FormStep {
  id: string;
  title: string;
  fields: string[];
  validation: z.ZodSchema;
  optional?: boolean;
}

function MultiStepForm({ steps, onComplete }: MultiStepFormProps) {
  // Step navigation
  // Progress tracking
  // Partial validation
  // Data persistence
}
```

### Task 6: File Upload Integration

Handle file uploads with validation:

```typescript
interface FileUploadConfig {
  accept: string[];
  maxSize: number;
  multiple: boolean;
  uploadEndpoint: string;
  onProgress?: (progress: number) => void;
}

function useFileUpload(config: FileUploadConfig) {
  // File validation
  // Upload progress tracking
  // Error handling
  // Preview generation
}
```

## Example Usage

Your implementation should support these usage patterns:

```typescript
// Basic form with validation
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const UserForm = () => {
  const form = useForm({
    resolver: zodResolver(userSchema),
    mode: 'onBlur'
  });

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <TextInput 
        name="email" 
        label="Email"
        asyncValidation={checkEmailUniqueness}
      />
      <PasswordInput name="password" label="Password" />
      <PasswordInput name="confirmPassword" label="Confirm Password" />
      <SubmitButton>Create Account</SubmitButton>
    </Form>
  );
};

// Dynamic form from schema
const dynamicFormSchema: FormSchema = {
  fields: [
    {
      name: 'userType',
      type: 'select',
      label: 'User Type',
      required: true,
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'user', label: 'Regular User' }
      ]
    },
    {
      name: 'adminCode',
      type: 'text',
      label: 'Admin Code',
      dependencies: [{
        field: 'userType',
        condition: (value) => value === 'admin',
        action: 'show'
      }]
    }
  ],
  validation: dynamicUserSchema,
  onSubmit: createUser
};

// Multi-step form
const onboardingSteps: FormStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    fields: ['firstName', 'lastName', 'email'],
    validation: personalInfoSchema
  },
  {
    id: 'preferences',
    title: 'Preferences',
    fields: ['theme', 'notifications'],
    validation: preferencesSchema
  }
];
```

## Testing Requirements

Your implementation should include comprehensive tests:

1. **Validation Tests**
   - Client-side validation rules
   - Server error integration
   - Async validation handling
   - Cross-field validation

2. **Form Behavior Tests**
   - Field dependency logic
   - Conditional rendering
   - Multi-step navigation
   - File upload handling

3. **User Experience Tests**
   - Error message display
   - Loading states
   - Form submission flow
   - Accessibility compliance

4. **Performance Tests**
   - Async validation debouncing
   - Large form rendering
   - File upload performance
   - Memory usage optimization

## Advanced Challenges

For additional practice, implement:

1. **Form Builder Interface**
   - Drag-and-drop form creation
   - Schema export/import
   - Preview functionality

2. **Advanced File Handling**
   - Image resizing and optimization
   - Multiple file upload with progress
   - Drag-and-drop upload zones

3. **Internationalization**
   - Multi-language form labels
   - Localized error messages
   - RTL layout support

## Success Criteria

Your implementation should:

- ✅ Provide comprehensive form validation with excellent UX
- ✅ Handle complex field dependencies and conditional logic
- ✅ Integrate server-side validation seamlessly
- ✅ Support async validation with proper debouncing
- ✅ Create reusable, type-safe form components
- ✅ Handle file uploads with progress and validation
- ✅ Maintain excellent performance with large forms
- ✅ Follow accessibility best practices

## Tips

- Start with basic React Hook Form setup and gradually add complexity
- Use Zod for both client and server-side validation schemas
- Implement proper error boundaries for form failures
- Focus on user experience - provide immediate feedback when possible
- Test with screen readers and keyboard navigation
- Consider mobile-first responsive design
- Implement proper loading states for async operations
- Use TypeScript generics for maximum type safety

This exercise demonstrates patterns used in enterprise applications where form complexity, user experience, and data integrity are critical. Focus on building a foundation that can handle the most demanding form requirements while maintaining excellent performance and usability.