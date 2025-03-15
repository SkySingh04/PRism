import fs from 'fs';

// Define local error types for this file
class ConfigFileError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

class FileSystemError extends ConfigFileError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

class ConfigError extends ConfigFileError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

class ParseError extends ConfigFileError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

// Define a Result type for handling success/failure
export type Result<T, E = Error> = 
  | { success: true; value: T } 
  | { success: false; error: E };

export interface ModelInfo {
    name: string;
    link: string;
}

export interface UserConfig {
    useCase: string;
    apiEndpoint: string;
    selectedModel: string; 
}

const CONFIG_FILE = 'keploy-config.json';

export function saveConfig(config: UserConfig): Result<void, Error> {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return { success: true, value: undefined };
  } catch (error: unknown) {
    const errorObj = error as { message?: string; code?: string };
    let appError: Error;
    
    if (errorObj.code === 'EACCES') {
      appError = new FileSystemError('Permission denied: Unable to write to config file', error);
    } else if (errorObj.code === 'ENOENT') {
      appError = new FileSystemError('Directory not found: Unable to write to config file', error);
    } else {
      appError = new ConfigError(`Failed to save configuration: ${errorObj.message || 'Unknown error'}`, error);
    }
    
    console.error(appError.message, error);
    return { success: false, error: appError };
  }
}

export function loadConfig(): Result<UserConfig, Error> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return { success: true, value: config };
    }
    
    const error = new ConfigError(`Config file not found: ${CONFIG_FILE}`);
    console.warn(error.message);
    return { success: false, error };
  } catch (error: unknown) {
    const errorObj = error as { message?: string; code?: string };
    const errorMessage = errorObj.message || 'Unknown error';
    let appError: Error;
    
    if (error instanceof SyntaxError) {
      appError = new ParseError('JSON parsing error: The config file contains invalid JSON. Please check its format.', error);
    } else if (errorObj.code === 'EACCES') {
      appError = new FileSystemError('Permission error: Unable to access the config file due to permission restrictions.', error);
    } else if (errorObj.code === 'EMFILE') {
      appError = new FileSystemError('System error: Too many open files. Try closing some applications and try again.', error);
    } else {
      appError = new ConfigError(`Error loading config: ${errorMessage}`, error);
    }
    
    console.error(appError.message, error);
    return { success: false, error: appError };
  }
}
