import { describe, expect, it } from "vitest";
import { adminListQuery, parseAdminListParams } from "./list-params";

describe("parseAdminListParams", () => {
  it("lee búsqueda, estado, orden y página (base 1 en la URL, base 0 para el backend)", () => {
    expect(parseAdminListParams({ q: " playa ", status: "PUBLISHED", sort: "title,asc", page: "3" })).toEqual({
      q: "playa",
      status: "PUBLISHED",
      sort: "title,asc",
      page: 2,
    });
  });

  it("ignora valores inválidos en vez de romper la página", () => {
    expect(parseAdminListParams({ status: "FOO", page: "-4", q: "   " })).toEqual({
      q: undefined,
      status: undefined,
      sort: undefined,
      page: 0,
    });
    expect(parseAdminListParams({ page: "abc" }).page).toBe(0);
  });
});

describe("adminListQuery", () => {
  it("solo manda lo que tiene valor", () => {
    expect(adminListQuery({ page: 0 })).toBe("page=0&size=20");
    expect(adminListQuery({ q: "café", status: "DRAFT", sort: "createdAt,desc", page: 1 }, 50)).toBe(
      "q=caf%C3%A9&status=DRAFT&sort=createdAt%2Cdesc&page=1&size=50",
    );
  });
});
