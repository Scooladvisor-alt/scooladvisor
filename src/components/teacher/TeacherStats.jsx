import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Heart, Brain, FileText, TrendingUp } from "lucide-react";

const criteriaConfig = {
  workload_avg: { label: "Charge de travail", icon: BookOpen, color: "bg-blue-500" },
  friendliness_avg: { label: "Gentillesse", icon: Heart, color: "bg-pink-500" },
  teaching_avg: { label: "Qualité des cours", icon: Brain, color: "bg-purple-500" },
  grading_avg: { label: "Notation", icon: FileText, color: "bg-orange-500" }
};

export default function TeacherStats({ teacher }) {
  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="statsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
      <Card className="bg-white/90 backdrop-blur-md border-slate-200 shadow-xl lg:sticky lg:top-24 w-full h-full flex flex-col hover:shadow-2xl transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 mb-2">
          <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" style={{ stroke: "url(#statsGradient)" }} />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Statistiques détaillées
            </span>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5 flex-1 pr-2">
        {teacher.review_count > 0 ? (
          <>
            {Object.entries(criteriaConfig).map(([key, { label, icon: Icon, color }]) => {
              const value = teacher[key] || 0;
              const percentage = (value / 5) * 100;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-700">{label}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {value.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={percentage} className="h-2 [&>*]:bg-transparent" />
                    <div 
                      className={`absolute top-0 left-0 h-2 ${color} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-200">
              <p className="text-xs sm:text-sm text-slate-600 text-center">
                Basé sur <span className="font-semibold">{teacher.review_count}</span> avis
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600">
              Aucune statistique disponible
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Soyez le premier à noter !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}