# SAM Leads System - Implementation Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Component Details](#component-details)
3. [API Integration](#api-integration)
4. [UI Components](#ui-components)
5. [Styling Guide](#styling-guide)
6. [Testing](#testing)
7. [Deployment](#deployment)

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd leads

# Install dependencies
npm install

# Start development servers
npm run serve:all
```

### Access the Application

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000/api

## Component Details

### Pack Leads Component

**Location:** `review/src/app/pack-leads/pack-leads.component.ts`

**Purpose:** Displays consolidated ND NAICS leads data

**Features:**
- Fetches leads from API on button click
- Shows loading spinner during API call
- Displays leads in Material list with icons
- Shows red error message when no leads found
- Each lead shows: company name, lead ID, and NAICS code

**API Integration:**
```typescript
this.http.get<{ leads: Lead[] }>('http://localhost:3000/api/pack')
```

**State Management:**
- `leads: Lead[]` - Array of lead objects
- `loading: boolean` - Loading state
- `hasRun: boolean` - Tracks if API was called

### Probe SAM Component

**Location:** `review/src/app/probe-sam/probe-sam.component.ts`

**Purpose:** Query SAM.gov for basic lead information

**Features:**
- Input field for lead ID
- Disabled button when no input or loading
- Shows loading spinner during API call
- Displays result in green success box
- Shows red error message when no results

**API Integration:**
```typescript
this.http.post<{ result: string }>('http://localhost:3000/api/probe', { 
  leadId: this.leadId 
})
```

**State Management:**
- `leadId: string` - User input
- `result: string` - API response
- `loading: boolean` - Loading state
- `hasRun: boolean` - Tracks if API was called

### Probe SAM Verbose Component

**Location:** `review/src/app/probe-sam-verbose/probe-sam-verbose.component.ts`

**Purpose:** Query SAM.gov for detailed lead information

**Features:**
- Input field for lead ID
- Disabled button when no input or loading
- Shows loading spinner during API call
- Displays result in blue info box
- Shows red error message when no results

**API Integration:**
```typescript
this.http.post<{ result: string }>('http://localhost:3000/api/probe/verbose', { 
  leadId: this.leadId 
})
```

**State Management:**
- `leadId: string` - User input
- `result: string` - API response
- `loading: boolean` - Loading state
- `hasRun: boolean` - Tracks if API was called

### Search SAM Component

**Location:** `review/src/app/search-sam/search-sam.component.ts`

**Purpose:** Search SAM.gov database by keyword

**Features:**
- Input field for search term
- Disabled button when no input or loading
- Shows loading spinner during API call
- Displays results in Material list with icons
- Shows red error message when no results found

**API Integration:**
```typescript
this.http.post<{ results: string[] }>('http://localhost:3000/api/search', { 
  term: this.term 
})
```

**State Management:**
- `term: string` - User input
- `results: string[]` - Array of search results
- `loading: boolean` - Loading state
- `hasRun: boolean` - Tracks if API was called

## API Integration

### NestJS Service Layer

**Location:** `review/leads-api/src/app/app.service.ts`

**Current Implementation (Mock Data):**

```typescript
interface Lead {
  lead_id: number;
  company: string;
  naics_code: string;
}

@Injectable()
export class AppService {
  packLeads(): { leads: Lead[] } {
    return {
      leads: [
        { lead_id: 1001, company: 'Acme Corp', naics_code: '541611' },
        { lead_id: 1002, company: 'Globex Inc', naics_code: '541512' },
        { lead_id: 1003, company: 'Initech', naics_code: '541513' },
      ],
    };
  }

  probeSam(leadId: string): { result: string } {
    return { 
      result: `Probing SAM for lead: ${leadId}. Result: [sample output]` 
    };
  }

  probeSamVerbose(leadId: string): { result: string } {
    return { 
      result: `Verbose probing SAM for lead: ${leadId}. Detailed result: [sample verbose output]` 
    };
  }

  searchSam(term: string): { results: string[] } {
    return { 
      results: [`Search results for ${term}: [sample results]`] 
    };
  }
}
```

### Future SAM.gov Integration

**Step 1: Install HTTP Client**
```bash
npm install axios
```

**Step 2: Create SAM.gov Service**

```typescript
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SamGovService {
  private readonly apiKey = process.env.SAM_API_KEY;
  private readonly baseUrl = 'https://api.sam.gov';

  async searchOpportunities(term: string) {
    const response = await axios.get(`${this.baseUrl}/opportunities/v2/search`, {
      params: {
        api_key: this.apiKey,
        keyword: term,
        limit: 100
      }
    });
    return response.data;
  }

  async getOpportunityDetails(opportunityId: string) {
    const response = await axios.get(
      `${this.baseUrl}/opportunities/v2/opportunity/${opportunityId}`,
      {
        params: { api_key: this.apiKey }
      }
    );
    return response.data;
  }
}
```

**Step 3: Update AppService to Use SAM.gov Service**

```typescript
@Injectable()
export class AppService {
  constructor(private readonly samGovService: SamGovService) {}

  async searchSam(term: string) {
    const data = await this.samGovService.searchOpportunities(term);
    return { results: data.opportunities };
  }

  async probeSam(leadId: string) {
    const data = await this.samGovService.getOpportunityDetails(leadId);
    return { result: JSON.stringify(data) };
  }
}
```

## UI Components

### Material Design 3 Components Used

**Toolbar:**
```html
<mat-toolbar color="primary">
  <span>SAM Leads Manager</span>
  <a mat-button routerLink="/pack">Pack Leads</a>
</mat-toolbar>
```

**Cards:**
```html
<mat-card>
  <mat-card-header>
    <mat-icon mat-card-avatar>folder</mat-icon>
    <mat-card-title>Pack ND NAICS Leads</mat-card-title>
    <mat-card-subtitle>Retrieve and display packed lead data</mat-card-subtitle>
  </mat-card-header>
  <mat-card-content>
    <!-- Content -->
  </mat-card-content>
</mat-card>
```

**Form Fields:**
```html
<mat-form-field appearance="outline">
  <mat-label>Lead ID</mat-label>
  <input matInput [(ngModel)]="leadId">
  <mat-icon matPrefix>badge</mat-icon>
</mat-form-field>
```

**Lists:**
```html
<mat-list>
  <mat-list-item *ngFor="let lead of leads">
    <mat-icon matListItemIcon>business</mat-icon>
    <div matListItemTitle>{{lead.company}}</div>
    <div matListItemLine>ID: {{lead.lead_id}}</div>
  </mat-list-item>
</mat-list>
```

**Buttons:**
```html
<button mat-raised-button color="primary" (click)="action()">
  <mat-icon>download</mat-icon> Action
</button>
```

**Progress Spinner:**
```html
<mat-spinner *ngIf="loading" diameter="40"></mat-spinner>
```

## Styling Guide

### Global Styles

**Location:** `review/src/styles.scss`

```scss
@use '@angular/material' as mat;

@include mat.core();

body {
  margin: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
  background-color: #f5f5f5;
}
```

### Component Styles

**Error State (Red):**
```scss
.no-results {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  margin-top: 16px;
  background-color: #ffebee;
  border-radius: 4px;
  
  mat-icon {
    font-size: 32px;
    width: 32px;
    height: 32px;
    color: #c62828;
  }
  
  .error-text {
    color: #c62828;
    margin: 0;
    font-weight: 500;
    font-size: 16px;
  }
}
```

**Success State (Green):**
```scss
.result-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px;
  margin-top: 16px;
  background-color: #e8f5e9;
  border-radius: 4px;
  
  mat-icon {
    color: #2e7d32;
    font-size: 24px;
    width: 24px;
    height: 24px;
  }
  
  p {
    margin: 0;
    color: #1b5e20;
    flex: 1;
  }
}
```

**Info State (Blue):**
```scss
.result-card {
  background-color: #e3f2fd;
  
  mat-icon {
    color: #1565c0;
  }
  
  p {
    color: #0d47a1;
  }
}
```

### Color Palette

- **Primary:** Material Blue
- **Error:** #c62828 (Dark Red)
- **Error Background:** #ffebee (Light Red)
- **Success:** #2e7d32 (Dark Green)
- **Success Background:** #e8f5e9 (Light Green)
- **Info:** #1565c0 (Dark Blue)
- **Info Background:** #e3f2fd (Light Blue)
- **Background:** #f5f5f5 (Light Gray)

## Testing

### Unit Tests

**Run all tests:**
```bash
npm run test:all
```

**Run specific project tests:**
```bash
npm run test:api
npm run test:ui
```

**Example Component Test:**
```typescript
describe('PackLeadsComponent', () => {
  it('should show error when no leads found', () => {
    component.hasRun = true;
    component.loading = false;
    component.leads = [];
    fixture.detectChanges();
    
    const errorElement = fixture.nativeElement.querySelector('.no-results');
    expect(errorElement).toBeTruthy();
  });
});
```

### E2E Tests

**Run all e2e tests:**
```bash
npm run e2e:all
```

**Example E2E Test:**
```typescript
test('should display no results message', async ({ page }) => {
  await page.goto('http://localhost:4200/pack');
  await page.click('button:has-text("Pack Leads")');
  await expect(page.locator('.error-text')).toContainText('No leads found');
});
```

## Deployment

### Production Build

```bash
# Build all projects
npm run build:all

# Build specific project
npm run build:api
npm run build:ui
```

### Environment Configuration

**Create `.env` file:**
```env
# API Configuration
PORT=3000
NODE_ENV=production

# SAM.gov API
SAM_API_KEY=your_api_key_here
SAM_API_BASE_URL=https://api.sam.gov

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/leads
```

### Docker Deployment (Future)

**Dockerfile for API:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/review/leads-api ./
CMD ["node", "main.js"]
```

**Dockerfile for UI:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:ui

FROM nginx:alpine
COPY --from=build /app/dist/review /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Cloud Deployment Options

**AWS:**
- API: Elastic Beanstalk or ECS
- UI: S3 + CloudFront
- Database: RDS

**Azure:**
- API: App Service
- UI: Static Web Apps
- Database: Azure Database

**Google Cloud:**
- API: Cloud Run
- UI: Cloud Storage + CDN
- Database: Cloud SQL

## Best Practices

### Error Handling

1. Always show user-friendly error messages
2. Log errors to console for debugging
3. Implement retry logic for failed API calls
4. Handle network errors gracefully

### Performance

1. Use lazy loading for routes
2. Implement pagination for large datasets
3. Cache API responses when appropriate
4. Optimize bundle size

### Security

1. Never expose API keys in frontend code
2. Validate all user inputs
3. Implement CORS properly
4. Use HTTPS in production
5. Implement rate limiting on API endpoints

### Accessibility

1. Use semantic HTML
2. Provide ARIA labels
3. Ensure keyboard navigation works
4. Test with screen readers
5. Maintain color contrast ratios
