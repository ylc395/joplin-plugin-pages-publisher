// import { Article } from '../model/Article';
// import { filter, range } from 'lodash';

// export class GeneratorService {
//   private readonly siteService = container.resolve(SiteService);
//   private createArticlePage(article: Article) {
//     const { site } = this.siteService;

//     if (!site.value) {
//       throw new Error('theme is not loaded yet');
//     }

//     if (!this.pagesFieldVars.value) {
//       throw new Error('pages field vars is not loaded yet');
//     }

//     const fieldVars = this.pagesFieldVars.value[ArticlePage.getPageId(article)] || {};
//     const articlePage = new ArticlePage(site.value, fieldVars, article);

//     return articlePage;
//   }

//   private createArticlePages() {
//     const { site } = this.siteService;

//     if (!site.value?.articles) {
//       throw new Error('articles is not loaded yet');
//     }

//     return site.value.articles.map(this.createArticlePage.bind(this));
//   }

//   private createArchivesPages() {
//     const site = this.siteService.site.value;
//     const pagesFieldVars = this.pagesFieldVars.value;

//     if (!site || !site.articles) {
//       throw new Error('articles is not loaded yet');
//     }

//     if (!pagesFieldVars) {
//       throw new Error('pages field vars is not loaded yet');
//     }

//     const fieldVars = pagesFieldVars[ArchivesPage.pageName] || {};
//     const articlesCount: number = fieldVars.articlesCount || ArchivesPage.defaultArticlesCount;
//     const pageNums = range(1, Math.ceil(site.articles.length / articlesCount) + 1);

//     return pageNums.map((num) => new ArchivesPage(site, fieldVars, num));
//   }

//   private createTagPages() {
//     const site = this.siteService.site.value;

//     if (!site?.tags) {
//       throw new Error('tags is not loaded yet');
//     }

//     if (!this.pagesFieldVars.value) {
//       throw new Error('pages field vars is not loaded yet');
//     }

//     const fieldVars = this.pagesFieldVars.value[TagPage.pageName] || {};

//     return site.tags.map((tag) => new TagPage(site, fieldVars, tag));
//   }

//   createAllPages() {
//     const site = this.siteService.site.value;
//     const pagesFieldVars = this.pagesFieldVars.value;

//     if (!site?.themeConfig) {
//       throw new Error('theme is not loaded yet');
//     }

//     if (!pagesFieldVars) {
//       throw new Error('pages field vars is not loaded yet');
//     }

//     const { pages } = site.themeConfig;
//     const customPageNames = Object.keys(
//       filter(
//         pages,
//         (_, pageName) =>
//           ![
//             HomePage.pageName,
//             TagPage.pageName,
//             ArchivesPage.pageName,
//             ArticlePage.pageName,
//           ].includes(pageName),
//       ),
//     );

//     return [
//       new HomePage(site, pagesFieldVars[HomePage.pageName] || {}),
//       ...this.createArchivesPages(),
//       ...this.createArticlePages(),
//       ...this.createTagPages(),
//       ...customPageNames.map(
//         (pageName) => new CustomPage(pageName, site, pagesFieldVars[pageName] || {}),
//       ),
//     ];
//   }
// }
