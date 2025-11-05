import { Bookmark } from '@/types';
import { bookmarkApi } from './api/bookmarkApi';

// Chrome API类型声明
declare global {
  interface Window {
    chrome?: {
      bookmarks?: {
        getTree: (callback: (result: ChromeBookmarkNode[]) => void) => void;
      };
    };
  }
  
  const chrome: typeof window.chrome | undefined;
}

export interface ChromeBookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: ChromeBookmarkNode[];
}

export interface SyncResult {
  successCount: number;
  failCount: number;
  total: number;
}

export class BrowserSyncService {
  private static instance: BrowserSyncService;
  
  static getInstance(): BrowserSyncService {
    if (!BrowserSyncService.instance) {
      BrowserSyncService.instance = new BrowserSyncService();
    }
    return BrowserSyncService.instance;
  }
  
  // 获取浏览器书签
  async getBrowserBookmarks(): Promise<ChromeBookmarkNode[]> {
    return new Promise((resolve) => {
      // 使用window.chrome以确保类型安全
      if (typeof window !== 'undefined' && window.chrome?.bookmarks) {
        window.chrome.bookmarks.getTree((bookmarkTreeNodes: ChromeBookmarkNode[]) => {
          resolve(bookmarkTreeNodes);
        });
      } else {
        resolve([]);
      }
    });
  }
  
  // 导出为HTML格式
  async exportToHtml(bookmarks: Bookmark[]): Promise<string> {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<HTML>
<HEAD>
<TITLE>Bookmarks</TITLE>
</HEAD>
<BODY>
<H1>Bookmarks</H1>
<DL><p>`;
    
    bookmarks.forEach(bookmark => {
      const date = bookmark.createdAt 
        ? Math.floor(new Date(bookmark.createdAt).getTime() / 1000)
        : Math.floor(Date.now() / 1000);
      
      html += `
    <DT><A HREF="${bookmark.url}" ADD_DATE="${date}">${bookmark.title}</A>`;
    });
    
    html += `
</DL><p>
</BODY>
</HTML>`;
    
    return html;
  }
  
  // 同步到平台
  async syncToPlatform(): Promise<SyncResult> {
    try {
      const browserBookmarks = await this.getBrowserBookmarks();
      const flattenedBookmarks = this.flattenBookmarks(browserBookmarks);
      
      // 批量同步到后端
      const results = await Promise.allSettled(
        flattenedBookmarks
          .filter(bookmark => bookmark.title && bookmark.url) // 过滤掉无效的书签
          .map(bookmark => 
            bookmarkApi.create({
              userId: 0, // 将在后端设置
              title: bookmark.title!,
              url: bookmark.url!,
              description: bookmark.description,
              faviconUrl: bookmark.faviconUrl,
              tags: bookmark.tags,
              isStarred: bookmark.isStarred || false,
            }).catch(error => ({ error, bookmark }))
          )
      );
      
      const successCount = results.filter(result => 
        result.status === 'fulfilled'
      ).length;
      const failCount = results.length - successCount;
      
      return { successCount, failCount, total: results.length };
    } catch (error: any) {
      throw new Error(`同步失败: ${error.message}`);
    }
  }
  
  private flattenBookmarks(bookmarkTreeNodes: ChromeBookmarkNode[]): Partial<Bookmark>[] {
    const bookmarks: Partial<Bookmark>[] = [];
    
    const processNode = (node: ChromeBookmarkNode) => {
      if (node.url) {
        bookmarks.push({
          title: node.title,
          url: node.url,
          isStarred: false,
        });
      }
      
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    bookmarkTreeNodes.forEach(processNode);
    return bookmarks;
  }
}

