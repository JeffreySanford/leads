# SAM Leads Collection System - Complete Overview

## Purpose

This system automates the collection and management of government contract leads from SAM.gov (System for Award Management), specifically focusing on North Dakota NAICS-coded opportunities. The goal is to identify, probe, and track potential government contracting opportunities for business development.

## System Architecture

### Backend: NestJS API (`apps/leads-api/`)

The NestJS backend provides RESTful API endpoints for SAM.gov integration and lead management.

**API Endpoints:**

- `GET /api/pack` - Returns packed ND NAICS leads from MongoDB
- `POST /api/sam/test-live` - Tests SAM.gov API connectivity
- `POST /api/sam/nd-it` - Searches SAM.gov for ND IT opportunities with progressive filter relaxation
- `POST /api/search` - General SAM.gov search by keyword
- `POST /api/probe` - Basic SAM probe by lead ID (legacy endpoint)
- `POST /api/probe/verbose` - Detailed SAM probe (legacy endpoint)

**Server Configuration:**

- Base URL: `http://localhost:3000`
- API Prefix: `/api`
- Full endpoint example: `http://localhost:3000/api/pack`
- MongoDB: `mongodb://localhost:27017/leads-db`

### Frontend: Angular Application (`apps/leads-web/`)

The Angular application provides a Material Design 3 interface for interacting with the SAM leads system.

The Angular application provides a Material Design 3 interface for interacting with the SAM leads system.

**Features:**

- Modern Material Design 3 UI components
- Horizontal navigation toolbar
- Real-time API integration
- Visual feedback for loading states
- Red error states when no results are found
- Responsive design (max-width: 800px)

**Pages:**

1. **Leads (Pack Leads)** - Display consolidated ND NAICS leads from MongoDB
2. **Search SAM** - Search SAM.gov database with progressive filter relaxation
   - Starts with tight filters (ND-only, $250K, SB, 30 days)
   - Automatically relaxes if zero results
   - Shows all NAICS codes searched and criteria used

**Notable UI Features:**
- Zero-results messaging explains why searches return empty
- Displays all 5 NAICS codes searched with descriptions
- Shows complete search criteria (value, set-aside, date range)
- Acknowledges government shutdown context when appropriate

## Original Shell Scripts (`apps/leads-web/scripts/`)

The system is based on four shell scripts that were originally used for manual lead collection:

### 1. `nd_pack.sh`

Packs/consolidates ND NAICS leads into a CSV file.

- Reads from `nd_naics_leads.csv` (contains lead_id, company, naics_code)
- Creates a packed output for further processing
- Usage: `./nd_pack.sh`
- **Status:** Replaced by `/api/pack` endpoint with MongoDB

### 2. `sam_search.sh`

Searches SAM.gov database for leads based on search terms.

- Primary discovery tool to find new contract opportunities
- Returns list of potential leads matching criteria
- Usage: `./sam_search.sh <search_term>`
- **Status:** Replaced by `/api/sam/nd-it` with progressive filter relaxation

### 3. `sam_probe.sh` (Removed)

Basic probe of SAM.gov for specific lead information.
- **Status:** Removed as redundant with Pack Leads functionality

### 4. `sam_probe_verbose.sh` (Removed)

Detailed/verbose probe of SAM.gov.
- **Status:** Removed as redundant with Pack Leads functionality

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

- ⏳ SAM.gov API integration with progressive filter relaxation
- ⏳ Database persistence (MongoDB/PostgreSQL)
- ⏳ NAICS code filtering with PSC fallback
- ⏳ Notice type filtering (Solicitation, Sources Sought, RFI, Special Notice)
- ⏳ Geographic expansion (ND + adjacent states, then CONUS/remote)
- ⏳ Contract value ceiling adjustment ($250K → $1M)
- ⏳ Set-aside filtering (SB preference vs requirement)
- ⏳ Automated search scheduling (cron jobs)
- ⏳ User authentication
- ⏳ Lead tracking and status management
- ⏳ Export functionality (CSV, PDF)
- ⏳ Email notifications
- ⏳ Analytics dashboard
- ⏳ Zero-results troubleshooting workflow

