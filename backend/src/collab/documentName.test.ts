import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  collaborationDocumentName,
  parseCollaborationDocumentName,
} from "./documentName.js";

describe("collaboration document names", () => {
  it("round-trips document id and generation", () => {
    const name = collaborationDocumentName(42, 3);
    assert.equal(name, "document:42:g3");
    assert.deepEqual(parseCollaborationDocumentName(name), {
      documentId: 42,
      generation: 3,
    });
  });

  it("rejects names that omit generation", () => {
    assert.equal(parseCollaborationDocumentName("document:42"), null);
  });

  it("rejects non-numeric identifiers", () => {
    assert.equal(parseCollaborationDocumentName("document:abc:g1"), null);
  });
});
