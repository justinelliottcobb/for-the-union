# For The Union - TypeScript Exercises

A comprehensive TypeScript learning system similar to Rustlings that provides an interactive, auto-reloading exercise environment for mastering TypeScript through hands-on practice.

## 🎯 Project Overview

This repository contains a modern, interactive TypeScript learning platform designed to help developers master advanced TypeScript concepts through progressive exercises. Inspired by the excellent Rust learning tool [Rustlings](https://github.com/rust-lang/rustlings), this system provides real-time feedback and auto-reloading capabilities.

## ✨ Features

- 🏃‍♂️ **Interactive Learning**: Real-time TypeScript compilation and test execution
- 🔄 **Auto-Reload**: File watching with automatic re-compilation when you save changes
- 🎯 **Progressive Difficulty**: Exercises designed to build upon each other systematically
- 🧪 **Comprehensive Testing**: Built-in test runner with detailed feedback and error reporting
- 📊 **Progress Tracking**: Track your learning journey with detailed statistics and achievements
- 🌙 **Modern UI**: Beautiful, responsive interface built with Mantine UI and React 18
- 🛠️ **Extensible Architecture**: Easy to add new exercise categories and content
- 🔧 **CLI Tools**: Command-line utilities for creating new exercises

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone git@github.com:justinelliottcobb/for-the-union.git
   cd for-the-union
   ```

2. **Navigate to the TypeScript exercises:**
   ```bash
   cd typescript-exercises
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000` and start learning!

### Your First Exercise

1. Click on **"Discriminated Unions"** in the sidebar
2. Select **"Traffic Light States"** exercise
3. Click **"Open in Editor"** to edit the exercise file in your preferred IDE
4. Follow the instructions and implement the solution
5. Save the file and watch tests run automatically in real-time!

## 📚 Exercise Categories

### 📊 Discriminated Unions
Master type-safe data modeling with discriminated unions:

- **Traffic Light States** (Difficulty: 2/5) - Learn discriminated union basics and type-safe state machines
- **Geometric Shapes** (Difficulty: 3/5) - Advanced union type manipulation with area calculations

*More categories coming soon including functional programming patterns, async/await mastery, and advanced type manipulations!*

## 🏗️ Project Structure

```
for-the-union/
├── typescript-exercises/           # Main TypeScript learning system
│   ├── src/
│   │   ├── components/            # React components (ExerciseViewer, TestRunner, etc.)
│   │   ├── exercises/             # Exercise templates and solutions
│   │   ├── hooks/                 # React hooks for state management
│   │   ├── lib/                   # Core exercise runner and utilities
│   │   └── routes/                # Page components
│   ├── exercise-files/            # Working files for students to edit
│   ├── scripts/                   # CLI tools for creating exercises
│   └── README.md                  # Detailed system documentation
├── src/                           # Original Vite + React template
└── README.md                      # This file
```

## 🛠️ Development

### Running the System

```bash
cd typescript-exercises
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run test         # Run test suite
npm run test:ui      # Run tests with UI
npm run lint         # Run ESLint
```

### Creating New Exercises

Use the built-in CLI tool to scaffold new exercises:

```bash
npm run create-exercise -- \
  --category="advanced-types" \
  --name="conditional-types" \
  --title="Conditional Types Mastery" \
  --description="Learn to use TypeScript conditional types effectively" \
  --difficulty=4 \
  --time=30 \
  --objectives="Understand conditional type syntax" "Apply conditional types to real-world scenarios" \
  --hints="Start with simple conditions using extends" "Remember that conditional types are lazy"
```

This automatically generates:
- Exercise template file with TODO comments
- Reference solution file
- Comprehensive test suite
- Detailed instruction markdown

## 🏛️ Architecture

### Core Technologies

- **Frontend**: React 18 + TypeScript with strict mode
- **UI Library**: Mantine UI v7 with dark/light theme support
- **Routing**: React Router 7 with file-based routing patterns
- **Build Tool**: Vite with Hot Module Replacement (HMR)
- **Testing**: Vitest with browser-based TypeScript compilation
- **File Watching**: Chokidar for real-time file change detection

### Key Components

- **ExerciseRunner**: Compiles and executes TypeScript in the browser using the TypeScript compiler API
- **FileWatcher**: Monitors exercise files for changes and triggers automatic recompilation
- **TestRunner**: Executes tests and displays results with real-time feedback and animations
- **ProgressTracker**: Persists completion status and learning statistics in localStorage

## 🎯 Learning Approach

### Exercise Philosophy

Each exercise is designed with:

1. **Clear Learning Objectives**: 2-4 specific, measurable learning goals
2. **Progressive Difficulty**: Building complexity that reinforces previous concepts
3. **Comprehensive Testing**: Coverage of happy path, edge cases, and TypeScript type safety
4. **Guided Instructions**: Background context, examples, and step-by-step guidance
5. **Strategic Hints**: Helpful nudges without giving away the complete solution

### Pedagogical Features

- **Real-time Feedback**: Immediate compilation errors and test results
- **Type Safety Focus**: Exercises emphasize TypeScript's type system benefits
- **Practical Applications**: Real-world scenarios rather than abstract examples
- **Incremental Learning**: Each exercise builds on previous knowledge
- **Achievement Tracking**: Progress badges and completion statistics

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### Adding New Exercises

1. Fork the repository
2. Use the CLI tool to create exercise scaffolding
3. Implement comprehensive instructions, tests, and solutions
4. Test thoroughly with multiple difficulty levels
5. Submit a Pull Request

### Contributing Guidelines

- All exercises must include comprehensive test coverage
- Follow established file structure and naming conventions
- Include clear, beginner-friendly instructions with examples
- Ensure compatibility with TypeScript strict mode
- Test exercises across different skill levels

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by [Rustlings](https://github.com/rust-lang/rustlings) - the excellent Rust learning tool
- Built with modern web technologies for optimal developer experience
- Designed with accessibility and inclusive learning in mind

---

**Start your TypeScript mastery journey today!** 🚀

Navigate to the `typescript-exercises` directory and begin learning advanced TypeScript concepts through hands-on, interactive practice.