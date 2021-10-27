export const MENU_QUERY = `
  query Menu($locale: SiteLocale) {
    menu(locale: $locale) {
      navContent {
        label
        url
      }
    }
  }
`;
