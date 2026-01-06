# reMarkable PDF Planner Builder - Project Plan

## Project Overview

Build a web app that creates custom multi-page PDF planners for reMarkable tablets. Users design their planner layouts, generate a PDF, and upload it to their device via the USB web interface - no SSH required, no native templates needed.

**Why PDF Planners?**
- ✅ No SSH/root access needed
- ✅ Works with built-in USB web interface
- ✅ Can include hyperlinks for navigation
- ✅ Drag-and-drop upload at http://10.11.99.1
- ✅ Most commercial reMarkable planners use this format
- ⚠️ Can't be used as default notebook templates (user opens the PDF like a document)

---

## Phase 1: Proof of Concept - USB Upload 🔌

**Goal:** Verify we can create a PDF and upload it via USB web interface.

### 1.1 Test USB Connection & Web Interface
**Tasks:**
- [ ] Connect reMarkable to computer via USB-C
- [ ] On reMarkable: Settings > Storage > Enable "USB web interface"
- [ ] Open browser to `http://10.11.99.1`
- [ ] Verify web interface loads

### 1.2 Create a Simple Test PDF
**Tasks:**
- [ ] Use any tool (Google Docs, Canva, etc.) to create a simple PDF
- [ ] Create 3-5 pages with different content
- [ ] Page size: Letter (8.5" x 11") works fine, reMarkable will scale
- [ ] Export as PDF

### 1.3 Upload via USB Web Interface
**Tasks:**
- [ ] Drag-and-drop PDF to http://10.11.99.1
- [ ] Wait for upload to complete
- [ ] Find PDF on reMarkable device
- [ ] Open and test navigation
- [ ] Write on pages with stylus
- [ ] Verify everything works

### 1.4 Test PDF with Hyperlinks
**Tasks:**
- [ ] Create PDF with clickable table of contents
- [ ] Add links between pages
- [ ] Upload to device
- [ ] Test if links work on device (they should!)
- [ ] Document which link types work best

**Deliverable:** Working PDF uploaded and usable on reMarkable, with confirmed hyperlink support.

---

## Phase 2: PDF Generation Library 📄

**Goal:** Build the core logic to generate PDFs programmatically.

### 2.1 Choose PDF Library
**Options:**
- **jsPDF** - Popular, simple, good for basic layouts
- **PDFKit** - Node.js, more powerful, server-side or bundled
- **pdf-lib** - Modern, works in browser, good TypeScript support

**Recommended: pdf-lib** (pure browser, no server needed)

### 2.2 Test Basic PDF Generation
```javascript
// Features to test:
// - Create blank pages
// - Add text
// - Add lines/shapes
// - Set page dimensions
// - Export as downloadable PDF
```

**Tasks:**
- [ ] Set up basic HTML page with pdf-lib
- [ ] Create function to generate 1-page PDF
- [ ] Add text to page
- [ ] Add some lines/shapes
- [ ] Download generated PDF
- [ ] Open on computer - verify it looks right

### 2.3 Add reMarkable-Optimized Dimensions
```javascript
// reMarkable 2: 1404 x 1872 pixels at 226 DPI
// Convert to points (PDF unit): 
// Width: 1404 / 226 * 72 = 447.6 pt
// Height: 1872 / 226 * 72 = 597.2 pt

const pageSize = {
  width: 448,
  height: 597
}
```

**Tasks:**
- [ ] Set custom page size for reMarkable dimensions
- [ ] Generate PDF at exact dimensions
- [ ] Upload to device and verify no scaling/cropping
- [ ] Test both portrait and landscape

### 2.4 Implement Hyperlink Navigation
```javascript
// Create clickable links between pages
// Table of contents with page links
// Navigation buttons (prev/next)
```

**Tasks:**
- [ ] Create PDF with table of contents
- [ ] Add clickable links to specific pages
- [ ] Add "Back to Index" link on each page
- [ ] Test navigation on device
- [ ] Document best practices for touch targets (finger-sized)

**Deliverable:** Working PDF generation with proper dimensions and navigation.

