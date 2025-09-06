import { FeedBackendInterface, Feed, FeedFilter, FeedFolder, FeedItem, FeedQuery, FeedType } from '../types';
import { NNFeed, NNFeeds, NNFolder, NNFolders, NNItem, NNItems, NNSearchResult } from './nextcloud-news-types';

import { api } from '@/utils/request';

const NB_ITEMS_TO_LOAD = 20;


export default class FeedBackend implements FeedBackendInterface {
  url: string
  login: string
  password: string

  constructor() {
    this.url = localStorage.getItem('backend-url') ?? '';
    this.login = localStorage.getItem('backend-login') ?? '';
    this.password = localStorage.getItem('backend-password') ?? '';
  }

  async getFolders(): Promise<FeedFolder[]> {
    let feedFolders: FeedFolder[] = [];
    try {
      const foldersById: { [id: string]: FeedFolder } = {};
      const foldersQuery = await api.get<NNFolders>(this.url + '/index.php/apps/news/api/v1-2/folders', this._getOptions());
      foldersQuery.folders.forEach((folder: NNFolder) => {
        foldersById[folder['id']] = {
          id: String(folder.id),
          name: folder.name,
          unreadCount: 0,
          feeds: [],
        };
      });

      feedFolders = await this._addFeedsToFolders(foldersById)
    } catch (error) {
      throw new Error('Network response was not ok' + error)
    }

    return feedFolders;
  }

  private _getOptions(method: string = 'GET'): RequestInit {
    const headers = new Headers()
    headers.append(
      'Authorization',
      'Basic ' + btoa(this.login + ':' + this.password)
    )

    const requestOptions = {
      method: method,
      headers: headers,
    }
    return requestOptions
  }

  async _addFeedsToFolders(foldersById: { [id: string]: FeedFolder }): Promise<FeedFolder[]> {
    const feedsInFolders: { [folderId: string]: FeedFolder } = {};
    try {
      const feedsQuery = await api.get<NNFeeds>(this.url + '/index.php/apps/news/api/v1-2/feeds', this._getOptions());
      feedsQuery.feeds.forEach((feed: NNFeed) => {
        if (!(feed.folderId in feedsInFolders)) {
          feedsInFolders[feed.folderId] = {
            id: String(feed.folderId),
            name: foldersById[feed.folderId].name,
            unreadCount: 0,
            feeds: [],
          }
        }

        const newFeed = {
          id: String(feed.id),
          title: feed.title,
          unreadCount: feed.unreadCount,
          faviconUrl: feed.faviconLink,
          folderId: String(feed.folderId),
        } as Feed;
        feedsInFolders[feed.folderId].feeds.push(newFeed);
        feedsInFolders[feed.folderId].unreadCount += feed.unreadCount;
      });
    }
    catch (error) {
      throw new Error('Network response was not ok' + error)
    }

    return Object.values(feedsInFolders);

  }

  private async _getFeedsMapping(): Promise<{ [feedId: number]: Feed }> {
    const feedsMapping: { [feedId: number]: Feed } = {};
    try {
      const feedsQuery = await api.get<NNFeeds>(this.url + '/index.php/apps/news/api/v1-2/feeds', this._getOptions());
      feedsQuery.feeds.forEach((feed: NNFeed) => {
        feedsMapping[feed.id] = {
          id: String(feed.id),
          title: feed.title,
          unreadCount: feed.unreadCount,
          faviconUrl: feed.faviconLink,
          folderId: String(feed.folderId),
        } as Feed;
      });
    } catch (error) {
      throw new Error('Network response was not ok' + error)
    }

    return feedsMapping;
  }

  async getFeedItems(query: FeedQuery, offset?: number): Promise<FeedItem[]> {
    let items: FeedItem[] = [];
    try {
      // Récupérer tous les feeds pour créer un mapping feedId -> Feed
      const feedsMapping = await this._getFeedsMapping();

      const params: { [key: string]: string } = {
        batchSize: String(NB_ITEMS_TO_LOAD),
        id: String(query.feedId ?? query.folderId ?? '0'),
        type: getNextcloudFeedType(query),
        getRead: String(query.feedFilter != FeedFilter.UNREAD),
        oldestFirst: 'false',
      };
      if (offset && offset > 0) {
        params['offset'] = String(offset);
      }
      const itemsQuery = await api.get<NNItems>(this.url + '/index.php/apps/news/api/v1-3/items?' + new URLSearchParams(params).toString(), this._getOptions());
      items = itemsQuery.items.map((item: NNItem) => {
        return {
          id: item.id,
          feed: feedsMapping[item.feedId] || null,
          title: item.title,
          url: item.url,
          pubDate: new Date(item.pubDate * 1000),
          read: !item.unread,
          starred: item.starred,
          body: item.body,
          thumbnailUrl: getItemImageURL(item),
        } as FeedItem
      });
    } catch (error) {
      throw new Error('Network response was not ok' + error)
    }

    return items;
  }

  async setFeedArticleRead(id: string): Promise<void> {
    try {
      await fetch(this.url + '/index.php/apps/news/api/v1-2/items/' + id + '/read', this._getOptions('PUT'));
    } catch (error) {
      throw new Error('Network response was not ok' + error)
    }
  }

  async searchItems(content: string): Promise<FeedItem[]> {
    let items: FeedItem[] = [];
    try {
      // Get all feeds for creating a mapping feedId -> Feed
      const feedsMapping = await this._getFeedsMapping();

      const params: { [key: string]: string } = {
        content: content,
        includeBody: 'true'
      };

      const searchQuery = await api.get<NNSearchResult>(
        this.url + '/index.php/apps/news/api/v1-3/search?' + new URLSearchParams(params).toString(),
        this._getOptions()
      );

      items = searchQuery.items.map((item: NNItem) => {
        return {
          id: item.id,
          feed: feedsMapping[item.feedId] || null,
          title: item.title,
          url: item.url,
          pubDate: new Date(item.pubDate * 1000),
          read: !item.unread,
          starred: item.starred,
          body: item.body,
          thumbnailUrl: getItemImageURL(item),
        } as FeedItem
      });
    } catch (error) {
      throw new Error('Network response was not ok' + error)
    }

    return items;
  }

}

function getNextcloudFeedType(query: FeedQuery): string {
  let nextCloudFeedType: string = '0';
  if (!query.feedId) {
    if (query.feedType == FeedType.STARRED) {
      nextCloudFeedType = '2';
    } else if (query.feedType == FeedType.FOLDER) {
      nextCloudFeedType = '1';
    } else if (query.feedFilter == FeedFilter.ALL || query.feedFilter == FeedFilter.UNREAD) {
      nextCloudFeedType = '3';
    }
  }

  return nextCloudFeedType
}
}

function getItemImageURL(item: NNItem): string {
  const REX = /<img[^>]+src="([^">]+)"/g;
  let image = item.enclosureLink ?? "";
  if (image == "" || image == null) {
    image = item.mediaThumbnail ?? "";
    if ((image == "" || image == null) && item.body != null) {
      const m = REX.exec(item.body);
      if (m) {
        image = m[1];
      }
    }
  }

  return image;
}