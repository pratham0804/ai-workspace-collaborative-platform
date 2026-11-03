import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { getDocsAccessToken, getDocsUser } from "../auth/currentUser";

export const COLLAB_WS_URL = "ws://localhost:5001";

export type CollabStatus = "connecting" | "connected" | "disconnected";

export interface PresenceUser {
  clientId: number;
  name: string;
  color: string;
}

interface Props {
  documentId: number;
  generation: number;
  onStatus: (status: CollabStatus) => void;
  onSynced: (synced: boolean) => void;
  onUsers: (users: PresenceUser[]) => void;
  onAuthFailed: (reason: string) => void;
  onRestored: (generation: number) => void;
}

function collaborationName(documentId: number, generation: number) {
  return `document:${documentId}:g${generation}`;
}

function presenceFromStates(
  states: Record<string, unknown>[],
  localClientId: number | undefined
): PresenceUser[] {
  const seen = new Map<number, PresenceUser>();

  for (const state of states) {
    const clientId = Number(state.clientId);
    if (!Number.isInteger(clientId) || clientId === localClientId) {
      continue;
    }

    const user = (state.user ?? state) as {
      name?: string;
      color?: string;
    };

    seen.set(clientId, {
      clientId,
      name: user.name || `User ${clientId}`,
      color: user.color || "#6554C0",
    });
  }

  return [...seen.values()];
}

export default function CollaborativeEditor({
  documentId,
  generation,
  onStatus,
  onSynced,
  onUsers,
  onAuthFailed,
  onRestored,
}: Props) {
  const user = useMemo(() => getDocsUser(), []);
  const [session, setSession] = useState<{
    ydoc: Y.Doc;
    provider: HocuspocusProvider;
  } | null>(null);

  const onStatusRef = useRef(onStatus);
  const onSyncedRef = useRef(onSynced);
  const onUsersRef = useRef(onUsers);
  const onAuthFailedRef = useRef(onAuthFailed);
  const onRestoredRef = useRef(onRestored);

  onStatusRef.current = onStatus;
  onSyncedRef.current = onSynced;
  onUsersRef.current = onUsers;
  onAuthFailedRef.current = onAuthFailed;
  onRestoredRef.current = onRestored;

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: COLLAB_WS_URL,
      name: collaborationName(documentId, generation),
      document: ydoc,
      token: () => getDocsAccessToken() ?? "",
      onStatus: ({ status }) => {
        onStatusRef.current(status);
      },
      onSynced: ({ state }) => {
        onSyncedRef.current(state);
      },
      onAuthenticationFailed: ({ reason }) => {
        onAuthFailedRef.current(reason);
      },
      onStateless: ({ payload }) => {
        try {
          const message = JSON.parse(payload) as {
            type?: string;
            generation?: number;
          };
          if (message.type === "document:restored") {
            onRestoredRef.current(Number(message.generation) || generation + 1);
          }
          if (message.type === "document:deleted") {
            onAuthFailedRef.current("Document deleted");
          }
        } catch {
          // Ignore non-JSON payloads.
        }
      },
      onAwarenessUpdate: ({ states }) => {
        onUsersRef.current(
          presenceFromStates(
            states as Record<string, unknown>[],
            provider.awareness?.clientID
          )
        );
      },
    });

    setSession({ ydoc, provider });
    onStatusRef.current("connecting");

    return () => {
      provider.awareness?.setLocalState(null);
      provider.destroy();
      ydoc.destroy();
      setSession(null);
      onUsersRef.current([]);
      onSyncedRef.current(false);
      onStatusRef.current("disconnected");
    };
  }, [documentId, generation]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          undoRedo: false,
        }),
        Link.configure({ openOnClick: false }),
        Placeholder.configure({
          placeholder: "Start writing with collaborators...",
        }),
        ...(session
          ? [
              Collaboration.configure({
                document: session.ydoc,
              }),
              ...(user
                ? [
                    CollaborationCaret.configure({
                      provider: session.provider,
                      user: {
                        id: user.id,
                        name: user.name,
                        color: user.color,
                      },
                    }),
                  ]
                : []),
            ]
          : []),
      ],
      editable: true,
    },
    [session, user]
  );

  if (!editor || !session) {
    return <p className="muted">Loading collaborative editor...</p>;
  }

  return (
    <div className="editor-wrap">
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          Code
        </button>
        <button
          type="button"
          onClick={() => {
            const href = window.prompt("Link URL");
            if (!href) return;
            editor.chain().focus().setLink({ href }).run();
          }}
        >
          Link
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