---

## Phase 3: Basic Planner Layouts 📅

**Goal:** Create reusable layout templates for common planner types.

### 3.1 Daily Planner Layout
```
┌─────────────────────┐
│   Monday, Jan 1     │
├─────────────────────┤
│ 6:00 AM             │
│ 7:00 AM             │
│ 8:00 AM             │
│ ...                 │
│                     │
│ Notes:              │
│ ________________    │
│ ________________    │
└─────────────────────┘
```

**Tasks:**
- [ ] Create grid layout system
- [ ] Add date header
- [ ] Add hourly time slots (configurable start/end)
- [ ] Add notes section
- [ ] Generate 7 pages (one week)
- [ ] Test on device

### 3.2 Weekly Planner Layout
```
┌──────┬──────┬──────┐
│ Mon  │ Tue  │ Wed  │
├──────┼──────┼──────┤
│      │      │      │
│      │      │      │
├──────┴──────┴──────┤
│     Notes          │
└────────────────────┘
```

**Tasks:**
- [ ] Create 7-column grid
- [ ] Add day headers
- [ ] Add week number/date range
- [ ] Generate 12 pages (3 months)
- [ ] Test on device

### 3.3 Monthly Calendar Layout
```
┌─────────────────────┐
│    January 2025     │
├───┬───┬───┬───┬───┤
│ M │ T │ W │ T │ F │
├───┼───┼───┼───┼───┤
│ 1 │ 2 │ 3 │ 4 │ 5 │
│ 6 │ 7 │ 8 │ 9 │10 │
│...│...│...│...│...│
└───┴───┴───┴───┴───┘
```

**Tasks:**
- [ ] Create calendar grid generator
- [ ] Auto-populate dates for any month
- [ ] Handle month transitions correctly
- [ ] Add month/year header
- [ ] Generate 12 pages (full year)
- [ ] Test on device

### 3.4 Blank/Dot Grid Pages
**Tasks:**
- [ ] Create dot grid pattern (5mm spacing)
- [ ] Create lined paper (college ruled)
- [ ] Create graph paper
- [ ] Create blank pages
- [ ] Generate configurable number of pages

**Deliverable:** 4-5 different layout types that generate proper PDFs.

---

## Phase 4: Web UI - Layout Designer 🎨

**Goal:** Build the web interface where users design their planner.

### 4.1 Setup Project
```bash
npm create vite@latest remarkable-planner -- --template react-ts
cd remarkable-planner
npm install
npm install pdf-lib
npm install date-fns  # for date manipulation
```

**Tasks:**
- [ ] Initialize React + TypeScript project
- [ ] Set up Tailwind CSS
- [ ] Create basic page structure
- [ ] Add routing (if multi-page)

### 4.2 Planner Configuration Form
```javascript
interface PlannerConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'blank';
  startDate: Date;
  endDate: Date;
  includeWeekends: boolean;
  timeStart: string;  // "6:00 AM"
  timeEnd: string;    // "10:00 PM"
  timeInterval: number;  // 30 or 60 minutes
  includeIndex: boolean;
  pageNumbers: boolean;
}
```

**Tasks:**
- [ ] Create form with all configuration options
- [ ] Add date pickers (start/end date)
- [ ] Add time configuration
- [ ] Add toggle options (weekends, index, etc.)
- [ ] Add layout preview
- [ ] Validate inputs
- [ ] Show page count estimate

### 4.3 Layout Preview
**Tasks:**
- [ ] Create thumbnail preview of first page
- [ ] Show sample of what planner will look like
- [ ] Update preview when config changes
- [ ] Show navigation structure
- [ ] Add zoom controls for preview

### 4.4 Generate & Download
**Tasks:**
- [ ] "Generate Planner" button
- [ ] Show progress indicator during generation
- [ ] Generate PDF based on configuration
- [ ] Trigger download of PDF
- [ ] Add filename with date/type
- [ ] Show success message with instructions

**Deliverable:** Working web app where users can configure and download planners.

---

## Phase 5: USB Upload Integration 🔗

