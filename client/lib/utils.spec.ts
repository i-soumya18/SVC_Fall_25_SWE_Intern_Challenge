import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn function", () => {
  it("should merge classes correctly", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    expect(cn("base-class", isActive && "active-class")).toBe(
      "base-class active-class",
    );
  });

  it("should handle false and null conditions", () => {
    const isActive = false;
    expect(cn("base-class", isActive && "active-class", null)).toBe(
      "base-class",
    );
  });

  it("should merge tailwind classes properly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should work with object notation", () => {
    expect(cn("base", { conditional: true, "not-included": false })).toBe(
      "base conditional",
    );
  });

  it("should handle undefined values", () => {
    expect(cn("base", undefined, "valid")).toBe("base valid");
  });

  it("should handle empty strings", () => {
    expect(cn("", "valid", "")).toBe("valid");
  });

  it("should handle arrays of classes", () => {
    expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
  });

  it("should handle complex combinations", () => {
    const result = cn(
      "base",
      { "active": true, "disabled": false },
      ["extra1", "extra2"],
      undefined,
      "final"
    );
    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).not.toContain("disabled");
    expect(result).toContain("extra1");
    expect(result).toContain("extra2");
    expect(result).toContain("final");
  });

  it("should return empty string when no valid classes provided", () => {
    expect(cn(undefined, null, false, "")).toBe("");
  });

  it("should handle multiple conflicting Tailwind classes", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
    expect(cn("p-4", "p-2", "p-6")).toBe("p-6");
  });

  it("should preserve non-conflicting classes when merging", () => {
    const result = cn("hover:bg-blue-500", "focus:ring-2", "hover:bg-red-500");
    expect(result).toContain("focus:ring-2");
    expect(result).toContain("hover:bg-red-500");
    expect(result).not.toContain("hover:bg-blue-500");
  });
});