## SAM.gov API Integration (Future)

### Current Search Filters (ND-IT-Tight)

**Why Zero Results Are Normal:**
The current filter combination is extremely restrictive and often yields zero results, especially during government slowdowns:

- **Geography:** North Dakota only
- **Contract Value:** ≤ $250K
- **Set-Aside:** Small Business only
- **Date Range:** Last 30 days
- **NAICS:** Only 5 IT codes (541511, 541512, 541513, 541519, 541690)

**Issue:** SAM.gov is active and posting opportunities (e.g., DISA telecom RFQs), but tight filters exclude most relevant contracts.

### Graduated Filter Relaxation Strategy

Apply these progressively until results appear:

#### Level 1: Medium Relaxation (ND-IT-Medium)
```json
{
  "dateRange": "90 days",
  "states": ["ND", "SD", "MN", "MT"],
  "naics": ["541511","541512","541513","541519","541690","518210","541715","541618"],
  "maxValue": 250000,
  "setAside": "Small Business",
  "noticeTypes": ["Solicitation", "Combined", "Sources Sought", "RFI", "Special Notice"]
}
```

**Rationale:**
- Extends date window to 90 days (catches more opportunities)
- Includes adjacent states (Minot/Cavalier AFB work often crosses borders)
- Adds extended IT NAICS codes
- Includes pre-solicitation notices (RFI, Sources Sought) to shape opportunities early

#### Level 2: Wide Relaxation (ND-IT-Wide)
```json
{
  "dateRange": "90 days",
  "states": ["ND", "SD", "MN", "MT"],
  "naics": ["541511","541512","541513","541519","541690","518210","541715","541618"],
  "pscPrefix": "D3",
  "maxValue": 1000000,
  "setAside": null,
  "noticeTypes": ["Solicitation", "Combined", "Sources Sought", "RFI", "Special Notice"]
}
```

**Changes:**
- Raises ceiling to $1M (many IT contracts sit between $250K–$750K)
- Removes SB set-aside filter (includes all opportunities)
- Adds PSC D3** (IT/Telecom services) as alternative to NAICS

#### Level 3: Sanity Probe (IT-Wide-Probe)
```json
{
  "dateRange": "90 days",
  "states": null,
  "naics": ["541512","541519","518210","541715"],
  "pscPrefix": "D3",
  "maxValue": null,
  "setAside": null,
  "noticeTypes": ["Solicitation", "Combined", "Sources Sought", "Special Notice"]
}
```

**Purpose:**
- Proves SAM.gov API is working
- Should always return some results
- No geographic restrictions
- Broader NAICS and PSC coverage

### Common SAM.gov Search Issues

**Why you might get zero results even when opportunities exist:**

1. **Notice Type Filter Too Narrow**
   - Include: Solicitation, Combined, Sources Sought, RFI, Special Notice
   - Don't limit to "Solicitation only"

2. **Date Field Confusion**
   - Use: `publishDate` or `lastUpdated`
   - Don't use: `responseDueDate` (excludes many active opportunities)

3. **Pagination Issues**
   - Always follow `nextPageToken`
   - SAM.gov may return 0 items on page 1 but results on page 2+

4. **Geographic Filter Too Strict**
   - Many contracts list "Place of Performance: Various/USA"
   - Strict state filters exclude remote-eligible work

5. **De-duplication Problems**
   - Use: `noticeId` as unique key
   - Don't use: title-based matching (misses near-duplicates)

6. **NAICS vs Keywords**
   - Fall back to keywords if NAICS returns zero
   - Try: "Angular" OR "software development" OR "data visualization"

### Progressive Search Implementation

