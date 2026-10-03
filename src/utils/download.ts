/** Hands a downloaded file to the browser's save flow under `filename`. */
export const saveBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Revoked on the next tick: the click has started the download by then.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/** `customers-2026-10-03.xlsx` — the same name the API sends in Content-Disposition. */
export const exportFilename = (entity: string): string =>
  `${entity}-${new Date().toLocaleDateString('en-CA')}.xlsx`;
