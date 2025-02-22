export interface ModelConfig {
  name: string;
  description: string;
  huggingFaceModel: string;
}

export const useCaseModels: Record<string, ModelConfig[]> = {
  'Documentation': [
    { 
      name: 'Code Documentation',
      description: 'Generate comprehensive code documentation',
      huggingFaceModel: 'microsoft/codebert-base'
    },
    {
      name: 'Technical Writing',
      description: 'Create technical documentation and guides',
      huggingFaceModel: 'facebook/bart-large'
    }
  ],
  'Code Review': [
    {
      name: 'Code Quality',
      description: 'Analyze code quality and suggest improvements',
      huggingFaceModel: 'microsoft/graphcodebert-base'
    },
    {
      name: 'Bug Detection',
      description: 'Identify potential bugs and issues',
      huggingFaceModel: 'huggingface/CodeBERTa-small-v1'
    }
  ],
  'Security Analysis': [
    {
      name: 'Vulnerability Scanner',
      description: 'Detect security vulnerabilities',
      huggingFaceModel: 'microsoft/codebert-base'
    },
    {
      name: 'Security Best Practices',
      description: 'Check for security best practices',
      huggingFaceModel: 'microsoft/graphcodebert-base'
    }
  ]
};
