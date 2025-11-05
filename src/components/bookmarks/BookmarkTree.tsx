'use client';

import { useState, useMemo, useEffect } from 'react';
import { Bookmark, Category } from '@/types';

interface CategoryNode extends Category {
  children: CategoryNode[];
  bookmarks: Bookmark[];
}

interface BookmarkTreeProps {
  categories: Category[];
  bookmarks: Bookmark[];
  searchQuery: string;
}

export default function BookmarkTree({ categories, bookmarks, searchQuery }: BookmarkTreeProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set());

  // 构建扁平化的分类列表（所有分类在同一层级，但保持层级顺序）
  const flatCategoryList = useMemo(() => {
    const categoryMap = new Map<number, CategoryNode>();

    // 初始化所有分类节点
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        bookmarks: [],
      });
    });

    // 将书签分配到对应的分类
    const orphanedBookmarks: Bookmark[] = [];
    let categorizedCount = 0;
    bookmarks.forEach(bookmark => {
      if (bookmark.categoryId) {
        const category = categoryMap.get(bookmark.categoryId);
        if (category) {
          category.bookmarks.push(bookmark);
          categorizedCount++;
        } else {
          // 如果分类不存在，记录为孤儿书签
          console.warn(`书签 "${bookmark.title}" 的分类 ID ${bookmark.categoryId} 不存在，将显示在未分类中`);
          orphanedBookmarks.push(bookmark);
        }
      }
    });
    
    // 调试信息
    console.log('分类列表构建:', {
      总书签数: bookmarks.length,
      有分类的书签数: bookmarks.filter(b => b.categoryId).length,
      成功分配到分类的书签数: categorizedCount,
      分类数: categories.length,
      未分类书签数: bookmarks.filter(b => !b.categoryId).length,
      孤儿书签数: orphanedBookmarks.length,
    });
    
    // 将孤儿书签添加到未分类列表
    const uncategorizedBookmarks = bookmarks.filter(b => !b.categoryId).concat(orphanedBookmarks);

    // 构建扁平化的分类列表，保持层级顺序（父分类在前，子分类在后）
    // 计算分类的层级深度
    const getDepth = (categoryId: number, visited = new Set<number>()): number => {
      if (visited.has(categoryId)) {
        return 0; // 防止循环引用
      }
      visited.add(categoryId);
      const category = categoryMap.get(categoryId);
      if (!category || !category.parentId) {
        return 0;
      }
      return 1 + getDepth(category.parentId, visited);
    };
    
    // 按层级深度排序，同层级按名称排序
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
      const depthA = getDepth(a.id);
      const depthB = getDepth(b.id);
      if (depthA !== depthB) {
        return depthA - depthB; // 层级浅的在前
      }
      // 同层级按名称排序
      return (a.name || '').localeCompare(b.name || '');
    });
    
    // 直接使用排序后的分类列表
    const flatList = sortedCategories;
    
    return { flatList, uncategorizedBookmarks };
  }, [categories, bookmarks]);

  // 初始化：默认折叠所有分类（包括未分类）
  useEffect(() => {
    if (categories.length > 0 && collapsedCategories.size === 0) {
      // 默认折叠所有分类（包括根分类和未分类）
      const allCategoryIds = new Set(categories.map(c => c.id));
      allCategoryIds.add(-1); // -1 表示未分类
      setCollapsedCategories(allCategoryIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  // 当有搜索查询时，自动展开所有包含匹配内容的分类
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const categoriesToExpand = new Set<number>();
      
      // 找到所有包含匹配书签的分类
      bookmarks.forEach(bookmark => {
        const matches = 
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query) ||
          (bookmark.description && bookmark.description.toLowerCase().includes(query)) ||
          (bookmark.tags && bookmark.tags.toLowerCase().includes(query));
        
        if (matches) {
          if (bookmark.categoryId) {
            categoriesToExpand.add(bookmark.categoryId);
            // 展开所有父分类（扁平化显示也需要展开父分类以便查看）
            let categoryId = bookmark.categoryId;
            while (categoryId) {
              const category = categories.find(c => c.id === categoryId);
              if (category && category.parentId) {
                categoriesToExpand.add(category.parentId);
                categoryId = category.parentId;
              } else {
                break;
              }
            }
          } else {
            // 未分类的书签匹配，展开未分类
            categoriesToExpand.add(-1);
          }
        }
      });
      
      // 展开所有匹配的分类，折叠其他分类
      const categoriesToCollapse = new Set<number>();
      categories.forEach(cat => {
        if (!categoriesToExpand.has(cat.id)) {
          categoriesToCollapse.add(cat.id);
        }
      });
      // 如果未分类没有匹配的书签，也折叠它
      if (!categoriesToExpand.has(-1)) {
        categoriesToCollapse.add(-1);
      }
      setCollapsedCategories(categoriesToCollapse);
    } else {
      // 搜索清空时，恢复默认折叠状态（包括未分类）
      const allCategoryIds = new Set(categories.map(c => c.id));
      allCategoryIds.add(-1); // 包括未分类
      setCollapsedCategories(allCategoryIds);
    }
  }, [searchQuery, categories, bookmarks]);

  const toggleCategory = (categoryId: number) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const expandAllCategories = () => {
    setCollapsedCategories(new Set());
  };

  const collapseAllCategories = () => {
    const allCategoryIds = new Set(categories.map(c => c.id));
    allCategoryIds.add(-1); // 包括未分类
    setCollapsedCategories(allCategoryIds);
  };

  // 过滤分类列表
  const filteredCategoryList = useMemo(() => {
    if (!searchQuery) {
      return flatCategoryList;
    }

    const query = searchQuery.toLowerCase();
    const filteredCategories = flatCategoryList.flatList.filter(category => {
      // 检查分类名称是否匹配
      if (category.name.toLowerCase().includes(query)) {
        return true;
      }
      // 检查分类中的书签是否匹配
      return category.bookmarks.some(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        (bookmark.description && bookmark.description.toLowerCase().includes(query)) ||
        (bookmark.tags && bookmark.tags.toLowerCase().includes(query))
      );
    }).map(category => ({
      ...category,
      bookmarks: category.bookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        (bookmark.description && bookmark.description.toLowerCase().includes(query)) ||
        (bookmark.tags && bookmark.tags.toLowerCase().includes(query))
      )
    }));

    const filteredUncategorized = flatCategoryList.uncategorizedBookmarks.filter(
      bookmark => {
        return (
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query) ||
          (bookmark.description && bookmark.description.toLowerCase().includes(query)) ||
          (bookmark.tags && bookmark.tags.toLowerCase().includes(query))
        );
      }
    );

    return {
      flatList: filteredCategories,
      uncategorizedBookmarks: filteredUncategorized,
    };
  }, [flatCategoryList, searchQuery]);

  // 构建所有分类的映射（用于查找父分类）
  const allCategoryMap = useMemo(() => {
    const map = new Map<number, CategoryNode>();
    categories.forEach(cat => {
      map.set(cat.id, {
        ...cat,
        children: [],
        bookmarks: [],
      });
    });
    return map;
  }, [categories]);

  // 获取分类的完整路径（根节点/节点/节点/子节点）
  const getCategoryPath = (category: CategoryNode): string => {
    const path: string[] = [];
    let current: CategoryNode | undefined = category;
    const visited = new Set<number>(); // 防止循环引用
    
    // 从当前分类向上遍历到根分类
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current.name);
      if (current.parentId) {
        current = allCategoryMap.get(current.parentId);
      } else {
        break;
      }
    }
    
    return path.join(' > ');
  };

  // 渲染单个分类（扁平化显示，不递归渲染子分类，所有分类左对齐）
  const renderCategory = (category: CategoryNode): JSX.Element => {
    const isCollapsed = collapsedCategories.has(category.id);
    
    // 只显示当前分类的书签，不包含子分类的书签
    const categoryBookmarks = category.bookmarks;
    
    // 在搜索模式下，如果分类没有匹配的书签，则隐藏
    if (searchQuery && categoryBookmarks.length === 0) {
      return <></>;
    }
    
    // 获取分类路径
    const categoryPath = getCategoryPath(category);

    return (
      <div 
        key={category.id} 
        className={`nav-category ${isCollapsed ? 'collapsed' : ''}`} 
        data-category-id={category.id}
      >
        <div 
          className="nav-category-title" 
          onClick={() => toggleCategory(category.id)}
          style={{ cursor: 'pointer' }}
        >
          <span title={categoryPath}>{categoryPath}</span>
          <div className="nav-category-toggle" onClick={(e) => e.stopPropagation()}>
            <span className="nav-category-count">({categoryBookmarks.length})</span>
            <button 
              className="nav-category-toggle-btn" 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleCategory(category.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg 
                className="nav-category-toggle-icon icon"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="nav-category-grid-wrapper">
          {categoryBookmarks.length > 0 && (
            <div className="nav-grid">
              {categoryBookmarks.map(bookmark => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-item"
                  title={bookmark.title}
                >
                  <div className="nav-item-header">
                    <div className="nav-item-icon">
                      {bookmark.faviconUrl ? (
                        <img 
                          src={bookmark.faviconUrl} 
                          alt="" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '12px' }}>📌</span>
                      )}
                    </div>
                    <div className="nav-item-title">{bookmark.title}</div>
                  </div>
                  <div className="nav-item-url">
                    {bookmark.url.length > 60 
                      ? bookmark.url.substring(0, 60) + '...' 
                      : bookmark.url}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 调试信息：检查是否有分类但没有显示
  if (filteredCategoryList.flatList.length === 0 && categories.length > 0 && !searchQuery) {
    console.warn('有分类数据但分类列表为空', {
      原始分类数: categories.length,
      原始书签数: bookmarks.length,
      有分类的书签数: bookmarks.filter(b => b.categoryId).length,
      过滤后分类数: filteredCategoryList.flatList.length,
    });
  }

  if (filteredCategoryList.flatList.length === 0 && filteredCategoryList.uncategorizedBookmarks.length === 0) {
    return (
      <div className="nav-empty">
        <div className="nav-empty-icon">📁</div>
        <p>{searchQuery ? '没有找到匹配的书签' : '暂无书签'}</p>
        {categories.length > 0 && bookmarks.length > 0 && !searchQuery && (
          <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            <p>调试信息：有 {categories.length} 个分类和 {bookmarks.length} 个书签</p>
            <p>有分类的书签: {bookmarks.filter(b => b.categoryId).length}</p>
            <button 
              onClick={expandAllCategories}
              className="pill"
              style={{ marginTop: 'var(--space-2)' }}
            >
              展开所有分类
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="nav-content">
      {/* 控制按钮 */}
      <div className="nav-header">
        <h2>书签导航</h2>
        <div className="nav-header-controls">
          <button className="nav-control-btn" onClick={expandAllCategories}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 12h8M12 8v8"/>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <span>展开全部</span>
          </button>
          <button className="nav-control-btn" onClick={collapseAllCategories}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 12h8M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <span>折叠全部</span>
          </button>
        </div>
      </div>

      {/* 分类列表 - 扁平化显示 */}
      {filteredCategoryList.flatList.map(category => renderCategory(category))}
      
      {/* 未分类书签 */}
      {filteredCategoryList.uncategorizedBookmarks.length > 0 && (
        <div className={`nav-category ${collapsedCategories.has(-1) ? 'collapsed' : ''}`}>
          <div 
            className="nav-category-title"
            onClick={() => {
              setCollapsedCategories(prev => {
                const newSet = new Set(prev);
                if (newSet.has(-1)) {
                  newSet.delete(-1);
                } else {
                  newSet.add(-1);
                }
                return newSet;
              });
            }}
            style={{ cursor: 'pointer' }}
          >
            <span>未分类</span>
            <div className="nav-category-toggle">
              <span className="nav-category-count">({filteredCategoryList.uncategorizedBookmarks.length})</span>
              <button 
                className="nav-category-toggle-btn" 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsedCategories(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(-1)) {
                      newSet.delete(-1);
                    } else {
                      newSet.add(-1);
                    }
                    return newSet;
                  });
                }}
              >
                <svg 
                  className="nav-category-toggle-icon icon"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="nav-category-grid-wrapper">
            <div className="nav-grid">
              {filteredCategoryList.uncategorizedBookmarks.map(bookmark => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-item"
                  title={bookmark.title}
                >
                  <div className="nav-item-header">
                    <div className="nav-item-icon">
                      {bookmark.faviconUrl ? (
                        <img 
                          src={bookmark.faviconUrl} 
                          alt="" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '12px' }}>📌</span>
                      )}
                    </div>
                    <div className="nav-item-title">{bookmark.title}</div>
                  </div>
                  <div className="nav-item-url">
                    {bookmark.url.length > 60 
                      ? bookmark.url.substring(0, 60) + '...' 
                      : bookmark.url}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
