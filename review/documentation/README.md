# SAM Leads System Documentation

Welcome to the SAM Leads Collection System documentation. This system automates the collection and management of government contract leads from SAM.gov.

## Documentation Index

### 📋 [Complete System Overview](SAM_LEADS_OVERVIEW.md)
Comprehensive overview of the entire SAM Leads system including:
- System architecture and purpose
- Original shell scripts documentation
- Workflow and processes
- Technology stack
- Project structure
- Security considerations
- Troubleshooting guide

### 🔧 [Implementation Guide](IMPLEMENTATION_GUIDE.md)
Detailed technical implementation guide covering:
- Quick start instructions
- Component details and API integration
- UI component specifications
- Styling guide and best practices
- Testing strategies
- Deployment instructions

### 📜 [Scripts Overview](scripts_overview.md)
Documentation for the original shell scripts:
- `nd_pack.sh` - Pack ND NAICS leads
- `sam_probe.sh` - Probe SAM for lead information
- `sam_probe_verbose.sh` - Verbose SAM probe
- `sam_search.sh` - Search SAM database

## Quick Links

- **Frontend Application:** http://localhost:4200
- **Backend API:** http://localhost:3000/api
- **SAM.gov API Documentation:** https://open.gsa.gov/api/sam-entity-management-api/

## Getting Started

```bash
# Install dependencies
npm install

# Start development environment
npm run serve:all

# Run tests
npm run test:all

# Build for production
npm run build:all
```

## System Components

### Angular Frontend (`review/`)
- Material Design 3 UI
- Four main pages: Pack, Probe, Probe Verbose, Search
- Real-time API integration
- Responsive design

### NestJS Backend (`review/leads-api/`)
- REST API endpoints
- Service layer for business logic
- Ready for SAM.gov API integration

### Shell Scripts (`review/scripts/`)
- Original automation scripts
- Reference implementation
- Sample data files

## Key Features

✅ **Modern UI** - Material Design 3 components
✅ **Real-time Feedback** - Loading states and error handling
✅ **Visual Indicators** - Red error states for no results
✅ **Responsive Design** - Works on all screen sizes
✅ **API Ready** - Structured for SAM.gov integration
✅ **Type Safety** - Full TypeScript implementation
✅ **Monorepo** - Nx workspace with shared tooling

## Project Status

### ✅ Completed
- Angular UI with Material Design 3
- NestJS API structure
- Component routing and navigation
- HTTP client integration
- Mock data endpoints
- Error handling and loading states

### 🚧 In Progress / Planned
- SAM.gov API integration
- Database persistence
- User authentication
- Lead tracking system
- Automated scheduling
- Export functionality
- Analytics dashboard

## NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run serve:all` | Start API and UI in parallel |
| `npm run serve:api` | Start only API |
| `npm run serve:ui` | Start only UI |
| `npm run build:all` | Build both projects |
| `npm run test:all` | Run all tests |
| `npm run lint:all` | Lint all code |
| `npm run e2e:all` | Run all e2e tests |

## Technology Stack

- **Frontend:** Angular 20.3 + Material Design 3
- **Backend:** NestJS 11.0
- **Language:** TypeScript 5.9
- **Monorepo:** Nx 22.0
- **Testing:** Jest + Playwright
- **Build:** esbuild (UI), Webpack (API)

## Support and Contribution

For questions, issues, or contributions, please refer to the detailed documentation files listed above or contact the development team.

## License

MIT

