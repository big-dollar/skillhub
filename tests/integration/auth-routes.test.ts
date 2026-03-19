// @vitest-environment node

import { describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/mock-login/route";
import { POST as logout } from "@/app/api/auth/mock-logout/route";
import { COOKIE_NAME } from "@/lib/auth/session";

describe("auth routes", () => {
  it("sets a mock session cookie on login", async () => {
    const response = await login();
    const body = await response.json();

    expect(body).toEqual({ success: true, uploaderName: "Demo Uploader" });
    expect(response.headers.get("set-cookie")).toContain(`${COOKIE_NAME}=`);
  });

  it("clears the session cookie on logout", async () => {
    const response = await logout();

    expect(await response.json()).toEqual({ success: true });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
