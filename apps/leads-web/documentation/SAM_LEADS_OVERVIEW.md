# SAM Leads Collection System - Complete Overview

## Purpose

This system automates the collection and management of government contract leads from SAM.gov (System for Award Management), specifically focusing on North Dakota NAICS-coded opportunities. The goal is to identify, probe, and track potential government contracting opportunities for business development.

## System Architecture

### Backend: NestJS API (`review/leads-api/`)

The NestJS backend provides RESTful API endpoints that mirror the functionality of the original shell scripts.

**API Endpoints:**

- `GET /api/pack` - Returns packed ND NAICS leads
- `POST /api/probe` - Basic SAM probe by lead ID
  - Request body: `{ leadId: string }`
  - Returns: `{ result: string }`
- `POST /api/probe/verbose` - Detailed SAM probe by lead ID
  - Request body: `{ leadId: string }`
  - Returns: `{ result: string }`
- `POST /api/search` - Search SAM by term
  - Request body: `{ term: string }`
  - Returns: `{ results: string[] }`

**Server Configuration:**

- Base URL: `http://localhost:3000`
- API Prefix: `/api`
- Full endpoint example: `http://localhost:3000/api/pack`

### Frontend: Angular Application (`review/`)

The Angular application provides a Material Design 3 interface for interacting with the SAM leads system.

**Features:**

- Modern Material Design 3 UI components
- Horizontal navigation toolbar
- Real-time API integration
- Visual feedback for loading states
- Red error states when no results are found
- Responsive design (max-width: 800px)

**Pages:**

1. **Pack Leads** - Display consolidated ND NAICS leads
2. **Probe SAM** - Query SAM for basic lead information
3. **Probe SAM Verbose** - Query SAM for detailed lead information
4. **Search SAM** - Search SAM database by keyword

## Original Shell Scripts (`review/scripts/`)

The system is based on four shell scripts that were originally used for manual lead collection:

### 1. `nd_pack.sh`

Packs/consolidates ND NAICS leads into a CSV file.

- Reads from `nd_naics_leads.csv` (contains lead_id, company, naics_code)
- Creates a packed output for further processing
- Usage: `./nd_pack.sh`

### 2. `sam_search.sh`

Searches SAM.gov database for leads based on search terms.

- Primary discovery tool to find new contract opportunities
- Returns list of potential leads matching criteria
- Usage: `./sam_search.sh <search_term>`

### 3. `sam_probe.sh`

Basic probe of SAM.gov for specific lead information.

- Takes a lead ID as input
- Returns basic contract/opportunity details
- Usage: `./sam_probe.sh <lead_id>`

### 4. `sam_probe_verbose.sh`

Detailed/verbose probe of SAM.gov.

- Takes a lead ID as input
- Returns comprehensive contract details including:
  - Full contract descriptions
  - Requirements
  - Timeline information
  - Contact details
  - Award amounts
- Usage: `./sam_probe_verbose.sh <lead_id>`

## Data Structure

### NAICS Leads CSV Format

```csv
lead_id,company,naics_code
1001,Acme Corp,541611
1002,Globex Inc,541512
1003,Initech,541513
```

**Fields:**

- `lead_id` - Unique identifier for the lead
- `company` - Company name
- `naics_code` - North American Industry Classification System code

## Workflow

### 1. Search Phase

Use the search functionality to discover new opportunities from SAM.gov:

- Enter relevant keywords (e.g., "software development", "IT services")
- System queries SAM.gov database
- Returns list of matching opportunities

### 2. Pack Phase

Consolidate discovered leads into structured data:

- Retrieves all current leads
- Formats data consistently
- Displays in organized table format

### 3. Probe Phase

Get basic details on interesting leads:

- Enter specific lead ID
- Receive basic contract information
- Quick overview of opportunity

### 4. Probe Verbose Phase

Deep dive on promising opportunities:

- Enter lead ID for detailed analysis
- Receive comprehensive contract details
- Full requirements and specifications

### 5. Track Phase (Future)

Store and monitor leads through sales pipeline:

- Save leads to database
- Track status and progress
- Set follow-up reminders

## NPM Scripts

### Development

- `npm run serve:all` - Serves both API and UI in parallel
- `npm run serve:api` - Serves only the NestJS API
- `npm run serve:ui` - Serves only the Angular UI

### Build

- `npm run build:all` - Builds both projects
- `npm run build:api` - Builds only API
- `npm run build:ui` - Builds only UI

### Testing

- `npm run test:all` - Tests all projects
- `npm run test:api` - Tests only API
- `npm run test:ui` - Tests only UI

### Linting

- `npm run lint:all` - Lints all projects
- `npm run lint:api` - Lints only API
- `npm run lint:ui` - Lints only UI

### E2E Testing

- `npm run e2e:all` - Runs all e2e tests
- `npm run e2e:api` - Runs API e2e tests
- `npm run e2e:ui` - Runs UI e2e tests

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- SAM.gov API key (for production use)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start both API and UI in development mode:

```bash
npm run serve:all
```

Access the application:

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api

## Current Implementation Status

### Completed

