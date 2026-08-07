import { useEffect, useRef, useState } from 'react';
import { loadFacebookSdk, whenFbReady, getFacebookLoginStatus, type FBStatusResponse } from '@/lib/facebookSdk';

declare global {
  interface Window {
    checkLoginState?: () => void;
  }
}

interface Props {
  /** Config ID do Facebook Login for Business (opcional). */
  configId?: string;
  scope?: string;
  onStatusChange?: (response: FBStatusResponse) => void;
}

/**
 * Botão oficial <fb:login-button> do Facebook.
 * Usa o callback onlogin="checkLoginState()" que consulta FB.getLoginStatus().
 */
export const FacebookLoginButton = ({ configId, scope = 'public_profile,pages_show_list', onStatusChange }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    window.checkLoginState = () => {
      getFacebookLoginStatus().then((response) => onStatusChange?.(response));
    };

    loadFacebookSdk();
    whenFbReady().then((ok) => {
      if (cancelled || !ok) return;
      setAvailable(true);
      // Renderiza o XFBML do botão inserido no DOM
      if (ref.current) (window as any).FB?.XFBML?.parse(ref.current);
      getFacebookLoginStatus().then((response) => onStatusChange?.(response));
    });

    return () => {
      cancelled = true;
      delete window.checkLoginState;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!available) return null;

  return (
    <div ref={ref}>
      <div
        className="fb-login-button"
        data-width=""
        data-size="large"
        data-button-type="continue_with"
        data-layout="rounded"
        data-auto-logout-link="false"
        data-use-continue-as="true"
        data-scope={scope}
        {...(configId ? { 'data-config-id': configId } : {})}
        data-onlogin="checkLoginState();"
      />
    </div>
  );
};
