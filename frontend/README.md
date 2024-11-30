# Health AI System Frontend

This is the frontend application for the Health AI System, built with React, TypeScript, and Material-UI.

## Features

- User authentication and profile management
- Interactive health dashboard
- Health data tracking and visualization
- Risk prediction display
- Personalized recommendations
- Responsive design

## Tech Stack

- React 18
- TypeScript
- Material-UI v5
- React Query for data fetching
- Axios for API communication
- Chart.js for data visualization
- Formik & Yup for form handling
- ESLint & Prettier for code quality

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── health/         # Health tracking components
│   └── layout/         # Layout components
├── context/            # React context providers
├── services/           # API services
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configurations
```

3. Start development server:
```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Development

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful component and function names
- Add JSDoc comments for complex functions

### Testing

- Write unit tests for components
- Test error scenarios
- Run tests before committing:
```bash
npm test
```

### Code Quality

- Run linter:
```bash
npm run lint
```

- Format code:
```bash
npm run format
```

## Building for Production

1. Create production build:
```bash
npm run build
```

2. Test the production build locally:
```bash
npm install -g serve
serve -s build
```

## Learn More

- [Project Documentation](../README.md)
- [API Documentation](../backend/README.md)
- [Material-UI Documentation](https://mui.com/)
