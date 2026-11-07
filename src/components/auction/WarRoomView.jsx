import React, { useState } from 'react';
import { History, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TextChat from '../TextChat';
import SoldCard from './SoldCard';

const WarRoomView = ({ messages, roomId }) => {
   const [subTab, setSubTab] = useState('activity'); // 'activity' | 'chat'

   return (
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full max-w-4xl mx-auto p-3 sm:p-6">
         {/* Sub-tab Switcher */}
         <div className="flex items-center justify-center p-1 bg-white/5 border border-white/10 rounded-2xl mb-4 shrink-0 max-w-sm mx-auto w-full">
            <button
               onClick={() => setSubTab('activity')}
               className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${subTab === 'activity'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
                  }`}
            >
               <History size={14} />
               <span>Activity Feed</span>
            </button>
            <button
               onClick={() => setSubTab('chat')}
               className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${subTab === 'chat'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
                  }`}
            >
               <MessageSquare size={14} />
               <span>Franchise Chat</span>
            </button>
         </div>

         {/* Content View */}
         <div className="flex-1 min-h-0 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden flex flex-col p-3 sm:p-4">
            <AnimatePresence mode="wait">
               {subTab === 'activity' ? (
                  <motion.div
                     key="activity-feed"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="flex-1 overflow-y-auto custom-scrollbar space-y-3"
                  >
                     {[...messages.filter(m => m.type === 'log' || m.type === 'sold_card').filter(m => !m.text?.includes('New bid:'))].reverse().map((msg, index) => {
                        if (msg.type === 'sold_card') {
                           return (
                              <div key={`log-${msg.id || index}`} className="py-2">
                                 <SoldCard msg={msg} />
                              </div>
                           );
                        }

                        let text = msg.text || '';
                        let displayText = text;
                        if (text.includes('PAUSED')) displayText = 'Auction paused by host';
                        else if (text.includes('RESUMED')) displayText = 'Auction resumed by host';
                        else if (text.endsWith('UNSOLD')) {
                           displayText = `${text.replace('UNSOLD', '').trim()} went unsold`;
                        } else if (text.includes('started')) {
                           displayText = 'Auction started';
                        }

                        return (
                           <div key={`log-${msg.id || index}`} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                              <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                              <p className="text-xs font-semibold text-gray-300 leading-relaxed flex-1">{displayText}</p>
                           </div>
                        );
                     })}

                     {messages.filter(m => m.type === 'log' || m.type === 'sold_card').length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-gray-600">
                           <History size={32} className="mb-2 opacity-40" />
                           <span className="text-xs uppercase font-bold tracking-widest">No auction events yet</span>
                        </div>
                     )}
                  </motion.div>
               ) : (
                  <motion.div
                     key="chat-view"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="flex-1 h-full flex flex-col min-h-0"
                  >
                     <TextChat roomId={roomId} />
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
   );
};

export default WarRoomView;
