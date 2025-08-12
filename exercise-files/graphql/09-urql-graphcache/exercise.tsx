// URQL Graphcache Configuration Exercise
// Configure URQL's Graphcache for normalized caching and updates

import React, { useState, useCallback } from 'react';
import {
  Client,
  Provider,
  fetchExchange,
  createClient,
  useQuery,
  useMutation,
  CombinedError,
} from 'urql';
import {
  cacheExchange,
  Cache,
  ResolveInfo,
  UpdateResolver,
  Resolver,
  KeyGenerator,
  OptimisticMutationConfig,
} from '@urql/exchange-graphcache';

// TODO 1: Define GraphQL Schema Types
// Comprehensive type definitions for Graphcache configuration

export interface User {
  id: string;
  __typename: 'User';
  username: string;
  email: string;
  profile: UserProfile;
  posts: Post[];
  followers: User[];
  following: User[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  __typename: 'UserProfile';
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  // Computed field - not stored, calculated from firstName + lastName
  fullName?: string;
}

export interface Post {
  id: string;
  __typename: 'Post';
  title: string;
  content: string;
  excerpt?: string; // Computed field
  author: User;
  tags: string[];
  category: PostCategory;
  likes: Like[];
  comments: Comment[];
  likesCount: number;
  commentsCount: number;
  publishedAt: string;
  updatedAt: string;
  status: PostStatus;
  isLikedByViewer?: boolean; // Computed field based on current user
}

export interface PostCategory {
  id: string;
  __typename: 'PostCategory';
  name: string;
  slug: string;
  description?: string;
  posts: Post[];
  postsCount: number;
}

export interface Like {
  id: string;
  __typename: 'Like';
  user: User;
  post: Post;
  createdAt: string;
}

export interface Comment {
  id: string;
  __typename: 'Comment';
  content: string;
  author: User;
  post: Post;
  parent?: Comment;
  replies: Comment[];
  repliesCount: number;
  likes: Like[];
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// TODO 2: Define Graphcache Configuration Types
// Types for cache configuration, resolvers, and updates

export interface GraphcacheConfig {
  keys: Record<string, KeyGenerator>;
  resolvers: Record<string, Record<string, Resolver>>;
  updates: Record<string, Record<string, UpdateResolver>>;
  optimistic: Record<string, OptimisticMutationConfig>;
}

// TODO 3: Configure Cache Keys
// Define how different types should be uniquely identified in the cache

const cacheKeys: GraphcacheConfig['keys'] = {
  User: (data: any) => data.id,
  UserProfile: (data: any) => data.id,
  Post: (data: any) => data.id,
  PostCategory: (data: any) => data.id,
  Like: (data: any) => data.id,
  Comment: (data: any) => data.id,
};

// TODO 4: Implement Cache Resolvers
// Client-side resolvers for computed fields and relationships

const cacheResolvers: GraphcacheConfig['resolvers'] = {
  User: {
    // TODO: Implement fullName resolver
    fullName: (parent: User, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Compute fullName from profile.firstName and profile.lastName
      const profile = parent.profile;
      if (profile && profile.firstName && profile.lastName) {
        return `${profile.firstName} ${profile.lastName}`;
      }
      return null;
    },

    // TODO: Implement postsCount resolver
    postsCount: (parent: User, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Count posts for this user from the cache
      // This is a computed field that should be calculated from cached posts
      throw new Error('TODO: Implement postsCount resolver');
    },

    // TODO: Implement followersCount resolver
    followersCount: (parent: User, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Count followers from the cache or use cached field
      return parent.followersCount || 0;
    },

    // TODO: Implement followingCount resolver
    followingCount: (parent: User, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Count following from the cache or use cached field
      return parent.followingCount || 0;
    },
  },

  Post: {
    // TODO: Implement excerpt resolver
    excerpt: (parent: Post, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Generate excerpt from content (first 150 characters)
      if (parent.content) {
        return parent.content.length > 150 
          ? `${parent.content.substring(0, 150)}...`
          : parent.content;
      }
      return null;
    },

    // TODO: Implement isLikedByViewer resolver
    isLikedByViewer: (parent: Post, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Check if current user has liked this post
      // This requires knowing the current user ID
      // You might store this in cache or pass as argument
      throw new Error('TODO: Implement isLikedByViewer resolver');
    },

    // TODO: Implement likesCount resolver
    likesCount: (parent: Post, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Count likes from the cache or use cached field
      return parent.likesCount || 0;
    },

    // TODO: Implement commentsCount resolver
    commentsCount: (parent: Post, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Count comments from the cache or use cached field
      return parent.commentsCount || 0;
    },
  },

  PostCategory: {
    // TODO: Implement postsCount resolver
    postsCount: (parent: PostCategory, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Count posts in this category
      return parent.postsCount || 0;
    },
  },

  Comment: {
    // TODO: Implement repliesCount resolver
    repliesCount: (parent: Comment, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Count replies for this comment
      return parent.replies ? parent.replies.length : 0;
    },

    // TODO: Implement likesCount resolver
    likesCount: (parent: Comment, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Count likes for this comment
      return parent.likesCount || 0;
    },
  },

  Query: {
    // TODO: Implement posts resolver for pagination
    posts: (parent: any, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Handle paginated posts query
      // This should merge results from multiple queries
      throw new Error('TODO: Implement posts pagination resolver');
    },

    // TODO: Implement user resolver
    user: (parent: any, args: { id: string }, cache: Cache, info: ResolveInfo) => {
      // TODO: Resolve user from cache
      return cache.resolve({ __typename: 'User', id: args.id });
    },

    // TODO: Implement post resolver
    post: (parent: any, args: { id: string }, cache: Cache, info: ResolveInfo) => {
      // TODO: Resolve post from cache
      return cache.resolve({ __typename: 'Post', id: args.id });
    },
  },
};

// TODO 5: Implement Cache Updates
// Define how mutations should update the cache

const cacheUpdates: GraphcacheConfig['updates'] = {
  Mutation: {
    // TODO: Handle createUser mutation updates
    createUser: (result: any, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Add new user to users list queries
      // Update relevant cached queries that should include this user
      
      if (result.createUser?.user) {
        // TODO: Update users query cache
        // Find and update relevant Query.users fields
        throw new Error('TODO: Implement createUser cache update');
      }
    },

    // TODO: Handle createPost mutation updates
    createPost: (result: any, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Add new post to posts lists
      // Update author's posts count
      // Update category posts count
      
      if (result.createPost?.post) {
        const newPost = result.createPost.post;
        
        // TODO: Update posts queries
        // TODO: Update author's posts list
        // TODO: Update author's postsCount
        // TODO: Update category's posts list and postsCount
        
        throw new Error('TODO: Implement createPost cache update');
      }
    },

    // TODO: Handle likePost mutation updates
    likePost: (result: any, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Update post's likes count
      // Update post's isLikedByViewer status
      // Add like to post's likes list
      
      if (result.likePost?.like) {
        const like = result.likePost.like;
        const postId = like.post.id;
        
        // TODO: Update Post likesCount
        cache.updateQuery(
          { 
            query: `query GetPost($id: ID!) {
              post(id: $id) {
                id
                likesCount
                isLikedByViewer
                likes {
                  id
                  user { id }
                }
              }
            }`,
            variables: { id: postId }
          },
          (data: any) => {
            if (data?.post) {
              return {
                ...data,
                post: {
                  ...data.post,
                  likesCount: data.post.likesCount + 1,
                  isLikedByViewer: true,
                  likes: [...data.post.likes, like]
                }
              };
            }
            return data;
          }
        );
      }
    },

    // TODO: Handle unlikePost mutation updates
    unlikePost: (result: any, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Update post's likes count (decrement)
      // Update post's isLikedByViewer status
      // Remove like from post's likes list
      
      if (result.unlikePost?.success) {
        const postId = args.postId;
        const userId = args.userId; // Assuming we pass current user ID
        
        // TODO: Update Post likesCount and remove like
        throw new Error('TODO: Implement unlikePost cache update');
      }
    },

    // TODO: Handle createComment mutation updates
    createComment: (result: any, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Add comment to post's comments list
      // Update post's commentsCount
      // If reply, add to parent comment's replies
      
      if (result.createComment?.comment) {
        const newComment = result.createComment.comment;
        
        // TODO: Update post's comments and commentsCount
        // TODO: If reply, update parent comment's replies
        
        throw new Error('TODO: Implement createComment cache update');
      }
    },

    // TODO: Handle followUser mutation updates
    followUser: (result: any, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Update follower/following counts
      // Update following/followers lists if cached
      
      if (result.followUser?.success) {
        const followedUserId = args.userId;
        // TODO: Update user followersCount
        // TODO: Update current user followingCount
        
        throw new Error('TODO: Implement followUser cache update');
      }
    },

    // TODO: Handle updateUserProfile mutation updates
    updateUserProfile: (result: any, args: any, cache: Cache, info: ResolveInfo) => {
      // TODO: Update user profile fields
      // This should automatically update due to normalization
      // But we might need to handle computed fields like fullName
      
      if (result.updateUserProfile?.user) {
        // TODO: Ensure computed fields are recalculated
        // The cache should automatically update normalized data
      }
    },
  },
};

// TODO 6: Implement Optimistic Updates
// Define optimistic responses for immediate UI feedback

const optimisticUpdates: GraphcacheConfig['optimistic'] = {
  likePost: (args: { postId: string }, cache: Cache, info: ResolveInfo) => {
    // TODO: Provide optimistic response for liking a post
    return {
      __typename: 'LikePostPayload',
      like: {
        __typename: 'Like',
        id: `temp-${Date.now()}`, // Temporary ID
        post: { __typename: 'Post', id: args.postId },
        user: { __typename: 'User', id: 'current-user' }, // TODO: Get actual current user
        createdAt: new Date().toISOString(),
      },
    };
  },

  unlikePost: (args: { postId: string }, cache: Cache, info: ResolveInfo) => {
    // TODO: Provide optimistic response for unliking a post
    return {
      __typename: 'UnlikePostPayload',
      success: true,
    };
  },

  createComment: (args: { input: any }, cache: Cache, info: ResolveInfo) => {
    // TODO: Provide optimistic response for creating a comment
    return {
      __typename: 'CreateCommentPayload',
      comment: {
        __typename: 'Comment',
        id: `temp-${Date.now()}`,
        content: args.input.content,
        author: { __typename: 'User', id: 'current-user' },
        post: { __typename: 'Post', id: args.input.postId },
        parent: args.input.parentId ? { __typename: 'Comment', id: args.input.parentId } : null,
        replies: [],
        repliesCount: 0,
        likes: [],
        likesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  followUser: (args: { userId: string }, cache: Cache, info: ResolveInfo) => {
    // TODO: Provide optimistic response for following a user
    return {
      __typename: 'FollowUserPayload',
      success: true,
    };
  },
};

// TODO 7: Create Graphcache-enabled URQL Client
export const createGraphcacheClient = (config: {
  url: string;
  fetchOptions?: RequestInit;
  enableDevTools?: boolean;
}): Client => {
  const { url, fetchOptions = {}, enableDevTools = true } = config;

  // TODO: Configure Graphcache exchange
  const graphcacheExchange = cacheExchange({
    // TODO: Apply cache configuration
    keys: cacheKeys,
    resolvers: cacheResolvers,
    updates: cacheUpdates,
    optimistic: optimisticUpdates,

    // TODO: Configure additional Graphcache options
    schema: {
      // TODO: Provide schema information for better type inference
      // This can be generated from your GraphQL schema
    },

    // TODO: Configure storage for cache persistence
    storage: {
      // TODO: Implement storage adapter for persistence
      // Can use localStorage, IndexedDB, etc.
      readData: () => {
        try {
          const data = localStorage.getItem('urql-cache');
          return data ? JSON.parse(data) : undefined;
        } catch {
          return undefined;
        }
      },
      writeData: (data: any) => {
        try {
          localStorage.setItem('urql-cache', JSON.stringify(data));
        } catch {
          // Handle storage errors
        }
      },
    },
  });

  // TODO: Create URQL client with Graphcache
  const client = createClient({
    url,
    fetchOptions: () => ({
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add authentication headers
        ...fetchOptions.headers,
      },
    }),
    exchanges: [
      // TODO: Configure exchanges in correct order
      graphcacheExchange, // Cache exchange must come before fetch
      fetchExchange,
    ],
  });

  return client;
};

// TODO 8: Enhanced Query Hooks with Graphcache
// Hooks that take advantage of normalized caching

export interface UsePostQueryResult {
  post?: Post;
  loading: boolean;
  error?: CombinedError;
  refetch: () => void;
}

export const usePostQuery = (postId: string): UsePostQueryResult => {
  // TODO: Implement post query with Graphcache benefits
  const [result, executeQuery] = useQuery<{ post: Post }, { id: string }>({
    query: `
      query GetPost($id: ID!) {
        post(id: $id) {
          id
          title
          content
          excerpt
          author {
            id
            username
            profile {
              firstName
              lastName
              fullName
              avatar
            }
          }
          category {
            id
            name
            slug
          }
          tags
          likesCount
          commentsCount
          isLikedByViewer
          publishedAt
          status
        }
      }
    `,
    variables: { id: postId },
    requestPolicy: 'cache-first', // Graphcache makes this very efficient
  });

  const refetch = useCallback(() => {
    executeQuery({ requestPolicy: 'network-only' });
  }, [executeQuery]);

  return {
    post: result.data?.post,
    loading: result.fetching,
    error: result.error,
    refetch,
  };
};

// TODO 9: Mutation Hooks with Cache Updates
export interface UseLikePostResult {
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  loading: boolean;
  error?: CombinedError;
}

export const useLikePost = (): UseLikePostResult => {
  // TODO: Implement like/unlike mutations with optimistic updates
  const [likeResult, executeLike] = useMutation(`
    mutation LikePost($postId: ID!) {
      likePost(postId: $postId) {
        like {
          id
          user { id username }
          post { id }
          createdAt
        }
      }
    }
  `);

  const [unlikeResult, executeUnlike] = useMutation(`
    mutation UnlikePost($postId: ID!) {
      unlikePost(postId: $postId) {
        success
      }
    }
  `);

  const likePost = useCallback(async (postId: string) => {
    // TODO: Execute like mutation
    // Optimistic update should happen automatically via Graphcache config
    const result = await executeLike({ postId });
    
    if (result.error) {
      console.error('Like post error:', result.error);
      // TODO: Handle error, possibly revert optimistic update
    }
  }, [executeLike]);

  const unlikePost = useCallback(async (postId: string) => {
    // TODO: Execute unlike mutation
    // Optimistic update should happen automatically via Graphcache config
    const result = await executeUnlike({ postId });
    
    if (result.error) {
      console.error('Unlike post error:', result.error);
      // TODO: Handle error, possibly revert optimistic update
    }
  }, [executeUnlike]);

  return {
    likePost,
    unlikePost,
    loading: likeResult.fetching || unlikeResult.fetching,
    error: likeResult.error || unlikeResult.error,
  };
};

// TODO 10: Example Components with Graphcache
export const PostCard: React.FC<{ postId: string }> = ({ postId }) => {
  const { post, loading, error } = usePostQuery(postId);
  const { likePost, unlikePost } = useLikePost();

  if (loading) return <div className="post-loading">Loading post...</div>;
  if (error) return <div className="post-error">Error: {error.message}</div>;
  if (!post) return <div className="post-not-found">Post not found</div>;

  const handleLikeToggle = () => {
    if (post.isLikedByViewer) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };

  return (
    <article className="post-card">
      <header>
        <h2>{post.title}</h2>
        <div className="post-meta">
          <span className="author">
            By {post.author.profile.fullName || post.author.username}
          </span>
          <span className="category">{post.category.name}</span>
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString()}
          </time>
        </div>
      </header>

      <div className="post-content">
        <p>{post.excerpt}</p>
      </div>

      <div className="post-tags">
        {post.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      <footer className="post-actions">
        <button
          onClick={handleLikeToggle}
          className={`like-button ${post.isLikedByViewer ? 'liked' : ''}`}
        >
          ❤️ {post.likesCount}
        </button>
        <span className="comments-count">
          💬 {post.commentsCount}
        </span>
      </footer>
    </article>
  );
};

// TODO 11: Cache Debugging Utilities
export const GraphcacheDevTools = () => {
  const [client] = useState(() => createGraphcacheClient({
    url: 'http://localhost:4000/graphql',
  }));

  // TODO: Implement cache inspection utilities
  const inspectCache = () => {
    // TODO: Log current cache state
    // Graphcache provides cache.inspectFields for debugging
    console.log('Cache inspection not yet implemented');
  };

  const clearCache = () => {
    // TODO: Clear cache and refetch active queries
    // This should trigger a complete cache reset
    console.log('Cache clear not yet implemented');
  };

  return (
    <div className="graphcache-devtools">
      <h3>Graphcache DevTools</h3>
      <div className="devtools-actions">
        <button onClick={inspectCache}>Inspect Cache</button>
        <button onClick={clearCache}>Clear Cache</button>
      </div>
    </div>
  );
};

// TODO 12: Example App with Graphcache
export const GraphcacheExample: React.FC = () => {
  const client = createGraphcacheClient({
    url: 'http://localhost:4000/graphql',
    enableDevTools: process.env.NODE_ENV === 'development',
  });

  const [selectedPostId, setSelectedPostId] = useState<string>('1');

  return (
    <Provider value={client}>
      <div className="graphcache-example">
        <header>
          <h1>URQL Graphcache Example</h1>
          <p>Normalized caching with automatic updates</p>
        </header>

        <main>
          <div className="post-selector">
            <label htmlFor="post-select">Select Post:</label>
            <select
              id="post-select"
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value)}
            >
              <option value="1">Post 1</option>
              <option value="2">Post 2</option>
              <option value="3">Post 3</option>
            </select>
          </div>

          <PostCard postId={selectedPostId} />

          {process.env.NODE_ENV === 'development' && (
            <GraphcacheDevTools />
          )}
        </main>

        <footer>
          <h3>Graphcache Features Demonstrated:</h3>
          <ul>
            <li>✅ Normalized caching with entity relationships</li>
            <li>✅ Client-side resolvers for computed fields</li>
            <li>✅ Automatic cache updates after mutations</li>
            <li>✅ Optimistic updates with automatic rollback</li>
            <li>✅ Cache persistence to localStorage</li>
            <li>✅ Efficient query resolution from cache</li>
          </ul>
        </footer>
      </div>
    </Provider>
  );
};

export default GraphcacheExample;