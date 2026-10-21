const LOGIN_FORM_DRAFT_KEY = 'sg_login_form_draft_v1';

export type LoginFormDraft = {
  directLoginId?: string;
  directBirthDisplay?: string;
  directBirthIso?: string | null;
  lookupId?: string;
};

export function loadLoginFormDraft(): LoginFormDraft {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOGIN_FORM_DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LoginFormDraft;
    return {
      directLoginId: typeof parsed.directLoginId === 'string' ? parsed.directLoginId : '',
      directBirthDisplay: typeof parsed.directBirthDisplay === 'string' ? parsed.directBirthDisplay : '',
      directBirthIso:
        typeof parsed.directBirthIso === 'string' || parsed.directBirthIso === null
          ? parsed.directBirthIso
          : null,
      lookupId: typeof parsed.lookupId === 'string' ? parsed.lookupId : '',
    };
  } catch {
    return {};
  }
}

export function saveLoginFormDraft(draft: LoginFormDraft): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: LoginFormDraft = {
      directLoginId: draft.directLoginId?.trim() ?? '',
      directBirthDisplay: draft.directBirthDisplay?.trim() ?? '',
      directBirthIso: draft.directBirthIso ?? null,
      lookupId: draft.lookupId?.trim() ?? '',
    };
    const hasData =
      !!payload.directLoginId ||
      !!payload.directBirthDisplay ||
      !!payload.lookupId;
    if (!hasData) {
      localStorage.removeItem(LOGIN_FORM_DRAFT_KEY);
      return;
    }
    localStorage.setItem(LOGIN_FORM_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}
