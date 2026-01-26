# SAM.gov Contract Search Documentation

## Overview

This application searches SAM.gov (System for Award Management) for federal contracting opportunities specifically targeted at **North Dakota small businesses in IT-related fields**.

## Search Configuration

### API Endpoint

- **Base URL**: `https://api.sam.gov/opportunities/v2/search`
- **API Key**: Configured via `SAM_API_KEY` environment variable (defaults to `DEMO_KEY`).
  - For local development, copy `.env.sample` to `.env` and add your key.
  - The `.env` file is excluded from Git tracking for security.
  - **Security**: The API key is only used server-side and is automatically redacted from all application logs. It is never sent to the frontend.
- **Rate Limits**:
  - DEMO_KEY: ~10-20 requests per hour
  - Registered Key: Much higher limits (free registration at [https://open.gsa.gov/api/get-opportunities-public-api/](https://open.gsa.gov/api/get-opportunities-public-api/))

### Search Parameters

#### 1. **Date Range**

- **Parameter**: `postedFrom` and `postedTo`
- **Value**: Last 30 days from current date
- **Format**: YYYY-MM-DD
- **Example**: `2025-10-08` to `2025-11-07`

#### 2. **Contract Value**

- **Parameter**: Client-side filter on `maxValue`
- **Value**: $250,000 or less
- **Fields Checked**:
  - `baseAndAllOptionsValue` (primary)
  - `estimatedValue` (fallback)
  - `award.amount` (fallback)
- **Reasoning**: Small businesses can handle these contract sizes

#### 3. **Set-Aside Type**

- **Parameter**: `typeOfSetAside`
- **Value**: `SBA` (Small Business Set-Aside)
- **Full Description**: "Total Small Business Set-Aside (FAR 19.5)"
- **Purpose**: Contracts reserved exclusively for small businesses

#### 4. **NAICS Codes** (North Dakota IT Focus)

We search for **5 specific IT-related NAICS codes**:

| NAICS Code | Description | Why We Search This |
| :--- | :--- | :--- |
| **541512** | Computer Systems Design Services | Core IT infrastructure, system architecture, network design. North Dakota's tech sector specializes in custom solutions for government and enterprise clients. |
| **541511** | Custom Computer Programming Services | Software development, application programming, coding services. ND has growing software dev talent, especially in Fargo-Moorhead tech corridor. |
| **541513** | Computer Facilities Management Services | Data center operations, server management, IT help desk. Critical for government agency IT support needs. |
| **541519** | Other Computer Related Services | Catch-all for IT services not elsewhere classified. Includes system integration, technical consulting, IT project management. |
| **541690** | Other Scientific and Technical Consulting Services | **Includes cybersecurity consulting**, which is increasingly important. ND cybersecurity firms are competitive for federal work. |

### How the Search Works

#### Test LIVE SAM.gov API Button

```bash
Endpoint: GET /api/sam/test-live
Parameters:
  - maxValue: $250,000
  - setAside: 'SBA'
  - limit: 5 contracts
  - No NAICS filter (searches ALL industries)
```

**Purpose**: Quick test to verify SAM.gov API connectivity. Returns any 5 small business contracts under $250K from last 30 days.

#### Search ND IT Contracts Button

```bash
Endpoint: GET /api/sam/nd-it
Searches 5 separate NAICS codes:
  1. 541512 (Computer Systems Design)
  2. 541511 (Custom Programming)
  3. 541513 (Facilities Management)
  4. 541519 (Other Computer Services)
  5. 541690 (Technical Consulting/Cybersecurity)

For each NAICS:
  - maxValue: $250,000
  - setAside: 'SBA'
  - limit: 10 contracts per code
  - ncode: [specific NAICS]

Total possible results: 50 contracts (10 per NAICS)
Duplicates removed by noticeId
```

**Purpose**: Targeted search for North Dakota IT businesses. Returns IT-specific small business contracts under $250K.

## Expected Results

### What We're Looking For

**Ideal Contract Example:**

```text
Notice ID: 1234567890ABC
Title: "IT Help Desk Support Services"
Agency: DEPT OF VETERANS AFFAIRS
NAICS: 541513 (Computer Facilities Management)
Value: $175,000
Set-Aside: Small Business Set-Aside
Posted: Within last 30 days
Description: 24/7 help desk support for VA medical center...
```

### Why Results May Be Zero

1. **Federal Contracting Pause**: As of January 2026, federal contract postings have been paused due to a government shutdown. No new opportunities are being posted until the government resumes normal operations. This is the primary reason for zero results at this time.
2. **DEMO_KEY Rate Limits**: May be throttled or blocked
3. **No Matching Contracts**: Federal agencies may not have posted IT contracts in the last 30 days that match our criteria
4. **All Contracts > $250K**: Recent IT contracts may all exceed our value threshold
5. **Different Set-Aside Types**: Contracts may be 8(a), SDVOSB, or HUBZone instead of general SBA
6. **API Response Issues**: SAM.gov API may be down or slow

### Current Behavior

When the API returns 0 results OR encounters an error:

- **Falls back to MOCK data** (1 sample contract)
- Logs detailed error information to console
- Mock contract clearly labeled as "TEST DATA from SAM.gov API"

## For ChatGPT/AI Context

When discussing this system, here's what we're doing:

**Business Problem**: North Dakota small IT businesses need to find federal contracting opportunities

**Solution**: Automated search of SAM.gov focusing on:

- Small business set-asides (contracts reserved for small businesses)
- IT-related work (5 NAICS codes covering programming, systems, cybersecurity)
- Reasonable contract sizes ($250K or less)
- Recent opportunities (last 30 days)

**NAICS Focus Explained**:

- **541511-541519**: Core IT services (programming, systems, management)
- **541690**: Includes cybersecurity consulting (increasingly critical)
- These codes represent North Dakota's IT industry strengths

**Why These Specific Criteria**:

- **$250K threshold**: Small businesses can realistically deliver these contracts
- **30 days**: Recent opportunities still likely accepting proposals
- **SBA set-aside**: Contracts where ND businesses don't compete against large primes
- **IT NAICS**: Matches ND's tech sector capabilities (Fargo, Bismarck, Grand Forks)

**Current Challenge**:

Real API may return 0 results due to rate limits, no matching contracts, or API issues. **Currently, the most likely cause is the federal government shutdown, which has paused new contract postings.** The system is configured correctly but needs either:

1. A registered SAM.gov API key for better access
2. Broader search criteria (more NAICS, longer date range, higher value)
3. Different set-aside types (8(a), SDVOSB, HUBZone, WOSB)

## Testing the Search

### Check Server Logs

When you click "Search ND IT Contracts", look for these console messages:

```bash
🔵 Searching SAM.gov for North Dakota IT-related contracts...
  Searching for NAICS 541512...
🌐 SAM.gov API Request: { url: '...', params: {...} }
📡 SAM.gov API Response Status: 200 OK
📦 SAM.gov Raw Response: { totalRecords: X }
🔍 Before value filter: X opportunities
💰 After $250000 filter: X of Y opportunities
✅ Returning X opportunities from SAM.gov
```

If you see `⚠️ Falling back to MOCK data`, the API call failed.

### Troubleshooting Steps

1. **Check API Key**: Set `SAM_API_KEY` environment variable
2. **Verify Connectivity**: Test with simple curl command
3. **Check Rate Limits**: DEMO_KEY may be exhausted
4. **Broaden Search**: Remove NAICS filter or increase value limit
5. **Check SAM.gov Status**: API may be down for maintenance

## Next Steps for Improvement

1. **Monitor Government Status**: Check [SAM.gov](https://sam.gov) and [GSA News](https://gsa.gov) for updates on when federal contracting will resume. New contracts will begin appearing again once the government reopens and agencies resume procurement operations. This typically occurs within days to weeks after a shutdown ends.
2. **Get Real API Key**: Register at [https://open.gsa.gov/api/get-opportunities-public-api/](https://open.gsa.gov/api/get-opportunities-public-api/)
