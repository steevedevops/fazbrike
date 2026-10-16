// Login com Google/Apple via Firebase Authentication. O Firebase só autentica
// a identidade: o ID token vai para POST /api/auth/social, que devolve o JWT
// do Fazbrike (a sessão do site continua sendo o token próprio).
//
// Estes valores identificam o app Web "Fazbrike Site" no projeto `fazbrike` e
// são públicos por natureza (vão para o navegador); env só para trocar de projeto.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDfIApbH8ip8nuk0G1eGHEaLXDUROkcZpQ',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'fazbrike.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fazbrike',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:589782858782:web:78473d1815ac5a42ad420f',
};

export type SocialProvider = 'google' | 'apple';

export const SOCIAL_PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: 'Google',
  apple: 'Apple',
};

/** Erro que não deve virar alerta (ex.: pessoa fechou a janela do Google). */
export class SocialLoginCancelled extends Error {}

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/popup-blocked': 'O navegador bloqueou a janela de login. Libere pop-ups para este site e tente de novo.',
  'auth/operation-not-allowed': 'Este método de login ainda não está disponível.',
  'auth/unauthorized-domain': 'Login social não está liberado para este endereço.',
  'auth/account-exists-with-different-credential':
    'Este e-mail já usa outro método de login. Entre com o método usado antes.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet e tente de novo.',
};

/** Abre o popup do provedor e devolve o ID token do Firebase + nome exibido. */
export async function signInWithSocial(provider: SocialProvider): Promise<{ idToken: string; name: string }> {
  // Import dinâmico: o SDK só é baixado quando alguém clica no botão.
  const [{ getApps, initializeApp }, auth] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const firebaseAuth = auth.getAuth(app);
  firebaseAuth.languageCode = 'pt';

  let authProvider;
  if (provider === 'google') {
    const google = new auth.GoogleAuthProvider();
    google.setCustomParameters({ prompt: 'select_account' });
    authProvider = google;
  } else {
    const apple = new auth.OAuthProvider('apple.com');
    apple.addScope('email');
    apple.addScope('name');
    apple.setCustomParameters({ locale: 'pt_BR' });
    authProvider = apple;
  }

  try {
    const result = await auth.signInWithPopup(firebaseAuth, authProvider);
    const idToken = await result.user.getIdToken();
    const name = result.user.displayName ?? '';
    // A sessão do Firebase não é usada depois da troca pelo JWT do Fazbrike.
    await auth.signOut(firebaseAuth);
    return { idToken, name };
  } catch (error) {
    const code = (error as { code?: string })?.code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') {
      throw new SocialLoginCancelled();
    }
    throw new Error(FIREBASE_ERRORS[code] ?? `Não foi possível entrar com ${SOCIAL_PROVIDER_LABEL[provider]}.`);
  }
}
