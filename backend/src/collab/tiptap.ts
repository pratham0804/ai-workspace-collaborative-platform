import * as Y from "yjs";
import { TiptapTransformer } from "@hocuspocus/transformer";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export const EMPTY_DOC_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const transformer = TiptapTransformer.extensions([
  StarterKit.configure({ undoRedo: false }),
  Link.configure({ openOnClick: false }),
]);

export function tiptapJsonToYdoc(content: unknown) {
  return transformer.toYdoc(content ?? EMPTY_DOC_CONTENT, "default");
}

export function ydocToTiptapJson(ydoc: Y.Doc) {
  const raw = transformer.fromYdoc(ydoc, "default");

  if (
    raw &&
    typeof raw === "object" &&
    "type" in raw &&
    (raw as { type: unknown }).type === "doc"
  ) {
    return raw;
  }

  if (
    raw &&
    typeof raw === "object" &&
    "default" in raw &&
    (raw as { default: unknown }).default
  ) {
    return (raw as { default: unknown }).default;
  }

  return EMPTY_DOC_CONTENT;
}

export function yjsStateToTiptapJson(state: Uint8Array) {
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, state);
  const json = ydocToTiptapJson(ydoc);
  ydoc.destroy();
  return json;
}

export function encodeTiptapJson(content: unknown) {
  const ydoc = tiptapJsonToYdoc(content);
  const state = Y.encodeStateAsUpdate(ydoc);
  ydoc.destroy();
  return state;
}
