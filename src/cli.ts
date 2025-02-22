import inquirer from 'inquirer';
import { useCaseModels, ModelConfig } from './config/models.js';

export async function promptUserConfig() {
    const { useCase } = await inquirer.prompt([{
        type: 'list',
        name: 'useCase',
        message: 'Select your repository use case:',
        choices: Object.keys(useCaseModels)
    }]);

    const { selectedModel } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedModel',
        message: 'Select a Hugging Face model for your use case:',
        choices: useCaseModels[useCase].map((model: ModelConfig) => ({
            name: `${model.name} - ${model.description}`,
            value: model.huggingFaceModel
        }))
    }]);

    return {
        useCase,
        model: selectedModel
    };
}
