# DataSaarthi Frontend

React 19 + TypeScript + Vite data analytics workbench for DataSaarthi v2.

---

## Features & Pages

- **Auth Gateway (`AuthPage.tsx`)**: Supabase email/password authentication and one-click guest demo.
- **Data Upload (`UploadPage.tsx`)**: Drag-and-drop CSV dataset upload with live parsing progress and optional reference dataset pairing.
- **Data Editor (`DataEditor.tsx`)**: Full tabular inspection, column type inference, in-place cell editing, and row deletion powered by AG Grid.
- **Charts & Visualization (`ChartsPage.tsx`)**: Interactive 2D & 3D visualization engine powered by Plotly.js with automated axis pre-selection and AI suggestions.
- **AI Analysis (`AnalysisPage.tsx`)**: Statistical anomaly detection, trend analysis, and LLM executive summaries with one-click report saving.
- **Dataset Comparison (`ComparePage.tsx`)**: Schema and row-level discrepancy report generation against a reference CSV.
- **Conversational Q&A (`ChatPage.tsx`)**: Natural language data queries and slice inspection.
- **Report Studio (`ReportsPage.tsx`)**: Saved report repository with search filtering, full markdown rendering, and PDF export.

---

## Development

```bash
# Install dependencies
npm install

# Run dev server with hot reload
npm run dev

# Run Vitest test suite
npm test

# Run production build & typecheck
npm run build
```
