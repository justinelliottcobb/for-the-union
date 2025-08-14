import { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: FormFieldConfig interface exists
  results.push({
    name: 'FormFieldConfig Interface Definition',
    passed: compiledCode.includes('interface FormFieldConfig') && 
            compiledCode.includes('name:') && 
            compiledCode.includes('type:') &&
            compiledCode.includes('label:') &&
            compiledCode.includes('validation?:') &&
            compiledCode.includes('asyncValidation?:') &&
            compiledCode.includes('dependencies?:'),
    message: compiledCode.includes('interface FormFieldConfig') ? 
      'FormFieldConfig interface properly defined with all required field configuration properties' : 
      'FormFieldConfig interface is missing or incomplete. Should include name, type, label, validation, asyncValidation, and dependencies'
  });

  // Test 2: FieldDependency interface exists
  results.push({
    name: 'FieldDependency Interface Type Safety',
    passed: compiledCode.includes('interface FieldDependency') &&
            compiledCode.includes('field:') &&
            compiledCode.includes('condition:') &&
            compiledCode.includes('action:') &&
            (compiledCode.includes('show') || compiledCode.includes('hide') || compiledCode.includes('enable')),
    message: compiledCode.includes('interface FieldDependency') ? 
      'FieldDependency interface properly defined with field, condition, and action properties' : 
      'FieldDependency interface is missing or incomplete. Should include field reference, condition function, and action type'
  });

  // Test 3: ValidationManager class exists
  results.push({
    name: 'ValidationManager Implementation',
    passed: compiledCode.includes('class ValidationManager') &&
            compiledCode.includes('validateField') &&
            compiledCode.includes('mapServerErrors') &&
            compiledCode.includes('validateAsync') &&
            compiledCode.includes('validateFieldDependencies'),
    message: compiledCode.includes('class ValidationManager') ? 
      'ValidationManager class implemented with all required validation methods' : 
      'ValidationManager class is missing or incomplete. Should include field validation, server error mapping, async validation, and dependency validation'
  });

  // Test 4: FormField base component exists
  results.push({
    name: 'FormField Base Component',
    passed: compiledCode.includes('FormField:') &&
            compiledCode.includes('FormFieldProps') &&
            compiledCode.includes('label') &&
            compiledCode.includes('error') &&
            compiledCode.includes('required') &&
            compiledCode.includes('children'),
    message: compiledCode.includes('FormField:') ? 
      'FormField base component implemented with proper props and structure' : 
      'FormField base component is missing or incomplete. Should handle label, error display, and accessibility'
  });

  // Test 5: TextInput component exists
  results.push({
    name: 'TextInput Component Implementation',
    passed: compiledCode.includes('TextInput:') &&
            compiledCode.includes('TextInputProps') &&
            compiledCode.includes('Controller') &&
            compiledCode.includes('asyncValidation') &&
            (compiledCode.includes('debounce') || compiledCode.includes('setTimeout')),
    message: compiledCode.includes('TextInput:') ? 
      'TextInput component implemented with async validation and proper form integration' : 
      'TextInput component is missing or incomplete. Should use Controller and support async validation with debouncing'
  });

  // Test 6: SelectField component exists
  results.push({
    name: 'SelectField Component Implementation',
    passed: compiledCode.includes('SelectField:') &&
            compiledCode.includes('SelectFieldProps') &&
            compiledCode.includes('options') &&
            compiledCode.includes('Controller') &&
            (compiledCode.includes('<select') || compiledCode.includes('select')),
    message: compiledCode.includes('SelectField:') ? 
      'SelectField component implemented with options support and form integration' : 
      'SelectField component is missing or incomplete. Should render select element with options and use Controller'
  });

  // Test 7: FileUpload component exists
  results.push({
    name: 'FileUpload Component Implementation',
    passed: compiledCode.includes('FileUpload:') &&
            compiledCode.includes('FileUploadProps') &&
            compiledCode.includes('accept') &&
            compiledCode.includes('maxSize') &&
            (compiledCode.includes('input') && compiledCode.includes('type="file"') || 
             compiledCode.includes("type: 'file'")),
    message: compiledCode.includes('FileUpload:') ? 
      'FileUpload component implemented with file validation and upload functionality' : 
      'FileUpload component is missing or incomplete. Should handle file input with validation and progress tracking'
  });

  // Test 8: CheckboxGroup component exists
  results.push({
    name: 'CheckboxGroup Component Implementation',
    passed: compiledCode.includes('CheckboxGroup:') &&
            compiledCode.includes('CheckboxGroupProps') &&
            compiledCode.includes('options') &&
            compiledCode.includes('Controller') &&
            (compiledCode.includes('checkbox') || compiledCode.includes('type="checkbox"')),
    message: compiledCode.includes('CheckboxGroup:') ? 
      'CheckboxGroup component implemented with multiple selection support' : 
      'CheckboxGroup component is missing or incomplete. Should render checkbox options and handle multiple selections'
  });

  // Test 9: DynamicForm component exists
  results.push({
    name: 'DynamicForm Component Implementation',
    passed: compiledCode.includes('DynamicForm:') &&
            compiledCode.includes('DynamicFormProps') &&
            compiledCode.includes('schema') &&
            compiledCode.includes('useForm') &&
            compiledCode.includes('zodResolver'),
    message: compiledCode.includes('DynamicForm:') ? 
      'DynamicForm component implemented with schema-driven form generation' : 
      'DynamicForm component is missing or incomplete. Should generate forms from schema configuration'
  });

  // Test 10: MultiStepForm component exists
  results.push({
    name: 'MultiStepForm Component Implementation',
    passed: compiledCode.includes('MultiStepForm:') &&
            compiledCode.includes('MultiStepFormProps') &&
            compiledCode.includes('steps') &&
            compiledCode.includes('currentStep') &&
            (compiledCode.includes('setCurrentStep') || compiledCode.includes('useState')),
    message: compiledCode.includes('MultiStepForm:') ? 
      'MultiStepForm component implemented with step navigation and progress tracking' : 
      'MultiStepForm component is missing or incomplete. Should handle multiple steps with navigation and validation'
  });

  // Test 11: useFileUpload hook exists
  results.push({
    name: 'useFileUpload Hook Implementation',
    passed: compiledCode.includes('function useFileUpload') &&
            compiledCode.includes('FileUploadConfig') &&
            compiledCode.includes('uploadFile') &&
            compiledCode.includes('validateFile') &&
            (compiledCode.includes('progress') || compiledCode.includes('uploading')),
    message: compiledCode.includes('function useFileUpload') ? 
      'useFileUpload hook implemented with upload functionality and progress tracking' : 
      'useFileUpload hook is missing or incomplete. Should handle file uploads with validation and progress'
  });

  // Test 12: Async validation debouncing
  results.push({
    name: 'Async Validation Debouncing',
    passed: (compiledCode.includes('setTimeout') || compiledCode.includes('debounce')) &&
            compiledCode.includes('validateAsync') &&
            (compiledCode.includes('clearTimeout') || compiledCode.includes('cancel')),
    message: (compiledCode.includes('setTimeout') || compiledCode.includes('debounce')) ? 
      'Async validation properly implemented with debouncing to prevent excessive API calls' : 
      'Async validation debouncing is missing or incomplete. Should use setTimeout or debounce utility'
  });

  // Test 13: Field dependency logic
  results.push({
    name: 'Field Dependency Logic',
    passed: compiledCode.includes('dependencies') &&
            compiledCode.includes('condition') &&
            (compiledCode.includes('isFieldVisible') || compiledCode.includes('isVisible')) &&
            (compiledCode.includes('show') || compiledCode.includes('hide')),
    message: compiledCode.includes('dependencies') ? 
      'Field dependency logic implemented for conditional field rendering and behavior' : 
      'Field dependency logic is missing or incomplete. Should handle conditional field visibility and state'
  });

  // Test 14: Form validation with Zod
  results.push({
    name: 'Zod Validation Integration',
    passed: compiledCode.includes('zodResolver') &&
            compiledCode.includes('z.object') &&
            (compiledCode.includes('z.string') || compiledCode.includes('z.enum')) &&
            compiledCode.includes('validation'),
    message: compiledCode.includes('zodResolver') ? 
      'Zod validation properly integrated with React Hook Form for type-safe validation' : 
      'Zod validation integration is missing or incomplete. Should use zodResolver with Zod schemas'
  });

  // Test 15: Component integration test
  const componentResult = createComponentTest(
    'FormHandlingDemo',
    compiledCode,
    {
      requiredElements: ['form', 'button', 'div'],
      customValidation: (code) => code.includes('Form Handling') || code.includes('validation') || code.includes('Enterprise'),
      errorMessage: 'FormHandlingDemo component should render form handling demonstration interface'
    }
  );
  results.push(componentResult);

  return results;
}