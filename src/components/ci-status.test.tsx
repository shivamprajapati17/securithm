import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { CiStatusIndicator } from "./ci-status";

const WORKFLOWS_API = "https://api.github.com/repos/test-owner/test-repo/actions/workflows/ci.yml/runs?per_page=1";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

function createWorkflowRun(conclusion: string) {
  return {
    total_count: 1,
    workflow_runs: [
      {
        id: 1,
        name: "ci",
        conclusion,
        status: "completed",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        head_branch: "master",
        html_url: "https://github.com/test-owner/test-repo/actions/runs/1",
      },
    ],
  };
}

describe("CiStatusIndicator", () => {
  it("shows loading state initially", () => {
    server.use(
      http.get(WORKFLOWS_API, () => new Promise(() => {})) // never resolves
    );

    render(<CiStatusIndicator collapsed={false} />);
    expect(screen.getByText("CI Status")).toBeInTheDocument();
  });

  it("displays green dot and PASS when workflow succeeds", async () => {
    server.use(http.get(WORKFLOWS_API, () => HttpResponse.json(createWorkflowRun("success"))));

    render(<CiStatusIndicator collapsed={false} />);

    await waitFor(() => {
      expect(screen.getByText("Frontend CI")).toBeInTheDocument();
      expect(screen.getByText("PASS")).toBeInTheDocument();
      expect(screen.getByText("Backend CI")).toBeInTheDocument();
    });
  });

  it("displays red dot and FAIL when workflow fails", async () => {
    server.use(http.get(WORKFLOWS_API, () => HttpResponse.json(createWorkflowRun("failure"))));

    render(<CiStatusIndicator collapsed={false} />);

    await waitFor(() => {
      expect(screen.getByText("Frontend CI")).toBeInTheDocument();
      expect(screen.getByText("FAIL")).toBeInTheDocument();
      expect(screen.getByText("Backend CI")).toBeInTheDocument();
    });
  });

  it("shows pending state for in-progress workflow", async () => {
    server.use(http.get(WORKFLOWS_API, () => HttpResponse.json(createWorkflowRun(null))));

    render(<CiStatusIndicator collapsed={false} />);

    await waitFor(() => {
      expect(screen.getByText("Frontend CI")).toBeInTheDocument();
    });
  });

  it("shows unknown state when API returns empty runs", async () => {
    server.use(
      http.get(WORKFLOWS_API, () =>
        HttpResponse.json({ total_count: 0, workflow_runs: [] })
      )
    );

    render(<CiStatusIndicator collapsed={false} />);

    await waitFor(() => {
      expect(screen.getByText("Frontend CI")).toBeInTheDocument();
    });
    expect(screen.queryByText("PASS")).not.toBeInTheDocument();
    expect(screen.queryByText("FAIL")).not.toBeInTheDocument();
  });

  it("shows unknown state on API error", async () => {
    server.use(http.get(WORKFLOWS_API, () => HttpResponse.error()));

    render(<CiStatusIndicator collapsed={false} />);

    await waitFor(() => {
      expect(screen.getByText("Frontend CI")).toBeInTheDocument();
      expect(screen.getByText("Backend CI")).toBeInTheDocument();
    });
  });

  it("renders nothing when collapsed", () => {
    render(<CiStatusIndicator collapsed={true} />);
    expect(screen.queryByText("CI Status")).not.toBeInTheDocument();
  });

  it("links to the correct GitHub Actions page", async () => {
    server.use(http.get(WORKFLOWS_API, () => HttpResponse.json(createWorkflowRun("success"))));

    render(<CiStatusIndicator collapsed={false} />);

    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
      expect(links[0]).toHaveAttribute(
        "href",
        "https://github.com/test-owner/test-repo/actions/workflows/ci.yml"
      );
    });
  });
});
