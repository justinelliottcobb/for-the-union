// Tests for useState Fundamentals
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the student's implementation
import { 
  Counter,
  UserForm,
  TodoList,
  StateAnalyzer,
  type CounterState,
  type UserFormData,
  type TodoItem,
} from '../../../exercise-files/react-hooks/01-usestate-fundamentals/exercise';

describe('useState Fundamentals', () => {
  describe('Type Definitions', () => {
    it('should have correct CounterState type', () => {
      const counterState: CounterState = {
        count: 5,
        isVisible: true,
      };
      expect(counterState.count).toBe(5);
      expect(counterState.isVisible).toBe(true);
    });

    it('should have correct UserFormData type', () => {
      const userData: UserFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };
      expect(userData.name).toBe('John Doe');
      expect(userData.email).toBe('john@example.com');
      expect(userData.age).toBe(25);
    });

    it('should have correct TodoItem type', () => {
      const todoItem: TodoItem = {
        id: 1,
        text: 'Learn React',
        completed: false,
      };
      expect(todoItem.id).toBe(1);
      expect(todoItem.text).toBe('Learn React');
      expect(todoItem.completed).toBe(false);
    });
  });

  describe('Counter Component', () => {
    it('should render counter with initial count of 0', () => {
      render(<Counter />);
      expect(screen.getByText(/Count: 0/)).toBeInTheDocument();
    });

    it('should increment count when increment button is clicked', () => {
      render(<Counter />);
      const incrementButton = screen.getByText(/Increment/);
      
      fireEvent.click(incrementButton);
      expect(screen.getByText(/Count: 1/)).toBeInTheDocument();
      
      fireEvent.click(incrementButton);
      expect(screen.getByText(/Count: 2/)).toBeInTheDocument();
    });

    it('should decrement count when decrement button is clicked', () => {
      render(<Counter />);
      const incrementButton = screen.getByText(/Increment/);
      const decrementButton = screen.getByText(/Decrement/);
      
      // First increment to 2
      fireEvent.click(incrementButton);
      fireEvent.click(incrementButton);
      expect(screen.getByText(/Count: 2/)).toBeInTheDocument();
      
      // Then decrement to 1
      fireEvent.click(decrementButton);
      expect(screen.getByText(/Count: 1/)).toBeInTheDocument();
    });

    it('should reset count to 0 when reset button is clicked', () => {
      render(<Counter />);
      const incrementButton = screen.getByText(/Increment/);
      const resetButton = screen.getByText(/Reset/);
      
      // Increment to 3
      fireEvent.click(incrementButton);
      fireEvent.click(incrementButton);
      fireEvent.click(incrementButton);
      expect(screen.getByText(/Count: 3/)).toBeInTheDocument();
      
      // Reset to 0
      fireEvent.click(resetButton);
      expect(screen.getByText(/Count: 0/)).toBeInTheDocument();
    });

    it('should toggle visibility when toggle button is clicked', () => {
      render(<Counter />);
      const toggleButton = screen.getByText(/Hide|Show/);
      
      // Initially visible
      expect(screen.getByText(/Count: 0/)).toBeInTheDocument();
      
      // Click to hide
      fireEvent.click(toggleButton);
      expect(screen.queryByText(/Count: 0/)).not.toBeInTheDocument();
      
      // Click to show again
      fireEvent.click(toggleButton);
      expect(screen.getByText(/Count: 0/)).toBeInTheDocument();
    });
  });

  describe('UserForm Component', () => {
    it('should render form inputs with initial empty values', () => {
      render(<UserForm />);
      
      const nameInput = screen.getByPlaceholderText(/name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const ageInput = screen.getByPlaceholderText(/age/i);
      
      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(ageInput).toHaveValue(0);
    });

    it('should update form state when inputs change', () => {
      render(<UserForm />);
      
      const nameInput = screen.getByPlaceholderText(/name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const ageInput = screen.getByPlaceholderText(/age/i);
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });
      
      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(ageInput).toHaveValue(25);
    });

    it('should display current form data as JSON', () => {
      render(<UserForm />);
      
      const nameInput = screen.getByPlaceholderText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'John' } });
      
      // Check if JSON representation is shown
      expect(screen.getByText(/"name": "John"/)).toBeInTheDocument();
    });

    it('should reset form when reset button is clicked', () => {
      render(<UserForm />);
      
      const nameInput = screen.getByPlaceholderText(/name/i);
      const resetButton = screen.getByText(/Reset/);
      
      // Fill in form
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      expect(nameInput).toHaveValue('John Doe');
      
      // Reset form
      fireEvent.click(resetButton);
      expect(nameInput).toHaveValue('');
    });

    it('should handle form submission', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      render(<UserForm />);
      
      const nameInput = screen.getByPlaceholderText(/name/i);
      const submitButton = screen.getByText(/Submit/);
      
      fireEvent.change(nameInput, { target: { value: 'John' } });
      fireEvent.click(submitButton);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Form submitted:',
        expect.objectContaining({ name: 'John' })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('TodoList Component', () => {
    it('should render empty todo list initially', () => {
      render(<TodoList />);
      
      expect(screen.getByText(/Total: 0/)).toBeInTheDocument();
      expect(screen.getByText(/No todos yet/)).toBeInTheDocument();
    });

    it('should add new todo when add button is clicked', () => {
      render(<TodoList />);
      
      const input = screen.getByPlaceholderText(/Enter new todo/);
      const addButton = screen.getByText(/Add Todo/);
      
      fireEvent.change(input, { target: { value: 'Learn React Hooks' } });
      fireEvent.click(addButton);
      
      expect(screen.getByText('Learn React Hooks')).toBeInTheDocument();
      expect(screen.getByText(/Total: 1/)).toBeInTheDocument();
      expect(input).toHaveValue(''); // Input should be cleared
    });

    it('should toggle todo completion status', () => {
      render(<TodoList />);
      
      const input = screen.getByPlaceholderText(/Enter new todo/);
      const addButton = screen.getByText(/Add Todo/);
      
      // Add a todo
      fireEvent.change(input, { target: { value: 'Test todo' } });
      fireEvent.click(addButton);
      
      const completeButton = screen.getByText(/Complete/);
      
      // Mark as completed
      fireEvent.click(completeButton);
      expect(screen.getByText(/Completed: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Undo/)).toBeInTheDocument();
      
      // Mark as uncompleted
      const undoButton = screen.getByText(/Undo/);
      fireEvent.click(undoButton);
      expect(screen.getByText(/Completed: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Complete/)).toBeInTheDocument();
    });

    it('should remove todo when remove button is clicked', () => {
      render(<TodoList />);
      
      const input = screen.getByPlaceholderText(/Enter new todo/);
      const addButton = screen.getByText(/Add Todo/);
      
      // Add a todo
      fireEvent.change(input, { target: { value: 'Todo to remove' } });
      fireEvent.click(addButton);
      
      expect(screen.getByText('Todo to remove')).toBeInTheDocument();
      
      // Remove the todo
      const removeButton = screen.getByText(/Remove/);
      fireEvent.click(removeButton);
      
      expect(screen.queryByText('Todo to remove')).not.toBeInTheDocument();
      expect(screen.getByText(/Total: 0/)).toBeInTheDocument();
    });

    it('should not add empty todos', () => {
      render(<TodoList />);
      
      const addButton = screen.getByText(/Add Todo/);
      
      // Try to add empty todo
      fireEvent.click(addButton);
      
      expect(screen.getByText(/Total: 0/)).toBeInTheDocument();
      expect(screen.getByText(/No todos yet/)).toBeInTheDocument();
    });

    it('should add todo when Enter key is pressed', () => {
      render(<TodoList />);
      
      const input = screen.getByPlaceholderText(/Enter new todo/);
      
      fireEvent.change(input, { target: { value: 'Enter key todo' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
      
      expect(screen.getByText('Enter key todo')).toBeInTheDocument();
    });
  });

  describe('StateAnalyzer Component', () => {
    it('should render initial state correctly', () => {
      render(<StateAnalyzer />);
      
      expect(screen.getByText(/Render Count:/)).toBeInTheDocument();
      expect(screen.getByText(/Last Update:/)).toBeInTheDocument();
      expect(screen.getByText(/Current Message:.*Initial message/)).toBeInTheDocument();
    });

    it('should update message when update buttons are clicked', () => {
      render(<StateAnalyzer />);
      
      const helloButton = screen.getByText(/Update to "Hello World!"/);
      fireEvent.click(helloButton);
      
      expect(screen.getByText(/Current Message:.*Hello World!/)).toBeInTheDocument();
    });

    it('should show different render counts for state updates', () => {
      render(<StateAnalyzer />);
      
      const helloButton = screen.getByText(/Update to "Hello World!"/);
      const reactButton = screen.getByText(/Update to "React is awesome!"/);
      
      // Click multiple buttons to trigger state updates
      fireEvent.click(helloButton);
      fireEvent.click(reactButton);
      
      // Render count should be greater than initial (exact count may vary due to useEffect)
      const renderCountText = screen.getByText(/Render Count: \d+/);
      expect(renderCountText).toBeInTheDocument();
    });

    it('should update last update time when state changes', () => {
      render(<StateAnalyzer />);
      
      const helloButton = screen.getByText(/Update to "Hello World!"/);
      fireEvent.click(helloButton);
      
      // Should show a time instead of "Never"
      expect(screen.queryByText(/Last Update:.*Never/)).not.toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple components working together', () => {
      const { container } = render(
        <div>
          <Counter />
          <UserForm />
          <TodoList />
        </div>
      );
      
      // All components should render without conflicts
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText(/Count: 0/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter new todo/)).toBeInTheDocument();
    });

    it('should maintain independent state across components', () => {
      render(
        <div>
          <Counter />
          <TodoList />
        </div>
      );
      
      const incrementButton = screen.getByText(/Increment/);
      const todoInput = screen.getByPlaceholderText(/Enter new todo/);
      const addTodoButton = screen.getByText(/Add Todo/);
      
      // Interact with counter
      fireEvent.click(incrementButton);
      expect(screen.getByText(/Count: 1/)).toBeInTheDocument();
      
      // Interact with todo list
      fireEvent.change(todoInput, { target: { value: 'Test todo' } });
      fireEvent.click(addTodoButton);
      expect(screen.getByText('Test todo')).toBeInTheDocument();
      
      // Both states should be independent
      expect(screen.getByText(/Count: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Total: 1/)).toBeInTheDocument();
    });
  });
});