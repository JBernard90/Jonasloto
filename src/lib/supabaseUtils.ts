import { supabase } from './supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
  }
}

export async function handleSupabaseError(error: any, operationType: OperationType, path: string | null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const errInfo: SupabaseErrorInfo = {
      error: error?.message || String(error),
      authInfo: {
        userId: user?.id,
        email: user?.email,
      },
      operationType,
      path
    };
    
    console.error('🔴 Supabase Error:', JSON.stringify(errInfo, null, 2));
    
    // Show user-friendly error message
    const userMessage = getUserFriendlyMessage(operationType, error);
    alert(userMessage);
    
  } catch (logError) {
    console.error('Error logging failed:', logError);
  }
}

function getUserFriendlyMessage(operationType: OperationType, error: any): string {
  const messages: Record<OperationType, string> = {
    [OperationType.CREATE]: 'Erreur lors de la création. Veuillez réessayer.',
    [OperationType.UPDATE]: 'Erreur lors de la mise à jour. Veuillez réessayer.',
    [OperationType.DELETE]: 'Erreur lors de la suppression. Veuillez réessayer.',
    [OperationType.LIST]: 'Erreur lors du chargement des données. Veuillez réessayer.',
    [OperationType.GET]: 'Erreur lors de la lecture des données. Veuillez réessayer.',
    [OperationType.WRITE]: 'Erreur lors de l\'enregistrement. Veuillez réessayer.',
  };

  if (error?.message?.includes('auth')) {
    return 'Erreur d\'authentification. Veuillez vous reconnecter.';
  }

  if (error?.message?.includes('network')) {
    return 'Erreur de connexion. Vérifiez votre internet.';
  }

  return messages[operationType];
}
