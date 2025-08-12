// React Query Optimistic Updates and Error Boundaries Exercise
// Implement optimistic updates and comprehensive error handling with React Query + GraphQL

import React, { useState, useCallback, useErrorBoundary } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  useMutationState,
} from '@tanstack/react-query';

// TODO 1: Optimistic Update Patterns
// Implement sophisticated optimistic update strategies

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  createdAt: string;
  status: 'published' | 'draft' | 'pending';
}

interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  status: 'published' | 'pending' | 'failed';
}

// TODO: Implement optimistic post creation
export function useOptimisticCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newPost: Omit<Post, 'id' | 'createdAt' | 'status'>) => {
      // TODO: Simulate API call with potential failure
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Simulate random failures for demonstration
      if (Math.random() < 0.3) {
        throw new Error('Failed to create post on server');
      }
      
      return {
        ...newPost,
        id: `post_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'published' as const,
      };
    },
    onMutate: async (newPost) => {
      // TODO: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      
      // TODO: Snapshot previous value
      const previousPosts = queryClient.getQueryData(['posts']);
      
      // TODO: Create optimistic post
      const optimisticPost: Post = {
        ...newPost,
        id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      
      // TODO: Optimistically update posts list
      queryClient.setQueryData(['posts'], (old: { posts: Post[] } | undefined) => ({
        posts: [optimisticPost, ...(old?.posts || [])],
      }));
      
      // TODO: Update author post count optimistically
      if (newPost.authorId) {
        queryClient.setQueryData(
          ['user', newPost.authorId],
          (old: { user: any } | undefined) => {
            if (old) {
              return {
                user: {
                  ...old.user,
                  postsCount: old.user.postsCount + 1,
                },
              };
            }
            return old;
          }
        );
      }
      
      return { previousPosts, optimisticPost };
    },
    onError: (err, newPost, context) => {
      // TODO: Rollback optimistic updates
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      
      // TODO: Rollback author post count
      if (newPost.authorId) {
        queryClient.setQueryData(
          ['user', newPost.authorId],
          (old: { user: any } | undefined) => {
            if (old) {
              return {
                user: {
                  ...old.user,
                  postsCount: Math.max(0, old.user.postsCount - 1),
                },
              };
            }
            return old;
          }
        );
      }
      
      // TODO: Show error state in optimistic post
      queryClient.setQueryData(['posts'], (old: { posts: Post[] } | undefined) => {
        if (!old || !context?.optimisticPost) return old;
        
        return {
          posts: old.posts.map(post => 
            post.id === context.optimisticPost.id
              ? { ...post, status: 'failed' as const }
              : post
          ),
        };
      });
    },
    onSuccess: (data, variables, context) => {
      // TODO: Replace optimistic post with real data
      queryClient.setQueryData(['posts'], (old: { posts: Post[] } | undefined) => {
        if (!old || !context?.optimisticPost) return old;
        
        return {
          posts: old.posts.map(post => 
            post.id === context.optimisticPost.id ? data : post
          ),
        };
      });
    },
    onSettled: () => {
      // TODO: Ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// TODO 2: Complex Optimistic Updates
// Handle nested data and complex relationships

export function useOptimisticAddComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newComment: Omit<Comment, 'id' | 'createdAt' | 'status'>) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Simulate failures
      if (Math.random() < 0.2) {
        throw new Error('Comment creation failed');
      }
      
      return {
        ...newComment,
        id: `comment_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'published' as const,
      };
    },
    onMutate: async (newComment) => {
      // TODO: Cancel related queries
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['comments', newComment.postId] });
      
      // TODO: Snapshot previous values
      const previousPosts = queryClient.getQueryData(['posts']);
      const previousComments = queryClient.getQueryData(['comments', newComment.postId]);
      
      // TODO: Create optimistic comment
      const optimisticComment: Comment = {
        ...newComment,
        id: `temp_comment_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      
      // TODO: Add comment to comments list
      queryClient.setQueryData(['comments', newComment.postId], (old: { comments: Comment[] } | undefined) => ({
        comments: [...(old?.comments || []), optimisticComment],
      }));
      
      // TODO: Update post comment count
      queryClient.setQueryData(['posts'], (old: { posts: Post[] } | undefined) => {
        if (!old) return old;
        
        return {
          posts: old.posts.map(post => 
            post.id === newComment.postId
              ? { ...post, commentsCount: post.commentsCount + 1 }
              : post
          ),
        };
      });
      
      return { previousPosts, previousComments, optimisticComment };
    },
    onError: (err, newComment, context) => {
      // TODO: Rollback all optimistic changes
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', newComment.postId], context.previousComments);
      }
    },
    onSuccess: (data, variables, context) => {
      // TODO: Replace optimistic comment with real data
      queryClient.setQueryData(['comments', variables.postId], (old: { comments: Comment[] } | undefined) => {
        if (!old || !context?.optimisticComment) return old;
        
        return {
          comments: old.comments.map(comment => 
            comment.id === context.optimisticComment.id ? data : comment
          ),
        };
      });
    },
  });
}

// TODO 3: Error Recovery Patterns
// Implement sophisticated error handling and recovery

interface ErrorRecoveryOptions {
  showErrorBoundary?: boolean;
  retryable?: boolean;
  rollback?: boolean;
  persistOptimistic?: boolean;
}

export function useErrorRecovery() {
  const queryClient = useQueryClient();
  
  const recoverFromError = useCallback((
    error: Error,
    mutationKey: string,
    options: ErrorRecoveryOptions = {}
  ) => {
    const { 
      showErrorBoundary = false,
      retryable = true,
      rollback = true,
      persistOptimistic = false 
    } = options;
    
    // TODO: Log error for monitoring
    console.error(`Mutation ${mutationKey} failed:`, error);
    
    // TODO: Categorize error type
    const errorType = categorizeError(error);
    
    // TODO: Handle different error types
    switch (errorType) {
      case 'network':
        // TODO: Network errors might be retryable
        if (retryable) {
          // TODO: Implement retry logic
        }
        break;
        
      case 'validation':
        // TODO: Validation errors should not be retried
        if (rollback) {
          // TODO: Rollback optimistic updates
        }
        break;
        
      case 'server':
        // TODO: Server errors might need error boundary
        if (showErrorBoundary) {
          throw error;
        }
        break;
    }
    
    // TODO: Persist failed optimistic updates for later retry
    if (persistOptimistic) {
      // TODO: Store in local storage or IndexedDB
    }
  }, [queryClient]);
  
  return { recoverFromError };
}

function categorizeError(error: Error): 'network' | 'validation' | 'server' | 'unknown' {
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'network';
  }
  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return 'validation';
  }
  if (error.message.includes('server') || error.message.includes('500')) {
    return 'server';
  }
  return 'unknown';
}

// TODO 4: Mutation State Management
// Track and display mutation states across components

export const MutationStateTracker: React.FC = () => {
  // TODO: Track all mutation states
  const mutations = useMutationState({
    filters: { status: 'pending' },
  });
  
  const failedMutations = useMutationState({
    filters: { status: 'error' },
  });
  
  return (
    <div style={{ 
      position: 'fixed',
      top: '16px',
      right: '16px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minWidth: '200px',
      zIndex: 1000,
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Mutation Status</h4>
      
      <div style={{ fontSize: '12px' }}>
        <div>Active: {mutations.length}</div>
        <div>Failed: {failedMutations.length}</div>
      </div>
      
      {mutations.map((mutation, index) => (
        <div key={index} style={{ 
          fontSize: '11px', 
          color: '#666',
          marginTop: '4px',
        }}>
          ⏳ {mutation.mutationKey?.join(' ') || 'Unknown'}
        </div>
      ))}
      
      {failedMutations.map((mutation, index) => (
        <div key={index} style={{ 
          fontSize: '11px', 
          color: '#e74c3c',
          marginTop: '4px',
        }}>
          ❌ {mutation.mutationKey?.join(' ') || 'Unknown'}
        </div>
      ))}
    </div>
  );
};

// TODO 5: Error Boundary Component
// Create specialized error boundary for GraphQL/React Query errors

interface GraphQLErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class GraphQLErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<any> }>,
  GraphQLErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): GraphQLErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // TODO: Log to error reporting service
    console.error('GraphQL Error Boundary caught an error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} errorInfo={this.state.errorInfo} />;
    }
    
    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{
  error?: Error;
  errorInfo?: React.ErrorInfo;
}> = ({ error, errorInfo }) => (
  <div style={{
    border: '2px solid #e74c3c',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px',
    backgroundColor: '#ffe6e6',
  }}>
    <h3 style={{ color: '#c0392b', marginTop: 0 }}>
      🚨 Something went wrong
    </h3>
    <p><strong>Error:</strong> {error?.message}</p>
    <details style={{ marginTop: '16px' }}>
      <summary>Error Details</summary>
      <pre style={{ 
        fontSize: '12px',
        backgroundColor: '#f8f8f8',
        padding: '12px',
        borderRadius: '4px',
        overflow: 'auto',
        marginTop: '8px',
      }}>
        {error?.stack}
      </pre>
    </details>
    <button 
      onClick={() => window.location.reload()}
      style={{
        marginTop: '16px',
        padding: '8px 16px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      Reload Page
    </button>
  </div>
);

// TODO 6: Demonstration Components

export const OptimisticPostCreator: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const createPostMutation = useOptimisticCreatePost();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) return;
    
    createPostMutation.mutate({
      title,
      content,
      authorId: 'user_1',
      author: {
        id: 'user_1',
        name: 'Current User',
        avatar: '👤',
      },
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
    });
    
    setTitle('');
    setContent('');
  };
  
  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      <h3>Create Post (Optimistic)</h3>
      <input
        type="text"
        placeholder="Post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
      />
      <textarea
        placeholder="Post content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
      />
      <button 
        type="submit"
        disabled={createPostMutation.isPending}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
};

export const PostsList: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      // TODO: Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { posts: [] as Post[] };
    },
  });
  
  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div>Error loading posts</div>;
  
  return (
    <div>
      <h3>Posts</h3>
      {data?.posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const addCommentMutation = useOptimisticAddComment();
  
  const handleAddComment = () => {
    addCommentMutation.mutate({
      content: 'This is a test comment',
      postId: post.id,
      authorId: 'user_1',
      author: { id: 'user_1', name: 'Current User' },
    });
  };
  
  const getStatusIcon = () => {
    switch (post.status) {
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '✅';
    }
  };
  
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: post.status === 'failed' ? '#ffe6e6' : 'white',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <span>{getStatusIcon()}</span>
        <h4 style={{ margin: '0 0 0 8px' }}>{post.title}</h4>
      </div>
      <p>{post.content}</p>
      <div style={{ fontSize: '12px', color: '#666' }}>
        👤 {post.author.name} • ❤️ {post.likesCount} • 💬 {post.commentsCount}
      </div>
      <button 
        onClick={handleAddComment}
        disabled={addCommentMutation.isPending}
        style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
      >
        {addCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
      </button>
    </div>
  );
};

// TODO 7: Main Exercise Component
export const ReactQueryOptimisticExercise: React.FC = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: (failureCount, error) => {
          // TODO: Smart retry logic for mutations
          const errorType = categorizeError(error);
          if (errorType === 'network' && failureCount < 2) {
            return true;
          }
          return false;
        },
      },
    },
  });
  
  return (
    <GraphQLErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Optimistic Updates & Error Boundaries</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Demonstrating sophisticated optimistic update patterns and error handling 
            strategies with React Query and GraphQL.
          </p>
          
          <MutationStateTracker />
          
          <OptimisticPostCreator />
          <PostsList />
          
          <div style={{ 
            marginTop: '32px', 
            padding: '16px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}>
            <h4>🎯 Features Demonstrated:</h4>
            <ul>
              <li>Complex optimistic updates with nested data</li>
              <li>Error rollback and recovery patterns</li>
              <li>Mutation state tracking across components</li>
              <li>Error boundaries for GraphQL operations</li>
              <li>Smart retry logic based on error types</li>
            </ul>
          </div>
        </div>
      </QueryClientProvider>
    </GraphQLErrorBoundary>
  );
};

export default ReactQueryOptimisticExercise;