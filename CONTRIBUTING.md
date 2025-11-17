# Contributing to APODS AI-Automation Suite

Thank you for your interest in contributing to the APODS AI-Automation Suite! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- Python >= 3.12
- pnpm >= 8.0.0
- Docker (optional, for containerized development)

### First Time Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/rblake2320/apods-ai-automation-suite.git
   cd apods-ai-automation-suite
   ```

2. **Install Dependencies**
   ```bash
   # Install Node.js dependencies
   pnpm install

   # Install Python dependencies
   pip install -r requirements.txt

   # Install Playwright browsers
   pnpm exec playwright install
   ```

3. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run Development Servers**
   ```bash
   # Start all services
   pnpm dev

   # Or start individually
   pnpm dev:frontend
   pnpm dev:backend
   ```

## Development Setup

### Project Structure

```
apods-ai-automation-suite/
├── apps/
│   ├── frontend/          # React + Vite frontend
│   ├── backend/           # Node.js/Express backend
│   └── mcp-servers/       # MCP server implementations
├── scripts/               # Python automation scripts
├── tests/                 # Integration and E2E tests
├── docs/                  # Documentation
└── k8s/                   # Kubernetes configurations
```

### IDE Setup

#### VS Code (Recommended)

Install recommended extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Python
- Docker
- Playwright Test for VSCode

#### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write clear, self-documenting code
- Add tests for new features
- Update documentation as needed
- Follow the coding standards

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run linters
pnpm lint

# Run type checking
pnpm typecheck
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add user authentication"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Enable strict mode
- No `any` types unless absolutely necessary
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow the ESLint configuration

Example:

```typescript
/**
 * Creates a new user with the given email and password
 * @param email - User's email address
 * @param password - User's password (will be hashed)
 * @returns The created user object
 * @throws {ValidationError} If email or password is invalid
 */
export async function createUser(
  email: string,
  password: string
): Promise<User> {
  // Implementation
}
```

### Python

- Follow PEP 8
- Use type hints
- Add docstrings (Google style)
- Use meaningful variable names
- Follow the Black formatting style

Example:

```python
def process_data(input_data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Processes raw input data and returns a DataFrame.

    Args:
        input_data: List of dictionaries containing raw data

    Returns:
        Processed DataFrame with cleaned data

    Raises:
        ValueError: If input_data is empty or invalid
    """
    # Implementation
```

### React Components

- Use functional components with hooks
- Use TypeScript for props
- Add prop-types or TypeScript interfaces
- Keep components small and focused
- Use meaningful component names

Example:

```typescript
interface ButtonProps {
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  label,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};
```

## Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Aim for 80%+ code coverage
- Use descriptive test names

Example:

```typescript
describe('createUser', () => {
  it('should create a user with valid email and password', async () => {
    const user = await createUser('test@example.com', 'password123');
    expect(user.email).toBe('test@example.com');
  });

  it('should throw ValidationError for invalid email', async () => {
    await expect(createUser('invalid', 'password123')).rejects.toThrow(
      ValidationError
    );
  });
});
```

### Integration Tests

- Test interactions between components
- Use realistic test data
- Test both success and failure cases

### E2E Tests

- Test complete user workflows
- Use Playwright for browser automation
- Test on multiple browsers

## Pull Request Process

### Before Submitting

1. **Run all checks**
   ```bash
   pnpm validate
   ```

2. **Update documentation**
   - Update README if needed
   - Add/update JSDoc comments
   - Update API documentation

3. **Add tests**
   - Unit tests for new functions
   - Integration tests for features
   - E2E tests for user workflows

### PR Template

When creating a PR, include:

- **Description**: Clear description of changes
- **Type**: Feature, bug fix, refactor, etc.
- **Testing**: How you tested the changes
- **Screenshots**: If UI changes
- **Breaking Changes**: List any breaking changes
- **Related Issues**: Link to related issues

### Review Process

1. Automated checks must pass (CI/CD)
2. Code review by at least one maintainer
3. All comments must be resolved
4. PR must be up-to-date with main branch

### After Merge

- Delete your branch
- Update local main branch
- Close related issues

## Development Tips

### Debugging

#### Frontend
- Use React DevTools
- Use browser console
- Check Network tab for API calls

#### Backend
- Use `console.log` or debugger
- Check server logs
- Use Postman for API testing

#### Python
- Use `print()` or `pdb`
- Check logs in `logs/` directory
- Use pytest with `-v` flag

### Performance

- Profile slow operations
- Optimize database queries
- Use caching where appropriate
- Lazy load components

### Security

- Never commit secrets
- Use environment variables
- Validate all user input
- Sanitize output
- Follow OWASP guidelines

## Getting Help

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check `/docs` directory

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Thank you for contributing to APODS AI-Automation Suite! Your contributions help make this project better for everyone.
