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

export const ALL_ARTICLES_QUERY = `
query AllArticles {
  articles: allArticles {
    slugs: _allSlugLocales {
      locale
      slug: value
    }
  }
}
`;
