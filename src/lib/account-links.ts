export const ACCOUNT_LINKS_KEY = "asylumhub:account-links";

export type AccountLinks = {
  discord: boolean;
  psn: boolean;
  xbox: boolean;
};

export function readAccountLinks(): AccountLinks {
  if (typeof window === "undefined") return { discord: false, psn: false, xbox: false };
  try {
    const value = JSON.parse(window.localStorage.getItem(ACCOUNT_LINKS_KEY) ?? "null") as Partial<AccountLinks> | null;
    return {
      discord: value?.discord === true,
      psn: value?.psn === true,
      xbox: value?.xbox === true,
    };
  } catch {
    return { discord: false, psn: false, xbox: false };
  }
}

export function accountLinksComplete(links: AccountLinks) {
  return links.discord && (links.psn || links.xbox);
}