export interface MockNodeFsCallResult {
  isError: boolean;
  result: unknown;
  methodsResult: Record<string, unknown>;
}