**Goal:** Streamline the upload process from web app.

### 5.1 Connection Instructions UI
**Tasks:**
- [ ] Create step-by-step connection guide
- [ ] Show screenshots of enabling USB web interface
- [ ] Explain how to access http://10.11.99.1
- [ ] Add troubleshooting tips
- [ ] Test instructions with non-technical user

### 5.2 Direct Upload (if possible)
```javascript
// Attempt to upload directly from web app
// This requires user to visit http://10.11.99.1 first
// Then navigate back to your app

// May not work due to CORS - need to test
```

**Tasks:**
- [ ] Research if direct upload via fetch is possible
- [ ] Test CORS from your domain to 10.11.99.1
- [ ] If works: implement direct upload
- [ ] If not: provide clear download + manual upload instructions
- [ ] Consider browser extension as alternative

### 5.3 Alternative: Browser Automation Guide
If direct upload doesn't work:
**Tasks:**
- [ ] Create animated GIF showing upload process
- [ ] Add "Copy USB URL" button (http://10.11.99.1)
- [ ] Add "Copy PDF" functionality (if browser supports)
- [ ] Make download button prominent
- [ ] Add checklist for upload steps

**Deliverable:** Smoothest possible path from generate → upload, given browser limitations.

---

## Phase 6: Polish & Features ✨

**Goal:** Make it actually useful and delightful to use.

### 6.1 Template Presets
**Tasks:**
- [ ] "Quick Start" templates:
  - [ ] "Daily Planner - This Week"
  - [ ] "Weekly Planner - This Month"
  - [ ] "Monthly Calendar - This Year"
  - [ ] "Meeting Notes - 50 pages"
  - [ ] "Dot Grid Notebook - 100 pages"
- [ ] One-click generate from preset
- [ ] Allow customizing presets

### 6.2 Customization Options
**Tasks:**
- [ ] Font selection (e-ink friendly fonts)
- [ ] Font size options
- [ ] Line spacing options
- [ ] Margin controls
- [ ] Header/footer customization
- [ ] Add custom text to header
- [ ] Color scheme (grayscale for e-ink)

### 6.3 Table of Contents & Navigation
**Tasks:**
- [ ] Auto-generate clickable table of contents
- [ ] Add navigation tabs (Monthly > Weekly > Daily)
- [ ] Add "Today" quick-jump link
- [ ] Add month/week navigation
- [ ] Test all links work on device

### 6.4 Page Elements
**Tasks:**
- [ ] Checkbox lists
- [ ] Habit trackers
- [ ] Goal setting pages
- [ ] Budget trackers
- [ ] Meal planners
- [ ] Water intake tracker
- [ ] Exercise log

### 6.5 Save & Load Configurations
**Tasks:**
- [ ] Save configuration to localStorage
- [ ] Load previous configuration
- [ ] Export configuration as JSON
- [ ] Import configuration
- [ ] Share configuration via URL

**Deliverable:** Feature-rich planner generator with lots of customization.

---

## Phase 7: Advanced PDF Features 🚀

**Goal:** Make planners more interactive and useful.

### 7.1 Dynamic Date Highlighting
**Tasks:**
- [ ] Research PDF form fields
- [ ] Add clickable date cells
- [ ] Add checkboxes that can be toggled
- [ ] Test on reMarkable (may have limited support)

### 7.2 Multi-Section Planners
```
Table of Contents
├── Monthly Views (Jan-Dec)
├── Weekly Views (52 weeks)
├── Daily Views (365 days)
└── Blank Pages (50 pages)
```

**Tasks:**
- [ ] Combine multiple layout types
- [ ] Add section dividers
- [ ] Create master table of contents
- [ ] Link sections together
- [ ] Test large PDF performance

### 7.3 Import/Export Features
**Tasks:**
- [ ] Import events from .ics calendar
- [ ] Import from Google Calendar (OAuth)
- [ ] Pre-populate planner with events
- [ ] Add holidays for selected country
- [ ] Add moon phases, week numbers, etc.

### 7.4 Layering System (Prep for WiFi version)
**Tasks:**
- [ ] Design layer architecture
- [ ] Separate background/content layers
- [ ] Document how this will work with WiFi version
- [ ] Create migration path for existing users

**Deliverable:** Power-user features that make planners truly customizable.

---

## Phase 8: Distribution 📦

**Goal:** Get this in front of users.

### 8.1 Landing Page
**Tasks:**
- [ ] Create landing page with demo
- [ ] Add screenshots/video of process
- [ ] Show example planners
- [ ] Add download button (for web app link)
- [ ] Add setup instructions
- [ ] Deploy to Vercel/Netlify

### 8.2 Documentation
**Tasks:**
- [ ] Create user guide
- [ ] Create video tutorial
- [ ] Create FAQ
- [ ] Troubleshooting guide
- [ ] Tips for best layouts

### 8.3 Community
**Tasks:**
- [ ] Create gallery of user planners
- [ ] Allow sharing configurations
- [ ] Create subreddit or Discord
- [ ] Template marketplace (future)

---

## Tech Stack

### Core
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **PDF Generation**: pdf-lib
- **Date Handling**: date-fns
- **Deployment**: Vercel or Netlify

### Optional
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **UI Components**: shadcn/ui
- **State**: Zustand (if needed)

---

## Success Criteria

### Phase 1-2 (Week 1)
- ✅ PDF uploads via USB web interface
- ✅ Hyperlinks work on device
- ✅ Can generate basic PDF programmatically

### Phase 3-4 (Week 2-3)
- ✅ 3+ layout types working
- ✅ Web UI generates configured planners
- ✅ Download works

### Phase 5-6 (Week 4)
- ✅ Clear upload instructions
- ✅ 5+ preset templates
- ✅ Customization options work
- ✅ Navigation tested on device

### Phase 7-8 (Week 5+)
- ✅ Advanced features working
- ✅ Landing page live
- ✅ First 10 users successfully create planners

---

## Timeline

- **Phase 1**: 1 day
- **Phase 2**: 2-3 days
- **Phase 3**: 3-4 days
- **Phase 4**: 1 week
- **Phase 5**: 2-3 days
- **Phase 6**: 1 week
- **Phase 7**: 1-2 weeks (optional)
- **Phase 8**: 3-4 days

**Total MVP (Phases 1-6)**: ~3-4 weeks part-time

---

## Future: WiFi Version for Native Templates

Once PDF planners are working:

### Phase 9: WiFi Connection (Future)
- [ ] Desktop app or browser extension
- [ ] Connect via WiFi (not USB)
- [ ] SSH-based template installation
- [ ] Single-page PNG templates
- [ ] Use as default notebook templates
- [ ] More advanced layering options

This becomes a separate "Pro" version while keeping the USB/PDF version free and simple.

---

## Advantages of This Approach

✅ **No SSH required** - Just drag and drop
✅ **No root access** - Works on stock reMarkable
✅ **Pure web app** - No desktop software needed
✅ **Works today** - USB web interface is built-in
✅ **Hyperlinks** - Navigation actually works
✅ **Cross-platform** - Any browser, any OS
✅ **Safe** - Can't brick the device
✅ **Fast to market** - Much simpler than native templates

---

## Limitations (to address in WiFi version later)

⚠️ **Not a default template** - Opens as PDF document
⚠️ **Can't handwrite directly** - Need to layer approach
⚠️ **File size** - Large planners (365 days) can be big
⚠️ **No handwriting recognition** - PDF doesn't support conversion

These are acceptable tradeoffs for V1. Most commercial reMarkable planners work exactly this way!

---

## Next Steps

1. ✅ Review this plan
2. ⬜ Get reMarkable device
3. ⬜ Test USB web interface (Phase 1)
4. ⬜ Experiment with pdf-lib (Phase 2)
5. ⬜ Build first layout (Phase 3)
6. ⬜ Start coding the web app (Phase 4)

---

**Let's build this! It's much simpler and will actually work. 🎯**