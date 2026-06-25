# Contributing to Delta CLI

Thank you for considering contributing to Delta CLI! This guide will help you get started.

## Development Setup

### Prerequisites

- **Node.js** >= 18
- **Yarn** 1.x
- **AWS credentials** configured for testing against real Lambda/S3 resources

### Getting Started

```sh
# Clone the repository
git clone https://github.com/zepto-labs/delta-cli.git
cd delta-cli

# Install dependencies
yarn

# Build the CLI
yarn build-cli

# Link for local testing
npm link
```

### Project Structure

```
bin/
  index.ts          # CLI entry point and command router
src/
  api/              # Lambda invocation layer
  commands/         # One file per CLI command
  models/           # Shared TypeScript types
  utils/            # S3, bundle building, paths, env sync, logging
```

### Configuration

The CLI requires a `delta.config.json` in your React Native project root:

```json
{
  "s3": {
    "bucket": "your-s3-bucket",
    "region": "your-region"
  },
  "lambda": {
    "region": "your-lambda-region",
    "getLatestPatch": "lambda-function-name",
    "getReleaseList": "lambda-function-name",
    "createRelease": "lambda-function-name",
    "updateRelease": "lambda-function-name",
    "getRegistryList": "lambda-function-name",
    "createRegistry": "lambda-function-name",
    "invalidateCache": "lambda-function-name"
  }
}
```

## Making Changes

1. **Fork** the repository and create a feature branch from `main`.
2. Make your changes in small, focused commits.
3. Ensure `yarn build-cli` passes with no errors.
4. Update documentation if your change affects the public API or CLI flags.
5. Open a pull request against `main`.

### Commit Messages

Use clear, descriptive commit messages:

- `fix: resolve shell injection in BundleManager`
- `feat: add --verbose flag for debug logging`
- `docs: document delta.config.json schema`

### Code Style

- This project uses **Prettier** for formatting. Run `npx prettier --write .` before committing.
- No semicolons, single quotes, 4-space indentation.

## Reporting Issues

- Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) for bugs.
- Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) for new ideas.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).
