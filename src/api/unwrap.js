/** Unwrap FastAPI ApiResponse envelope: { success, message, data }. */
export function unwrapApiData(response) {
  const envelope = response?.data;
  if (envelope && typeof envelope === 'object' && 'data' in envelope) {
    return envelope.data;
  }
  return envelope;
}
