/** Reject truncated detail or mismatched aggregate sets before changing UI state. */
export function assertCompleteCRMResponse(result: any, withDetail = false): void {
  if (!result.success || result.complete !== true ||
      !Number.isSafeInteger(result.totalRows) || result.totalRows < 0 ||
      result.stats?.totalRecords !== result.totalRows ||
      result.fixedStats?.totalRecords + result.flexibleStats?.totalRecords !== result.totalRows ||
      (withDetail && (!Array.isArray(result.rawRows) || result.rawRows.length !== result.totalRows))) {
    throw new Error(result.message || 'Incomplete CRM response; previous data has been retained');
  }
}