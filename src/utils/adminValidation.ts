import { z } from 'zod';

/**
 * Validation for the platform admin console.
 *
 * **NOT MIRRORED, deliberately.** `utils/validation.ts` is a hand-maintained
 * duplicate of `mobile/src/utils/validation.ts` and is listed in the
 * `/mirror-check` table. Putting an admin-only schema there would mean either
 * shipping mobile a zod schema for a screen it will never have, or leaving
 * `/mirror-check` permanently dirty — and a mirror check that is expected to
 * be dirty stops catching the drift it exists to catch.
 *
 * There is a substantive difference too: `validation.ts` exists to mirror the
 * backend's Mongoose validators for rules *both clients* enforce. Nothing here
 * has a mobile counterpart, and it constrains a collection no client's users
 * ever touch.
 */

/**
 * Mirrors `backend/utils/semver.ts`, in the same spirit as `validation.ts`
 * naming the Mongoose file each of its rules came from. If you change one,
 * change both — a client rule looser than the server's just moves the error to
 * a round trip, and one that is stricter rejects policies the API would accept.
 */
const parseVersion = (v: string): number[] | null => {
  const m = /^v?(\d{1,6}(?:\.\d{1,6}){0,3})(?:[-+].*)?$/.exec(v.trim());
  return m ? m[1].split('.').map(Number) : null;
};

const compareVersions = (a: string, b: string): -1 | 0 | 1 | null => {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
};

const version = z.string().trim().refine(v => parseVersion(v) !== null, 'Use a version like 1.2.3');

export const appReleaseSchema = z
  .object({
    platform: z.string().min(1),
    latestVersion: version,
    /**
     * Blank must stay typeable. It is the "block nobody" value and therefore
     * the only way to undo a bad policy from this screen — a required field
     * here is a policy you cannot reverse.
     */
    minSupportedVersion: z.union([z.literal(''), version]),
    storeUrl: z
      .union([z.literal(''), z.string().trim().url('Enter a valid URL')])
      .refine(v => v === '' || v.startsWith('https://'), 'Store URL must start with https://'),
    updateMessage: z.string().trim().max(300, 'Cannot exceed 300 characters'),
    blockingMessage: z.string().trim().max(300, 'Cannot exceed 300 characters'),
    enabled: z.boolean(),
  })
  /**
   * The rule the whole feature turns on. A minimum above the latest available
   * version blocks 100% of users instantly — including anyone already on the
   * newest build, who then has nothing to update to.
   *
   * The server enforces this too, and must: the API is callable without this
   * UI. This copy exists so the admin sees it under the field rather than as a
   * toast after a round trip.
   */
  .refine(
    v => v.minSupportedVersion === '' || compareVersions(v.minSupportedVersion, v.latestVersion) !== 1,
    {
      path: ['minSupportedVersion'],
      message: 'Cannot be newer than the latest version — that would block every user, including anyone already on the newest build.',
    }
  );

export type AppReleaseFormValues = z.infer<typeof appReleaseSchema>;

/** Exported for the page's live consequence line and the raise-confirm. */
export { compareVersions };
