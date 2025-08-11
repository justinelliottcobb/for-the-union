# For The Union!!!

## TypeScript Exercises

A comprehensive TypeScript learning system similar to Rustlings that provides an interactive, auto-reloading exercise environment.

## Features

- 🏃‍♂️ **Interactive Learning**: Real-time TypeScript compilation and test execution
- 🔄 **Auto-Reload**: File watching with automatic re-compilation when you save changes
- 🎯 **Progressive Difficulty**: Exercises designed to build upon each other
- 🧪 **Comprehensive Testing**: Built-in test runner with detailed feedback
- 📊 **Progress Tracking**: Track your learning journey with detailed statistics
- 🌙 **Modern UI**: Beautiful interface built with Mantine UI and React
- 🛠️ **Extensible**: Easy to add new exercise categories and content

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup:**
   ```bash
   cd typescript-exercises
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Your First Exercise

1. Click on "Discriminated Unions" in the sidebar
2. Select "Traffic Light States" exercise
3. Click "Open in Editor" to edit the exercise file
4. Follow the instructions and implement the solution
5. Save the file and watch tests run automatically!

## Exercise Categories

### 📊 Discriminated Unions
Learn to model complex data with type-safe discriminated unions:
- **Traffic Light States** - Basic discriminated union concepts
- **Geometric Shapes** - Advanced union type manipulation

*More categories coming soon!*

## File Structure

```
typescript-exercises/
├── src/
│   ├── components/          # React components
│   ├── exercises/           # Exercise templates and solutions
│   ├── hooks/              # React hooks for state management
│   ├── lib/                # Core exercise runner and utilities
│   └── routes/             # Page components
├── exercise-files/         # Working files for students
└── scripts/                # CLI tools for creating exercises
```

## CLI Tools

### Creating New Exercises

Use the built-in CLI tool to scaffold new exercises:

```bash
npm run create-exercise -- \
  --category="advanced-types" \
  --name="conditional-types" \
  --title="Conditional Types" \
  --description="Master TypeScript conditional types" \
  --difficulty=4 \
  --time=30 \
  --objectives="Understand conditional type syntax" "Apply conditional types to real scenarios" \
  --hints="Start with simple conditions" "Use the extends keyword"
```

This creates:
- Exercise template file
- Solution file  
- Test file
- Instruction markdown

## Development

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:ui

# Run specific test file
npm run test exercises/discriminated-unions
```

### Building for Production

```bash
npm run build
npm run preview
```

### Code Style

```bash
npm run lint
```

## Exercise Development Guide

### Creating Quality Exercises

1. **Clear Learning Objectives**: Each exercise should have 2-4 specific learning goals
2. **Progressive Difficulty**: Build on previous concepts gradually
3. **Comprehensive Tests**: Cover happy path, edge cases, and type safety
4. **Helpful Instructions**: Include background, examples, and step-by-step guidance
5. **Strategic Hints**: Provide hints that guide without giving away the solution

### Exercise Template Structure

```typescript
// exercise.ts - Student working file
export type YourType = never; // TODO: Implement

// solution.ts - Reference implementation  
export type YourType = string | number;

// tests.ts - Comprehensive test suite
import { describe, it, expect } from 'vitest';

// instructions.md - Detailed guidance
# Exercise Title
Learning objectives, background, and step-by-step instructions
```

## Extending the System

### Adding New Categories

1. Create category directory in `src/exercises/`
2. Add category configuration
3. Update the exercise hooks
4. Create exercise files using the CLI tool

### Custom Exercise Types

The system supports any TypeScript learning content:
- Type manipulations
- Functional programming patterns  
- Async/await patterns
- Design patterns
- Framework-specific concepts

## Architecture

### Core Components

- **ExerciseRunner**: Compiles and executes TypeScript in the browser
- **FileWatcher**: Watches exercise files for changes using Chokidar
- **TestRunner**: Runs tests and displays results with real-time feedback
- **ProgressTracker**: Tracks completion and learning statistics

### Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Library**: Mantine UI v7 with dark/light theme
- **Routing**: React Router 7
- **Build Tool**: Vite with HMR
- **Testing**: Vitest with browser TypeScript compilation
- **File Watching**: Chokidar

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-exercise`)
3. Add your exercises with tests and documentation
4. Commit your changes (`git commit -m 'Add amazing exercise'`)
5. Push to the branch (`git push origin feature/amazing-exercise`)
6. Open a Pull Request

### Contribution Guidelines

- All exercises must include comprehensive tests
- Follow the established file structure and naming conventions
- Include clear instructions and helpful hints
- Test exercises with multiple difficulty levels
- Ensure TypeScript strict mode compatibility

## License

MIT License - see LICENSE file for details.

## Acknowledgments

Inspired by [Rustlings](https://github.com/rust-lang/rustlings) - the excellent Rust learning tool that makes learning through practice engaging and effective.

---

**Happy Learning! 🎉**

Start your TypeScript journey today and master advanced type system concepts through hands-on practice.
