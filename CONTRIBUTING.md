# Contributing to PRism

Thank you for your interest in contributing to PRism! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run start`
   - This will start PRism in development mode
   - The app will be available at http://localhost:3000
4. Install the PRism GitHub App in your repository
   - The app will automatically create the necessary environment configuration
   - This includes setting up authentication tokens and API endpoints
   - Check `.env` file after the app installation is complete


Note: The GitHub app handles most of the configuration automatically. If you need to modify any settings, they can be found in your `.env` file after the app setup is complete.

## Coding Standards

- Use TypeScript for all new code
- Follow the existing code style
- Add comments for complex logic
- Include tests for new features

## Pull Request Process

1. Create a branch for your changes
2. Make your changes and commit them
3. Write clear commit messages
4. Update documentation if needed
5. Submit a PR with a description of your changes

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct.
