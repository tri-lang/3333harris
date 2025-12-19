
import React, { useState, useEffect } from 'react';
import { UserProfile, Comment } from '../types';
import { getComments, saveComment, replyToComment, toggleLikeComment } from '../services/comfyService';
import { MessageSquare, Heart, User, Send, ThumbsUp, Sparkles, MoreHorizontal } from 'lucide-react';

interface GuestbookPageProps {
  user: UserProfile | null;
  onLoginClick: () => void;
}

export const GuestbookPage: React.FC<GuestbookPageProps> = ({ user, onLoginClick }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const refreshComments = () => {
    setComments(getComments());
  };

  useEffect(() => {
    refreshComments();
    const interval = setInterval(refreshComments, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handlePostComment = () => {
    if (!user) { onLoginClick(); return; }
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `c_${Date.now()}`,
      userPhone: user.phone,
      userNickname: user.nickname,
      userAvatar: user.avatarUrl,
      userDepartment: user.department,
      content: newComment,
      timestamp: Date.now(),
      likes: 0,
      replies: []
    };

    saveComment(comment);
    setNewComment('');
    refreshComments();
  };

  const handleReply = (parentId: string) => {
    if (!user) { onLoginClick(); return; }
    if (!replyContent.trim()) return;

    const reply: Comment = {
      id: `r_${Date.now()}`,
      userPhone: user.phone,
      userNickname: user.nickname,
      userAvatar: user.avatarUrl,
      userDepartment: user.department,
      content: replyContent,
      timestamp: Date.now(),
      likes: 0,
      replies: []
    };

    replyToComment(parentId, reply);
    setReplyContent('');
    setReplyingTo(null);
    refreshComments();
  };

  const handleLike = (id: string, isReply: boolean = false, parentId?: string) => {
    toggleLikeComment(id, isReply, parentId);
    refreshComments();
  };

  const formatDate = (ts: number) => {
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-transparent animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
             <Sparkles className="w-3 h-3" /> Community Insights
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">灵感互动广场</h1>
          <p className="text-slate-500 font-medium text-sm">分享您的创意点滴，与更多创作者产生共鸣</p>
        </div>

        {/* Improved Input Area - Compact and centered */}
        <div className="relative group mb-16 max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-indigo-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 p-4 shadow-2xl">
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 overflow-hidden">
                   {user?.avatarUrl ? (
                     <img src={user.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-5 h-5 text-indigo-400" />
                   )}
                </div>
                <div className="flex-1">
                   <textarea
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     placeholder={user ? "此刻在想什么..." : "请登录后开启交流"}
                     className="w-full bg-transparent border-none rounded-xl p-2 text-white placeholder-slate-600 focus:outline-none h-20 resize-none text-sm font-medium transition-all"
                     disabled={!user}
                   />
                   <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2">灵感一触即发</span>
                      <button
                        onClick={handlePostComment}
                        disabled={!user || !newComment.trim()}
                        className="bg-white text-slate-950 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100"
                      >
                        <Send className="w-3 h-3" /> 发表动态
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Multi-column Grid Feed List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {comments.map((comment) => (
            <div key={comment.id} className="relative group flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex gap-4 mb-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-indigo-500/50 transition-colors">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-black text-sm">{(comment.userNickname || comment.userPhone).slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                        <span className="font-black text-white text-sm tracking-tight truncate">{comment.userNickname || comment.userPhone}</span>
                        {comment.userDepartment && <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest opacity-80 shrink-0">{comment.userDepartment}</span>}
                     </div>
                     <span className="text-[8px] font-bold text-slate-600">{formatDate(comment.timestamp)}</span>
                  </div>
               </div>

               <div className="bg-white/5 backdrop-blur-sm rounded-[1.5rem] p-5 border border-white/5 hover:border-white/10 transition-colors shadow-sm flex-1 flex flex-col">
                  <p className="text-slate-300 text-sm leading-relaxed font-medium break-words mb-4">{comment.content}</p>
                  
                  <div className="flex items-center gap-6 mt-auto px-1 pt-4 border-t border-white/5">
                    <button onClick={() => handleLike(comment.id)} className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors ${comment.likes > 0 ? 'text-pink-400' : 'text-slate-600 hover:text-pink-400'}`}>
                        <ThumbsUp className={`w-3 h-3 ${comment.likes > 0 ? 'fill-current' : ''}`} /> {comment.likes || '赞'}
                    </button>
                    <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-400 text-[9px] font-black uppercase tracking-widest transition-colors">
                        <MessageSquare className="w-3 h-3" /> 回复
                    </button>
                  </div>
               </div>

               {replyingTo === comment.id && (
                 <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2 duration-300 px-2">
                    <input 
                      type="text" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="回应..."
                      className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white focus:border-indigo-500/50 outline-none"
                    />
                    <button onClick={() => handleReply(comment.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all">发</button>
                 </div>
               )}

               {/* Threaded Replies - compact */}
               {comment.replies && comment.replies.length > 0 && (
                 <div className="mt-3 space-y-2 pl-4 border-l-2 border-white/5 ml-5">
                    {comment.replies.map(reply => (
                       <div key={reply.id} className="relative py-1">
                          <div className="flex items-center gap-2 mb-1">
                             <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10">
                                {reply.userAvatar ? <img src={reply.userAvatar} className="w-full h-full object-cover" alt="r" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[8px] font-bold">U</div>}
                             </div>
                             <span className="font-bold text-white text-[9px] truncate max-w-[80px]">{reply.userNickname || reply.userPhone}</span>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                             <p className="text-slate-400 text-[10px] font-medium leading-relaxed break-words">{reply.content}</p>
                          </div>
                          <div className="flex mt-1 px-1">
                             <button onClick={() => handleLike(reply.id, true, comment.id)} className={`flex items-center gap-1 text-[7px] font-black uppercase tracking-widest transition-colors ${reply.likes > 0 ? 'text-pink-400' : 'text-slate-600 hover:text-pink-400'}`}>
                                <Heart className={`w-2 h-2 ${reply.likes > 0 ? 'fill-current' : ''}`} /> {reply.likes || 0}
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
               )}
            </div>
          ))}

          {comments.length === 0 && (
             <div className="col-span-full text-center py-20 opacity-30">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-xs font-black uppercase tracking-widest">暂无留言，期待您的发声</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
