import type { Exercise } from '@/types';

export type FileChangeCallback = (filePath: string, content: string) => void;

// Browser-compatible FileWatcher that doesn't use Node.js file system APIs
export class FileWatcher {
  private callbacks: Map<string, FileChangeCallback[]> = new Map();
  private isWatching: boolean = false;

  constructor(private exerciseFilesPath: string = './exercise-files') {}

  startWatching(): void {
    if (this.isWatching) {
      this.stopWatching();
    }

    this.isWatching = true;
    console.log(`File watching enabled for: ${this.exerciseFilesPath} (browser mode)`);
  }

  stopWatching(): void {
    this.isWatching = false;
    this.callbacks.clear();
  }

  watchExercise(exercise: Exercise, callback: FileChangeCallback): void {
    const filePath = exercise.filePath;
    
    if (!this.callbacks.has(filePath)) {
      this.callbacks.set(filePath, []);
    }
    
    this.callbacks.get(filePath)!.push(callback);
  }

  unwatchExercise(exercise: Exercise, callback?: FileChangeCallback): void {
    const filePath = exercise.filePath;
    const callbacks = this.callbacks.get(filePath);
    
    if (!callbacks) return;

    if (callback) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      callbacks.length = 0;
    }

    if (callbacks.length === 0) {
      this.callbacks.delete(filePath);
    }
  }

  // Manual trigger for file changes (since we can't watch files in browser)
  async triggerFileChange(filePath: string): Promise<void> {
    if (!this.isWatching) return;
    
    try {
      const content = await this.readFile(filePath);
      const callbacks = this.callbacks.get(filePath) || [];
      
      callbacks.forEach(callback => {
        try {
          callback(filePath, content);
        } catch (error) {
          console.error('Error in file change callback:', error);
        }
      });
    } catch (error) {
      console.error('Error reading changed file:', error);
    }
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  async copyTemplateToWorkingFile(templatePath: string, workingPath: string): Promise<void> {
    try {
      const templateContent = await this.readFile(templatePath);
      await this.writeFile(workingPath, templateContent);
    } catch (error) {
      throw new Error(`Failed to copy template: ${error}`);
    }
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    // In a browser environment, we can't directly write files
    // This would need to be handled by a backend service or file system API
    console.warn('File writing not implemented in browser environment');
  }
}