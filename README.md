# reMarkable Planner

A web app for creating custom bullet journal templates and multi-page PDF planners optimized for reMarkable tablets.

**Live version:** https://remarkable-template-maker.jorgecrb.workers.dev/

## Features

- Customizable bullet journal layout
- Support for reMarkable 2, reMarkable Pro and reMarkable Pro Move
- Live preview
- Daily, weekly, and monthly planner, bullet layouts
- Blank pages with dot grid, lined, or graph paper
- Hyperlink navigation between pages

## Upload to reMarkable

1. Connect your reMarkable to your computer via USB-C
2. On your reMarkable, go to Settings > Storage > USB web interface and enable it
3. Open http://10.11.99.1 in your browser
4. Drag and drop the generated PDF to upload

No SSH or root access required.

## Development

```bash
npm install
npm run dev
```
