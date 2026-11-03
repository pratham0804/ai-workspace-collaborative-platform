import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { boardRoom, parsePositiveInt, workspaceRoom } from "./rooms.js";

describe("socket rooms", () => {
  it("builds fixed room names", () => {
    assert.equal(workspaceRoom(1), "workspace:1");
    assert.equal(boardRoom(4), "board:4");
  });

  it("rejects invalid ids", () => {
    assert.equal(parsePositiveInt("abc"), null);
    assert.equal(parsePositiveInt(1.5), null);
    assert.equal(parsePositiveInt(0), null);
    assert.equal(parsePositiveInt(-2), null);
    assert.equal(parsePositiveInt(3), 3);
  });
});
