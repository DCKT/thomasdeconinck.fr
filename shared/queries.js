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

export const MORE_ARTICLES_QUERY = `
query MoreArticles($start: IntType, $end: IntType, $locale: SiteLocale) {
  articles: allArticles(skip:$start, first: $end, locale: $locale, orderBy: _firstPublishedAt_DESC) {
    title
    description
    slug
    _publishedAt
    splash {
      responsiveImage(imgixParams: {fm: jpg, w: 450, h: 500, fit: crop }) {
       srcSet
       webpSrcSet
       src
       alt
       width
       height
       aspectRatio
       base64
     }
   }
  }
}
`;
