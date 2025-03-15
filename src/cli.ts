import inquirer from 'inquirer';
import { useCaseModels } from './config/models.js';
import { ModelInfo, loadConfig, saveConfig, UserConfig } from './config/userConfig.js';
import chalk from 'chalk';  // This will be fixed by package.json update

export async function promptUserConfig(): Promise<UserConfig> {
    // Check for existing config
    const configResult = loadConfig();
    if (configResult.success) {
        const existingConfig = configResult.value;
        console.log(chalk.cyan('Using existing configuration:'));
        console.log(`Use Case: ${existingConfig.useCase}`);
        console.log(`API Endpoint: ${existingConfig.apiEndpoint}`);
        return existingConfig;
    } else {
        console.log(chalk.yellow(`No existing configuration found or error loading: ${configResult.error.message}`));
    }

    // Get use case
    const { useCase } = await inquirer.prompt([{
        type: 'list',
        name: 'useCase',
        message: 'Select your repository use case:',
        choices: Object.entries(useCaseModels).map(([key, value]) => ({
            name: `${value.name} - ${value.description}`,
            value: key
        }))
    }]);

    // Display suggested models with links
    const selectedUseCase = useCaseModels[useCase];
    console.log(chalk.green('\nRecommended Open Source Models for your use case:'));
    selectedUseCase.suggestedModels.forEach(model => {
        console.log(chalk.yellow(`• ${model.name} `) + chalk.blue(`[${model.link}]`));
    });
    console.log(chalk.gray('\nNote: These are suggestions based on your use case.\n'));

    // After displaying suggested models, ask for model selection
    const { selectedModel } = await inquirer.prompt<{ selectedModel: string }>([{
        type: 'input',
        name: 'selectedModel',
        message: 'Select a model to use:',
        choices: selectedUseCase.suggestedModels.map(model => ({
            name: model.name,
            value: model.name  
        }))
    }]);

    // Get API endpoint
    const { apiEndpoint } = await inquirer.prompt([{
        type: 'input',
        name: 'apiEndpoint',
        message: 'Please enter the API link:',
        default: 'http://localhost:11434/api/generate',
        validate: (input: string) => {
            return input.startsWith('http://') || input.startsWith('https://')
                ? true
                : 'Please enter a valid HTTP/HTTPS URL';
        }
    }]);

    const config: UserConfig = {
        useCase,
        apiEndpoint,
        selectedModel,
    };

    // Save configuration
    saveConfig(config);
    console.log(chalk.green('Configuration saved successfully!'));

    return config;
}
