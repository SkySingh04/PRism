import fs from 'fs';

export interface ModelInfo {
    name: string;
    link: string;
}

export interface UserConfig {
    useCase: string;
    apiEndpoint: string;
    selectedModel: string;  // Changed from ModelInfo to string
}

const CONFIG_FILE = 'prism-config.json';

export function saveConfig(config: UserConfig): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function loadConfig(): UserConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return null;
}
