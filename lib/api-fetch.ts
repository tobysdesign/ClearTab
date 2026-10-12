import { authorizedFetch } from "@/lib/extension/auth";
import { API_BASE_URL, IS_EXTENSION } from "@/lib/platform";

/*
 * fetch() for our own API routes: apiFetch("/api/tasks", init).
 *
 * On the web this is plain fetch (same origin, session cookie). In the Chrome extension the
 * page lives on chrome-extension://<id>, so the request goes to the ClearTab server with the
 * extension's bearer token. The manifest's host permission for that server is what lets it
 * through without CORS.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return IS_EXTENSION ? authorizedFetch(`${API_BASE_URL}${path}`, init) : fetch(path, init);
}
