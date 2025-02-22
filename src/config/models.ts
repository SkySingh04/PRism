export interface ModelConfig {
  name: string;
  description: string;
  suggestedModels: Array<{
    name: string;
    link: string;
  }>;
}

export const useCaseModels: Record<string, ModelConfig> = {
  'Documentation': {
    name: 'Documentation Generation',
    description: 'Generate and improve documentation',
    suggestedModels: [
      { name: 'codellama', link: 'https://huggingface.co/codellama/CodeLlama-34b-hf' },
      { name: 'llama2', link: 'https://huggingface.co/meta-llama/Llama-2-70b-hf' },
      { name: 'mistral', link: 'https://huggingface.co/mistralai/Mistral-7B-v0.1' },
      { name: 'starcoder', link: 'https://huggingface.co/bigcode/starcoder' }
    ]
  },
  'Code Review': {
    name: 'Code Review & Quality',
    description: 'Review code and suggest improvements',
    suggestedModels: [
      { name: 'codellama', link: 'https://huggingface.co/codellama/CodeLlama-34b-hf' },
      { name: 'wizardcoder', link: 'https://huggingface.co/WizardLM/WizardCoder-Python-34B-V1.0' },
      { name: 'starcoder', link: 'https://huggingface.co/bigcode/starcoder' }
    ]
  },
  'Security Analysis': {
    name: 'Security Scanning',
    description: 'Analyze code for security issues',
    suggestedModels: [
      { name: 'llama2', link: 'https://huggingface.co/meta-llama/Llama-2-70b-hf' },
      { name: 'mistral', link: 'https://huggingface.co/mistralai/Mistral-7B-v0.1' },
      { name: 'vicuna', link: 'https://huggingface.co/lmsys/vicuna-13b-v1.5' }
    ]
  },
  'Performance Optimization': {
    name: 'Performance Analysis',
    description: 'Identify performance bottlenecks',
    suggestedModels: [
      { name: 'codellama', link: 'https://huggingface.co/codellama/CodeLlama-34b-hf' },
      { name: 'llama2', link: 'https://huggingface.co/meta-llama/Llama-2-70b-hf' },
      { name: 'wizardcoder', link: 'https://huggingface.co/WizardLM/WizardCoder-Python-34B-V1.0' }
    ]
  },
  'Dependency Analysis': {
    name: 'Dependency Management',
    description: 'Analyze and suggest dependency updates',
    suggestedModels: [
      { name: 'codellama', link: 'https://huggingface.co/codellama/CodeLlama-34b-hf' },
      { name: 'starcoder', link: 'https://huggingface.co/bigcode/starcoder' },
      { name: 'mistral', link: 'https://huggingface.co/mistralai/Mistral-7B-v0.1' }
    ]
  },
  'Test Generation': {
    name: 'Test Case Generation',
    description: 'Generate test cases and scenarios',
    suggestedModels: [
      { name: 'codellama', link: 'https://huggingface.co/codellama/CodeLlama-34b-hf' },
      { name: 'starcoder', link: 'https://huggingface.co/bigcode/starcoder' },
      { name: 'wizardcoder', link: 'https://huggingface.co/WizardLM/WizardCoder-Python-34B-V1.0' }
    ]
  },
  'Architecture Review': {
    name: 'Architecture Analysis',
    description: 'Review system architecture and patterns',
    suggestedModels: [
      { name: 'llama2', link: 'https://huggingface.co/meta-llama/Llama-2-70b-hf' },
      { name: 'mistral', link: 'https://huggingface.co/mistralai/Mistral-7B-v0.1' },
      { name: 'codellama', link: 'https://huggingface.co/codellama/CodeLlama-34b-hf' }
    ]
  }
};
