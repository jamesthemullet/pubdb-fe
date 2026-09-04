import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

// jsdom's Blob/File aren't recognized by the fetch implementation's FormData
// validation, so requests carrying real multipart bodies can't be built in this
// test environment. The route only calls request.formData() and headers.get(),
// so a minimal stand-in is enough to exercise its proxying behaviour.
function fakeMultipartRequest(formData: FormData, cookie?: string): Request {
	return {
		formData: () => Promise.resolve(formData),
		headers: {
			get: (name: string) => (name.toLowerCase() === "cookie" ? (cookie ?? null) : null),
		},
	} as unknown as Request;
}

describe("POST /api/pubs/[id]/image", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.API_URL = "https://api.example.com";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("forwards the multipart body and auth header to the upstream API and returns the result", async () => {
		const upstreamData = { id: "42", name: "The Harp", imageUrl: "https://cdn.example.com/42.jpg" };
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(upstreamData, 200));

		const formData = new FormData();
		formData.append("image", "fake-image-bytes");
		const request = fakeMultipartRequest(formData, "auth-token=user-token");

		const response = await POST(request, { params: Promise.resolve({ id: "42" }) });

		expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/pubs/42/image", {
			method: "POST",
			headers: { Authorization: "Bearer user-token" },
			body: formData,
		});
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(upstreamData);
	});

	it("returns the upstream error status and payload for a failed upload", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "Image too large" }, 413));

		const formData = new FormData();
		formData.append("image", "big-image-bytes");
		const request = fakeMultipartRequest(formData);

		const response = await POST(request, { params: Promise.resolve({ id: "42" }) });

		expect(response.status).toBe(413);
		await expect(response.json()).resolves.toEqual({ error: "Image too large" });
	});

	it("returns 500 with an error message when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

		const formData = new FormData();
		formData.append("image", "image-bytes");
		const request = fakeMultipartRequest(formData);

		const response = await POST(request, { params: Promise.resolve({ id: "42" }) });

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({ error: "Connection refused" });
	});
});
