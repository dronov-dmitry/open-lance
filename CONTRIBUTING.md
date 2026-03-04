# Contributing to Open-Lance

Thank you for your interest in contributing to Open-Lance! This document provides guidelines for contributing to the project.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**Good Bug Reports Include:**

- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

**Template:**
```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows 10
- Node: 18.16.0
- Browser: Chrome 121
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**Good Enhancement Requests Include:**

- Clear use case
- Why it would be useful
- How it might work
- Alternative solutions considered

### Pull Requests

**Process:**

1. Fork the repository
2. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Create a Pull Request

**PR Guidelines:**

- One feature/fix per PR
- Update documentation if needed
- Add tests if applicable
- Follow existing code style
- Keep changes focused and minimal

## Development Workflow

### Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/open-lance.git
cd open-lance

# Install backend dependencies
cd backend
npm install

# Install dev tools
npm install -g serverless
```

### Frontend Development

```bash
cd frontend
# Serve locally
python -m http.server 8080
# Open http://localhost:8080
```

### Backend Development

```bash
cd backend
# Run locally with serverless-offline
serverless offline

# Run tests
npm test

# Lint
npm run lint
```

### Testing

Always test your changes:

**Frontend:**
- Manual testing in browser
- Test all affected pages
- Test on different screen sizes

**Backend:**
- Unit tests for utilities
- Integration tests for handlers
- Test error cases

**Infrastructure:**
- Terraform plan before apply
- Test in dev environment first

## Code Style

### JavaScript

Follow standard JavaScript style:

```javascript
// Good
function createTask(taskData) {
  const validation = validateTask(taskData);
  if (!validation.valid) {
    throw new Error('Invalid task data');
  }
  return taskRepository.create(taskData);
}

// Bad
function createTask(taskData){
  if(!validateTask(taskData).valid) throw new Error('Invalid task data');
  return taskRepository.create(taskData);
}
```

**Rules:**
- Use `const` and `let`, not `var`
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings
- Descriptive variable names
- Comments for complex logic

### Commits

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(tasks): add task filtering by category

Implement category filter in task list.
Users can now filter tasks by Design, Development, etc.

Closes #42
```

```
fix(auth): handle expired JWT tokens correctly

Previously, expired tokens caused unhandled exceptions.
Now returns 401 with clear error message.

Fixes #15
```

## Architecture Guidelines

### Backend

**Lambda Handlers:**
- Keep handlers thin
- Business logic in separate modules
- Always validate inputs
- Return standardized responses

**Connection Manager:**
- Don't modify core algorithm without discussion
- Add tests for changes
- Document failover behavior

### Frontend

**Components:**
- Keep components focused
- Reuse common code
- Handle loading and error states
- Use semantic HTML

**API Calls:**
- Always use api.js service
- Handle errors gracefully
- Show user-friendly messages

### Infrastructure

**Terraform:**
- One resource per file when complex
- Use variables for configurable values
- Add comments for non-obvious config
- Test changes in dev first

## Documentation

Update documentation for:

- New features
- API changes
- Configuration changes
- Architecture changes

**Update These Files:**
- README.md - for user-facing changes
- ARCHITECTURE.md - for technical changes
- DEPLOYMENT.md - for deployment changes
- OpenAPI spec - for API changes

## Testing Checklist

Before submitting PR:

### Frontend
- [ ] UI renders correctly
- [ ] Forms validate properly
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Responsive on mobile
- [ ] No console errors

### Backend
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Error cases handled
- [ ] Input validation works
- [ ] Logs are meaningful
- [ ] No hardcoded values

### Infrastructure
- [ ] Terraform plan succeeds
- [ ] No security issues
- [ ] Resources properly tagged
- [ ] Costs estimated

## Review Process

**What We Look For:**

1. **Functionality**: Does it work as intended?
2. **Code Quality**: Is it readable and maintainable?
3. **Tests**: Are changes tested?
4. **Documentation**: Is it documented?
5. **Security**: Are there security implications?
6. **Performance**: Any performance impact?

**Timeline:**
- Initial review within 48 hours
- Feedback provided constructively
- Iterative review process
- Merge when approved by maintainer

## Getting Help

**Resources:**
- [README.md](./README.md) - Project overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Setup guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
- [GitHub Discussions](https://github.com/your-username/open-lance/discussions) - Q&A

**Questions?**

- Open a GitHub Discussion
- Comment on relevant issue
- Ask in PR comments

## Recognition

Contributors will be:
- Listed in README
- Mentioned in release notes
- Credited in commit history

Thank you for contributing to Open-Lance! 🎉
