import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ReportsPage } from "../components/ReportsPage";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: {
    getReports: vi.fn(),
    deleteReport: vi.fn(),
    generatePdf: vi.fn(),
  },
}));

const mockReports = [
  {
    id: "rep-1",
    user_id: "usr-test",
    title: "Financial Outlier Analysis",
    content: "# Summary\n- Total Outliers: 4\n- High Risk",
    created_at: "2026-08-22T10:00:00Z",
  },
  {
    id: "rep-2",
    user_id: "usr-test",
    title: "Call Center Discrepancies",
    content: "# Discrepancy\n- Found mismatch in duration",
    created_at: "2026-08-22T11:00:00Z",
  },
];

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (api.getReports as any).mockImplementation(() => new Promise(() => {}));
    render(<ReportsPage userId="usr-test" />);
    expect(screen.getByText(/Retrieving saved reports/i)).toBeInTheDocument();
  });

  it("renders empty state when user has no reports", async () => {
    (api.getReports as any).mockResolvedValueOnce({ reports: [] });
    render(<ReportsPage userId="usr-test" />);

    await waitFor(() => {
      expect(screen.getByText(/No saved reports yet/i)).toBeInTheDocument();
    });
  });

  it("renders list of reports and allows searching", async () => {
    (api.getReports as any).mockResolvedValueOnce({ reports: mockReports });
    render(<ReportsPage userId="usr-test" />);

    await waitFor(() => {
      expect(screen.getByText("Financial Outlier Analysis")).toBeInTheDocument();
      expect(screen.getByText("Call Center Discrepancies")).toBeInTheDocument();
    });

    // Test search filter
    const searchInput = screen.getByPlaceholderText(/Search reports.../i);
    fireEvent.change(searchInput, { target: { value: "Financial" } });

    expect(screen.getByText("Financial Outlier Analysis")).toBeInTheDocument();
    expect(screen.queryByText("Call Center Discrepancies")).not.toBeInTheDocument();
  });

  it("handles report deletion after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    (api.getReports as any).mockResolvedValueOnce({ reports: [...mockReports] });
    (api.deleteReport as any).mockResolvedValueOnce({ status: "deleted" });

    render(<ReportsPage userId="usr-test" />);

    await waitFor(() => {
      expect(screen.getByText("Financial Outlier Analysis")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Delete Report");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteReport).toHaveBeenCalledWith("rep-1");
      expect(screen.queryByText("Financial Outlier Analysis")).not.toBeInTheDocument();
    });
  });
});
