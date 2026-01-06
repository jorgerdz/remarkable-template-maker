# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web app that creates custom multi-page PDF planners for reMarkable tablets. Users design planner layouts, generate PDFs with hyperlink navigation, and upload via the USB web interface (http://10.11.99.1) - no SSH or root access required.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **PDF Generation**: pdf-lib
- **Date Handling**: date-fns
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel or Netlify

## Build Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### PDF Generation
- Use pdf-lib for pure browser-based PDF generation
- reMarkable 2 optimized dimensions: 448 x 597 points (1404 x 1872 pixels at 226 DPI)
- PDFs include hyperlinks for navigation (table of contents, prev/next, back to index)

### Layout Types
- **Daily Planner**: Hourly time slots with configurable start/end times
- **Weekly Planner**: 7-column grid with notes section
- **Monthly Calendar**: Auto-populated calendar grid
- **Blank Pages**: Dot grid, lined, graph paper, blank

### Key Configuration Interface
```typescript
interface PlannerConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'blank';
  startDate: Date;
  endDate: Date;
  includeWeekends: boolean;
  timeStart: string;
  timeEnd: string;
  timeInterval: number;  // 30 or 60 minutes
  includeIndex: boolean;
  pageNumbers: boolean;
}
```

## Device Integration

PDFs are uploaded via reMarkable's built-in USB web interface:
1. Connect reMarkable via USB-C
2. Enable USB web interface in Settings > Storage
3. Access http://10.11.99.1 in browser
4. Drag-and-drop the generated PDF
