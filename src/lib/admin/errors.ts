export function friendlyError(error: { code?: string; message?: string } | null): Error {
  if (error?.code === "23505") {
    return new Error("A record with a similar name or web address already exists. Adjust it and try again.");
  }
  if (error?.code === "23503") {
    return new Error("This record is still linked to other content and cannot be changed that way.");
  }
  return new Error("We could not save your changes. Please review the form and try again.");
}
