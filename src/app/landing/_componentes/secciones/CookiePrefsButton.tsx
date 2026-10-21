'use client';

import { openCookieSettings } from '../../_lib/cookies';

export function CookiePrefsButton() {
  return (
    <button type="button" className="ag-cookie-reopen" onClick={openCookieSettings}>
      Cookies
    </button>
  );
}