```typescript
const searchVariants = [
  {
    name: "ND-IT-Tight",
    dateRange: 30,
    states: ["ND"],
    naics: ["541511","541512","541513","541519","541690"],
    maxValue: 250000,
    setAside: "Small Business"
  },
  {
    name: "ND-IT-Medium",
    dateRange: 90,
    states: ["ND","SD","MN","MT"],
    naics: ["541511","541512","541513","541519","541690","518210","541715","541618"],
    maxValue: 250000,
    setAside: "Small Business",
    noticeTypes: ["Solicitation","Combined","Sources Sought","RFI","Special Notice"]
  },
  {
    name: "ND-IT-Wide",
    dateRange: 90,
    states: ["ND","SD","MN","MT"],
    naics: ["541511","541512","541513","541519","541690","518210","541715","541618"],
    pscPrefix: "D3",
    maxValue: 1000000,
    setAside: null,
    noticeTypes: ["Solicitation","Combined","Sources Sought","RFI","Special Notice"]
  },
  {
    name: "IT-Wide-Probe",
    dateRange: 90,
    states: null,
    naics: ["541512","541519","518210","541715"],
    pscPrefix: "D3",
    maxValue: null,
    setAside: null,
    noticeTypes: ["Solicitation","Combined","Sources Sought","Special Notice"]
  }
];

// Execute searches progressively until results found
for (const variant of searchVariants) {
  const results = await searchSam(variant);
  if (results.total > 0) {
    return deduplicateByNoticeId(results);
  }
}
return [];
```

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
   - Support progressive filter relaxation

### SAM.gov API Endpoints to Integrate

- **Opportunities API v2** - Find contract opportunities (primary endpoint)
- **Entity Management API** - Search for entities
- **Federal Hierarchy API** - Navigate federal structure
- **Exclusions API** - Check debarred entities

## NAICS Codes of Interest

### Primary IT NAICS Codes (Currently Used)

- **541512** - Computer Systems Design Services
- **541511** - Custom Computer Programming Services
- **541513** - Computer Facilities Management Services
- **541519** - Other Computer Related Services
- **541690** - Other Scientific and Technical Consulting Services

### Extended IT NAICS Codes (For Broader Searches)

- **518210** - Data Processing, Hosting, and Related Services
- **541715** - R&D in Physical, Engineering, and Life Sciences (includes software R&D)
- **541618** - Other Management Consulting Services

### Telecom NAICS Codes (Not Currently Targeted)

- **517111** - Wired Telecommunications Carriers (e.g., DISA circuit contracts)

### PSC Codes (Product Service Codes)

- **D3xx** - IT/Telecommunications Services (use for broader searches)

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
├── apps/
│   ├── leads-web/                # Angular UI (formerly review/)
│   │   ├── src/                  # Angular source
│   │   │   ├── app/
│   │   │   │   ├── pack-leads/   # Pack leads component
│   │   │   │   ├── search-sam/   # Search SAM component
│   │   │   │   ├── app.ts        # Root component
│   │   │   │   ├── app.html      # Root template
│   │   │   │   ├── app.scss      # Root styles
│   │   │   │   └── app.routes.ts # Routing configuration
│   │   │   ├── styles.scss       # Global styles
│   │   │   └── main.ts           # Application entry point
│   │   ├── scripts/              # Original shell scripts
│   │   │   ├── nd_pack.sh
│   │   │   ├── sam_search.sh
│   │   │   └── nd_naics_leads.csv
│   │   ├── documentation/        # Project documentation
│   │   │   ├── README.md
│   │   │   ├── scripts_overview.md
│   │   │   ├── IMPLEMENTATION_GUIDE.md
│   │   │   └── SAM_LEADS_OVERVIEW.md
│   │   └── project.json          # Nx project configuration
│   ├── leads-api/                # NestJS API (formerly review/leads-api/)
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── app.controller.ts   # API endpoints
│   │   │       ├── app.service.ts      # Business logic
│   │   │       ├── app.module.ts       # Module configuration
│   │   │       ├── database/           # Database module
│   │   │       ├── dto/                # Data Transfer Objects
│   │   │       ├── schemas/            # MongoDB schemas
│   │   │       ├── seed-data/          # Seed data
│   │   │       └── services/           # SAM API & Leads services
│   │   └── project.json          # Nx project configuration
│   ├── leads-web-e2e/            # Frontend E2E tests
│   │   └── src/
│   │       └── example.spec.ts
│   └── leads-api-e2e/            # Backend E2E tests
│       └── src/
│           └── leads-api/
│               └── leads-api.spec.ts
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
