/** The Google OAuth client id, injected at build time.
 *
 * Empty whenever the environment was never configured — a fresh clone with no
 * `frontend/.env`, or a build that forgot the variable. Google's own script throws
 * from deep inside its token client when handed an empty `client_id`, and that throw
 * escapes as a render error that unmounts the whole page, so every caller checks
 * `googleAuthConfigured` before mounting a Google button.
 */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();

export const googleAuthConfigured = GOOGLE_CLIENT_ID.length > 0;
