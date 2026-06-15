/**
 * Ask the server to refresh the public catalog after an admin edit. Best
 * effort: failures are swallowed because time-based revalidation is the
 * fallback.
 */
export async function revalidateCatalog(
  token: string,
  payload: { categorySlug?: string; productSlug?: string } = {}
): Promise<void> {
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch {
    // Non-fatal: ISR will refresh the catalog on its own interval.
  }
}
