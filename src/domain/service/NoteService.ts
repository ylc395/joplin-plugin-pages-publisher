import { ref, Ref, computed, InjectionKey } from 'vue';
import slugify from 'slugify';
import { container, singleton } from 'tsyringe';
import { find, map, remove } from 'lodash';
import { JoplinDataRepository } from '../repository/JoplinDataRepository';
import type { Note } from '../model/JoplinData';
import { Article, getSyncStatus } from '../model/Article';
import { ArticleService } from './ArticleService';

export const token: InjectionKey<NoteService> = Symbol();
interface SearchedNote extends Note {
  status: 'none' | 'published' | 'unpublished';
}

@singleton()
export class NoteService {
  private readonly articleService = container.resolve(ArticleService);
  private readonly joplinDataRepository = new JoplinDataRepository();
  private readonly notesToBeAdded = ref<Note[]>([]);
  private readonly _searchedNotes: Ref<Note[]> = ref([]);
  readonly searchedNotes = computed<SearchedNote[]>(() => {
    return this._searchedNotes.value.map((note) => {
      const status = (() => {
        const idMatch = { noteId: note.id };

        if (find(this.articleService.publishedArticles.value, idMatch)) {
          return 'published';
        }

        if (find(this.articleService.unpublishedArticles.value, idMatch)) {
          return 'unpublished';
        }

        return 'none';
      })();

      return { ...note, status };
    });
  });

  async searchNotes(keyword: string) {
    if (!keyword) {
      this._searchedNotes.value = [];
      return;
    }

    const notes = await this.joplinDataRepository.searchNotes(keyword);
    this._searchedNotes.value = notes;
  }

  private async noteToArticle(note: Note): Promise<Article> {
    const [tags, fullNote] = await Promise.all([
      this.joplinDataRepository.getTagsOf(note.id),
      this.joplinDataRepository.getNote(note.id),
    ]);

    if (!fullNote) {
      throw new Error(`Cannot fetch note: ${note.id}`);
    }

    return {
      published: true,
      noteId: note.id,
      title: note.title,
      createdAt: fullNote.user_created_time,
      updatedAt: fullNote.user_updated_time,
      tags: map(tags, 'title'),
      note: fullNote,
      content: fullNote.body,
      url: slugify(fullNote.title, { lower: true }) || 'untitled',
    };
  }

  addNote(noteId: string) {
    const note = find(this._searchedNotes.value, { id: noteId });

    if (!note) {
      throw new Error(`no note for id ${noteId}`);
    }

    this.notesToBeAdded.value.push(note);
  }

  removeNote(noteId: string) {
    remove(this.notesToBeAdded.value, { id: noteId });
  }

  async submitAsArticles() {
    const articles = await Promise.all(
      this.notesToBeAdded.value.map(this.noteToArticle.bind(this)),
    );

    for (const article of articles) {
      if (!this.articleService.isValidUrl(article.url)) {
        article.url = this.articleService.getValidUrl(article.url);
      }

      this.articleService.articles.push(article);
    }

    this.notesToBeAdded.value = [];
    await this.articleService.saveArticles();
  }

  async syncNotes() {
    const noteIds = map(this.articleService.articles, 'noteId');
    const notes = await Promise.all(noteIds.map((id) => this.joplinDataRepository.getNote(id)));
    const notesMap = notes.reduce((result, note, i) => {
      if (note) {
        result[note.id] = note;
      } else {
        result[noteIds[i]] = null;
      }
      return result;
    }, {} as Record<string, Required<Note> | null>);

    for (const article of this.articleService.articles) {
      const { noteId } = article;
      if (noteId in notesMap) {
        const note = notesMap[noteId];

        article.note = note;
        article.syncStatus = getSyncStatus(article);
      } else {
        this.syncNotes();
        return;
      }
    }
  }
}
