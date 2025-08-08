import chokidar from 'chokidar';
import type { Exercise } from '@/types';

export type FileChangeCallback = (filePath: string, content: string) => void;

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private callbacks: Map<string, FileChangeCallback[]> = new Map();

  constructor(private exerciseFilesPath: string = './exercise-files') {}

  startWatching(): void {
    if (this.watcher) {
      this.stopWatching();
    }

    this.watcher = chokidar.watch(this.exerciseFilesPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('change', async (path) => {
        await this.handleFileChange(path);
      })
      .on('error', (error) => {
        console.error('File watcher error:', error);
      });

    console.log(`Watching for file changes in: ${this.exerciseFilesPath}`);
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
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

  private async handleFileChange(filePath: string): Promise<void> {
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