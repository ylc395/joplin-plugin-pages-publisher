import type fsExtra from 'fs-extra';
export interface MockNodeFsCallResult {
  isError: boolean;
  result: unknown;
  methodsResult: Record<string, unknown>;
}

export interface FsWorkerCallResponse {
  event: 'fsCallResponse';
  payload: {
    isError: boolean;
    callId: string;
    result: unknown;
    methodsResult: Record<string, unknown>;
  };
}

export interface FsWorkerCallRequest {
  event: 'fsCall';
  payload: {
    callId: string;
    funcName: keyof typeof fsExtra;
    args: unknown[];
  };
}
