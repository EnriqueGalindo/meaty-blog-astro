// Site-wide constants.
//
// The real site identity now lives in the typed site config (MEAT-43); these are
// thin re-exports kept so existing `../consts` imports keep working.
import { site } from './config/site';

export const SITE_TITLE = site.title;
export const SITE_DESCRIPTION = site.description;
