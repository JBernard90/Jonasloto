export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | undefined;
    emailVerified: boolean | undefined;
  }
}

export function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: undefined, // Will be filled by the caller if needed
      email: undefined,
      emailVerified: undefined,
    },
    operationType,
    path
  }
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  // You can add more logic here, like showing a toast notification
}
