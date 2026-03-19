import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the current starter copy", async () => {
    render(await HomePage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", {
        name: /为你的下一个项目找到合适的 技能/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("搜索 patterns、技能 或标签..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "点赞最多" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /framer motion animations/i })).toBeInTheDocument();
  });
});
