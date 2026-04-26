import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import { clearCountriesCache } from "@/hooks/useCountries";

import AddPubPage from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function toUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function renderApprovedPageWithSubmitResult(
  submitResponse: Response | Error
): Promise<void> {
  localStorage.setItem("token", "test-token");

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = toUrl(input);

    if (url.endsWith("/auth/me")) {
      return jsonResponse({ email: "editor@example.com", approved: true });
    }

    if (url.includes("restcountries.com")) {
      return jsonResponse([{ name: { common: "United Kingdom" }, cca2: "GB" }]);
    }

    if (url.endsWith("/pubs") && init?.method === "POST") {
      if (submitResponse instanceof Error) {
        throw submitResponse;
      }

      return submitResponse;
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  });

  render(<AddPubPage />);
  await screen.findByText(/please fill out the form below/i);
}

function submitCurrentForm() {
  const submitButton = screen.getByRole("button", { name: "Add Pub" });
  const form = submitButton.closest("form");
  expect(form).not.toBeNull();
  fireEvent.submit(form as HTMLFormElement);
}

function fillAllInputs() {
  fireEvent.change(screen.getByLabelText(/^Name:/i), {
    target: { value: "The Harp" },
  });
  fireEvent.change(screen.getByLabelText(/^City:/i), {
    target: { value: "London" },
  });
  fireEvent.change(screen.getByLabelText(/^Country:/i), {
    target: { value: "GB" },
  });
  fireEvent.change(screen.getByLabelText(/^Address:/i), {
    target: { value: "47 Chandos Place" },
  });
  fireEvent.change(screen.getByLabelText(/^Postcode:/i), {
    target: { value: "WC2N 4HS" },
  });
  fireEvent.change(screen.getByLabelText(/^Latitude:/i), {
    target: { value: "51.5072" },
  });
  fireEvent.change(screen.getByLabelText(/^Latitude:/i), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText(/^Longitude:/i), {
    target: { value: "-0.1276" },
  });
  fireEvent.change(screen.getByLabelText(/^Longitude:/i), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText(/^Website:/i), {
    target: { value: "https://example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^Website:/i), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText(/^Description:/i), {
    target: { value: "A classic pub." },
  });
  fireEvent.change(screen.getByLabelText(/^Description:/i), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText(/^Image URL:/i), {
    target: { value: "https://example.com/pub.jpg" },
  });
  fireEvent.change(screen.getByLabelText(/^Image URL:/i), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText(/^Operator\/Owner:/i), {
    target: { value: "Pub Group" },
  });
  fireEvent.change(screen.getByLabelText(/^Operator\/Owner:/i), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText(/^Area:/i), {
    target: { value: "West End" },
  });
  fireEvent.change(screen.getByLabelText(/^Area:/i), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText(/^Phone:/i), {
    target: { value: "+44 20 0000 0000" },
  });
  fireEvent.change(screen.getByLabelText(/^Phone:/i), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText(/^Borough:/i), {
    target: { value: "Westminster" },
  });
  fireEvent.change(screen.getByLabelText(/^Borough:/i), {
    target: { value: "" },
  });
  fireEvent.change(
    screen.getByLabelText(/Paste opening hours from Google/i),
    { target: { value: "Monday\n9 am–11 pm\nTuesday\n9 am–11 pm" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /Apply from Google/i }));
}

describe("AddPubPage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    clearCountriesCache();
    vi.restoreAllMocks();
    pushMock.mockReset();
    localStorage.clear();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
  });

  afterEach(() => {
    clearCountriesCache();
    process.env = originalEnv;
  });

  it("shows login prompt when no user is authenticated", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = toUrl(input);
      if (url.includes("restcountries.com")) {
        return jsonResponse([
          { name: { common: "United Kingdom" }, cca2: "GB" },
        ]);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    render(<AddPubPage />);

    expect(
      await screen.findByText("You must be logged in to add a pub.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Register or Login" })
    ).toHaveAttribute("href", "/register");
  });

  it("shows approval guidance and includes the user email in the mailto link", async () => {
    localStorage.setItem("token", "test-token");

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = toUrl(input);

      if (url.endsWith("/auth/me")) {
        return jsonResponse({ email: "alice@example.com", approved: false });
      }

      if (url.includes("restcountries.com")) {
        return jsonResponse([{ name: { common: "France" }, cca2: "FR" }]);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    render(<AddPubPage />);

    expect(
      await screen.findByText(/your account is not approved for editing/i)
    ).toBeInTheDocument();

    const approvalLink = screen.getByRole("link", {
      name: "Request approval by email",
    });

    expect(approvalLink).toHaveAttribute("href");
    expect(approvalLink.getAttribute("href")).toContain(
      encodeURIComponent("Account email: alice@example.com")
    );
  });

  it("submits the form and redirects to the created pub", async () => {
    await renderApprovedPageWithSubmitResult(
      jsonResponse({ id: "pub-123" }, 201)
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    fillAllInputs();
    submitCurrentForm();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:4000/pubs",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    expect(
      await screen.findByText("Pub added successfully!")
    ).toBeInTheDocument();

    await waitFor(
      () => {
        expect(pushMock).toHaveBeenCalledWith("/pubs/pub-123");
      },
      { timeout: 2000 }
    );
  });

  it("submits without Authorization header when token is missing at submit time", async () => {
    localStorage.setItem("token", "test-token");

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) => {
        const url = toUrl(input);

        if (url.endsWith("/auth/me")) {
          return jsonResponse({ email: "editor@example.com", approved: true });
        }

        if (url.includes("restcountries.com")) {
          return jsonResponse([
            { name: { common: "United Kingdom" }, cca2: "GB" },
          ]);
        }

        if (url.endsWith("/pubs") && init?.method === "POST") {
          return jsonResponse({ id: "pub-no-auth" }, 201);
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      });

    render(<AddPubPage />);
    await screen.findByText(/please fill out the form below/i);

    localStorage.removeItem("token");
    submitCurrentForm();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:4000/pubs",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });
  });

  it("shows existing-pub action and routes to edit page on conflict", async () => {
    await renderApprovedPageWithSubmitResult(
      jsonResponse({ id: "existing-999" }, 409)
    );
    submitCurrentForm();

    const openExistingButton = await screen.findByRole("button", {
      name: "Open existing pub to edit",
    });

    fireEvent.click(openExistingButton);

    expect(pushMock).toHaveBeenCalledWith("/pubs/existing-999");
    expect(screen.getByText("Pub already exists")).toBeInTheDocument();
  });

  it("renders form and field validation messages when API returns structured validation errors", async () => {
    await renderApprovedPageWithSubmitResult(
      jsonResponse(
        {
          error: {
            formErrors: ["Validation failed"],
            fieldErrors: {
              name: ["Name is required"],
              country: ["Country is required"],
              address: ["Address is required"],
              postcode: ["Postcode is required"],
              openingHours: ["Opening hours format is invalid"],
              phone: ["Phone is invalid"],
              borough: ["Borough is too long"],
              operator: ["Operator is invalid"],
              area: ["Area is invalid"],
              description: ["Description is invalid"],
              imageUrl: ["Image URL is invalid"],
              website: ["Website is invalid"],
              chainName: ["Chain name is invalid"],
              lng: ["Longitude is invalid"],
              lat: ["Latitude is invalid"],
            },
          },
        },
        400
      )
    );

    fillAllInputs();
    submitCurrentForm();

    expect(await screen.findByText("Validation failed")).toBeInTheDocument();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Country is required")).toBeInTheDocument();
    expect(screen.getByText("Address is required")).toBeInTheDocument();
    expect(screen.getByText("Postcode is required")).toBeInTheDocument();
    expect(
      screen.getByText("Opening hours format is invalid")
    ).toBeInTheDocument();
    expect(screen.getByText("Phone is invalid")).toBeInTheDocument();
    expect(screen.getByText("Borough is too long")).toBeInTheDocument();
    expect(screen.getByText("Operator is invalid")).toBeInTheDocument();
    expect(screen.getByText("Area is invalid")).toBeInTheDocument();
    expect(screen.getByText("Description is invalid")).toBeInTheDocument();
    expect(screen.getByText("Image URL is invalid")).toBeInTheDocument();
    expect(screen.getByText("Website is invalid")).toBeInTheDocument();
    expect(screen.getByText("Chain name is invalid")).toBeInTheDocument();
    expect(screen.getByText("Longitude is invalid")).toBeInTheDocument();
    expect(screen.getByText("Latitude is invalid")).toBeInTheDocument();
    expect(screen.queryByText("Unknown error")).not.toBeInTheDocument();
  });

  it("uses fallback string errors from the API payload", async () => {
    await renderApprovedPageWithSubmitResult(
      jsonResponse({ error: "Backend says no" }, 400)
    );

    submitCurrentForm();

    expect(await screen.findByText("Backend says no")).toBeInTheDocument();
    expect(screen.queryByText("Unknown error")).not.toBeInTheDocument();
  });

  it("parses validation errors when API returns an errors object", async () => {
    await renderApprovedPageWithSubmitResult(
      jsonResponse(
        {
          errors: {
            formErrors: ["Errors envelope form message"],
            fieldErrors: {
              city: ["City must be valid"],
            },
          },
        },
        400
      )
    );

    submitCurrentForm();

    expect(
      await screen.findByText("Errors envelope form message")
    ).toBeInTheDocument();
    expect(screen.getByText("City must be valid")).toBeInTheDocument();
    expect(screen.queryByText("Unknown error")).not.toBeInTheDocument();
  });

  it("shows Unknown error when API returns no parseable validation errors", async () => {
    await renderApprovedPageWithSubmitResult(jsonResponse({}, 400));

    submitCurrentForm();

    expect(await screen.findByText("Unknown error")).toBeInTheDocument();
  });

  it("shows Unknown error when API returns a primitive error payload", async () => {
    await renderApprovedPageWithSubmitResult(jsonResponse("bad-request", 400));

    submitCurrentForm();

    expect(await screen.findByText("Unknown error")).toBeInTheDocument();
  });

  it("shows Network error when submit request throws", async () => {
    await renderApprovedPageWithSubmitResult(new Error("request failed"));

    submitCurrentForm();

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("shows login prompt when auth check returns non-OK status", async () => {
    localStorage.setItem("token", "test-token");

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = toUrl(input);

      if (url.endsWith("/auth/me")) {
        return jsonResponse({ error: "unauthorized" }, 401);
      }

      if (url.includes("restcountries.com")) {
        return jsonResponse([
          { name: { common: "United Kingdom" }, cca2: "GB" },
        ]);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    render(<AddPubPage />);

    expect(
      await screen.findByText("You must be logged in to add a pub.")
    ).toBeInTheDocument();
  });

  it("shows login prompt when auth check throws", async () => {
    localStorage.setItem("token", "test-token");

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = toUrl(input);

      if (url.endsWith("/auth/me")) {
        throw new Error("auth down");
      }

      if (url.includes("restcountries.com")) {
        return jsonResponse([
          { name: { common: "United Kingdom" }, cca2: "GB" },
        ]);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    render(<AddPubPage />);

    expect(
      await screen.findByText("You must be logged in to add a pub.")
    ).toBeInTheDocument();
  });

  it("shows an error message and disables the country selector when country fetch fails", async () => {
    localStorage.setItem("token", "test-token");

    vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = toUrl(input);

      if (url.endsWith("/auth/me")) {
        return jsonResponse({ email: "editor@example.com", approved: true });
      }

      if (url.includes("restcountries.com")) {
        return jsonResponse({ error: "rate limited" }, 500);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    render(<AddPubPage />);

    await screen.findByText(/please fill out the form below/i);
    expect(
      screen.getByRole("option", { name: "Failed to load countries" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("alert")
    ).toHaveTextContent("Failed to fetch countries: 500");
  });

  it("shows Loading countries placeholder while countries are still fetching", async () => {
    localStorage.setItem("token", "test-token");

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = toUrl(input);

      if (url.endsWith("/auth/me")) {
        return jsonResponse({ email: "editor@example.com", approved: true });
      }

      if (url.includes("restcountries.com")) {
        return new Promise<Response>(() => {
          // Keep countries request pending to assert loading placeholder state.
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    render(<AddPubPage />);

    await screen.findByText(/please fill out the form below/i);
    expect(
      await screen.findByRole("option", { name: "Loading countries..." })
    ).toBeInTheDocument();
  });

  it("submits cleared chainName as undefined and includes amenity selections", async () => {
    localStorage.setItem("token", "test-token");

    let submittedBody: Record<string, unknown> | null = null;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = toUrl(input);

      if (url.endsWith("/auth/me")) {
        return jsonResponse({ email: "editor@example.com", approved: true });
      }

      if (url.includes("restcountries.com")) {
        return jsonResponse([
          { name: { common: "United Kingdom" }, cca2: "GB" },
        ]);
      }

      if (url.endsWith("/pubs") && init?.method === "POST") {
        submittedBody = JSON.parse(String(init.body));
        return jsonResponse({ id: "pub-amenities" }, 201);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    render(<AddPubPage />);
    await screen.findByText(/please fill out the form below/i);

    fireEvent.change(screen.getByLabelText(/^Chain name:/i), {
      target: { value: "Fuller's" },
    });
    fireEvent.change(screen.getByLabelText(/^Chain name:/i), {
      target: { value: "" },
    });

    for (const amenity of PUB_AMENITY_FIELDS) {
      const checkbox = screen.getByRole("checkbox", { name: amenity.label });
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    }

    submitCurrentForm();

    await waitFor(() => {
      expect(submittedBody).not.toBeNull();
    });

    if (submittedBody === null) {
      throw new Error("Expected submit payload to be captured");
    }

    const submitted = submittedBody as Record<string, unknown>;

    expect(submitted.chainName).toBeUndefined();
    for (const amenity of PUB_AMENITY_FIELDS) {
      expect(submitted[amenity.key]).toBe(true);
    }
  });
});