- ✅ Angular Material Design 3 UI
- ✅ NestJS REST API structure
- ✅ Component routing and navigation
- ✅ Loading states and error handling
- ✅ Red error states for empty results
- ✅ HTTP client integration
- ✅ Mock data endpoints

### Pending Implementation

- ⏳ SAM.gov API integration
- ⏳ Database persistence (MongoDB/PostgreSQL)
- ⏳ NAICS code filtering
- ⏳ Automated search scheduling (cron jobs)
- ⏳ User authentication
- ⏳ Lead tracking and status management
- ⏳ Export functionality (CSV, PDF)
- ⏳ Email notifications
- ⏳ Analytics dashboard

## SAM.gov API Integration (Future)

### Required Setup

1. **Register for API Key**

   - Visit https://open.gsa.gov/api/sam-entity-management-api/
   - Create account and request API access
   - Obtain API key

2. **Configure Environment Variables**

   ```
   SAM_API_KEY=your_api_key_here
   SAM_API_BASE_URL=https://api.sam.gov
   ```

3. **Implement API Client**
   - Create SAM.gov service in NestJS
   - Handle authentication
   - Implement rate limiting
   - Add error handling and retries

### SAM.gov API Endpoints to Integrate

- **Entity Management API** - Search for entities
- **Opportunities API** - Find contract opportunities
- **Federal Hierarchy API** - Navigate federal structure
- **Exclusions API** - Check debarred entities

## NAICS Codes of Interest

Common NAICS codes for North Dakota government contracts:

- **541511** - Custom Computer Programming Services
- **541512** - Computer Systems Design Services
- **541513** - Computer Facilities Management Services
- **541519** - Other Computer Related Services
- **541611** - Administrative Management and General Management Consulting
- **541618** - Other Management Consulting Services

## Technology Stack

### Backend

- **Framework:** NestJS 11.0
- **Runtime:** Node.js
- **Language:** TypeScript 5.9
- **Build Tool:** Webpack

### Frontend

- **Framework:** Angular 20.3
- **UI Library:** Angular Material 20.2
- **Language:** TypeScript 5.9
- **Build Tool:** esbuild
- **Testing:** Jest, Playwright

### Development Tools

- **Monorepo:** Nx 22.0
- **Package Manager:** npm
- **Linting:** ESLint
- **Formatting:** Prettier

## Project Structure

```
leads/
├── review/
│   ├── src/                      # Angular UI source
│   │   ├── app/
│   │   │   ├── pack-leads/       # Pack leads component
│   │   │   ├── probe-sam/        # Probe SAM component
│   │   │   ├── probe-sam-verbose/# Verbose probe component
│   │   │   ├── search-sam/       # Search SAM component
│   │   │   ├── app.ts            # Root component
│   │   │   ├── app.html          # Root template
│   │   │   ├── app.scss          # Root styles
│   │   │   └── app.routes.ts     # Routing configuration
│   │   ├── styles.scss           # Global styles
│   │   └── main.ts               # Application entry point
│   ├── leads-api/                # NestJS API source
│   │   └── src/
│   │       └── app/
│   │           ├── app.controller.ts  # API endpoints
│   │           ├── app.service.ts     # Business logic
│   │           └── app.module.ts      # Module configuration
│   ├── scripts/                  # Original shell scripts
│   │   ├── nd_pack.sh
│   │   ├── sam_search.sh
│   │   ├── sam_probe.sh
│   │   ├── sam_probe_verbose.sh
│   │   └── nd_naics_leads.csv
│   └── documentation/            # Project documentation
│       ├── README.md
│       ├── scripts_overview.md
│       └── SAM_LEADS_OVERVIEW.md
├── package.json                  # Root package configuration
├── nx.json                       # Nx workspace configuration
└── tsconfig.base.json            # TypeScript configuration
```

## Security Considerations

### API Key Management

- Never commit API keys to version control
- Use environment variables for sensitive data
- Implement key rotation policy
- Monitor API usage and limits

### Data Protection

- Implement HTTPS in production
- Sanitize user inputs
- Validate API responses
- Implement CORS properly
- Add rate limiting

### Authentication (Future)

- Implement JWT-based authentication
- Add role-based access control
- Secure API endpoints
- Session management

## Troubleshooting

### Common Issues

**API Not Starting:**

- Check if port 3000 is available
- Verify Node.js version
- Run `npm install` to ensure dependencies are installed

**UI Not Loading:**

- Check if port 4200 is available
- Verify API is running
- Check browser console for errors
- Clear browser cache

**TypeScript Errors:**

- Run `npx nx reset` to clear Nx cache
- Check `tsconfig` files for proper DOM lib inclusion
- Verify all dependencies are installed

### Debug Mode

Start applications with debug output:

```bash
# API with debug
nx serve leads-api --verbose

# UI with debug
nx serve leads-ui --verbose
```

## Contributing

### Development Guidelines

1. Follow TypeScript best practices
2. Use Angular style guide for frontend
3. Follow NestJS conventions for backend
4. Write unit tests for new features
5. Update documentation for changes

### Code Style

- Use ESLint for code quality
- Format with Prettier
- Follow existing patterns
- Add meaningful comments

## License

MIT

## Contact

For questions or issues, please refer to the project repository or contact the development team.
