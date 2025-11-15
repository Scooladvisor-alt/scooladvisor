import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Star, Award, User, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from 'framer-motion';

const podiumStyles = [
  { // 1st place
    gradient: "from-amber-400 to-yellow-500",
    shadow: "shadow-yellow-500/50",
    iconColor: "text-yellow-600",
    medal: "🥇"
  },
  { // 2nd place
    gradient: "from-slate-300 to-gray-400",
    shadow: "shadow-gray-500/50",
    iconColor: "text-gray-600",
    medal: "🥈"
  },
  { // 3rd place
    gradient: "from-orange-400 to-amber-600",
    shadow: "shadow-orange-500/50",
    iconColor: "text-orange-700",
    medal: "🥉"
  }
];

const PodiumCard = ({ teacher, rank }) => {
  const style = podiumStyles[rank];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: rank * 0.1, type: "spring", stiffness: 200, damping: 15 }}
      className="w-full"
    >
      <Link to={createPageUrl(`TeacherDetail?id=${teacher.id}`)}>
        <div className={`relative group p-4 rounded-2xl bg-gradient-to-br ${style.gradient} text-white shadow-lg ${style.shadow} transition-transform duration-300 hover:-translate-y-2`}>
          <div className="absolute top-2 right-2 text-2xl">{style.medal}</div>
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-16 h-16 border-4 border-white/50 mb-3">
              <AvatarImage src={teacher.photo_url} />
              <AvatarFallback className="bg-white/30 text-white font-bold">{teacher.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-lg truncate w-full">{teacher.name}</h3>
            <p className="text-xs opacity-80 mb-2 truncate w-full">{teacher.subject}</p>
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 text-white fill-white" />
              <span className="font-bold text-base">{teacher.average_rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};


export default function TeacherPodium({ teachers }) {
  return (
    <div className='mb-6'>
      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Award className="w-6 h-6 text-amber-500" />
        Les Professeurs Stars 🌟
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {teachers.map((teacher, index) => (
          <PodiumCard key={teacher.id} teacher={teacher} rank={index} />
        ))}
      </div>
      <hr className="my-6 border-slate-200" />
    </div>
  );
}