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

export default function TeacherStats({ teacher, embedded = false }) {
  const Content = () => (
    <div className={embedded ? "h-full" : ""}>
      <div className={`flex items-center gap-3 mb-6 ${!embedded ? "p-6 pb-0" : ""}`}>
        <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
          <TrendingUp className="w-6 h-6 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFB300] bg-clip-text text-transparent">
          Statistiques détaillées
        </h3>
      </div>
      
      <div className={`space-y-5 ${!embedded ? "p-6 pt-0" : ""}`}>
        {teacher.review_count > 0 ? (
          <>
            {Object.entries(criteriaConfig).map(([key, { label, icon: Icon, color }]) => {
              const value = teacher[key] || 0;
              const percentage = (value / 5) * 100;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {value.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={percentage} className="h-2 bg-slate-100" />
                    <div 
                      className={`absolute top-0 left-0 h-2 ${color} rounded-full transition-all shadow-sm`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500 text-center">
                Basé sur <span className="font-semibold text-slate-900">{teacher.review_count}</span> avis
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-100">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              Aucune statistique
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Soyez le premier à noter !
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return <Content />;

  return (
    <Card className="bg-white/90 backdrop-blur-md border-slate-200 shadow-xl w-full h-full flex flex-col hover:shadow-2xl transition-shadow duration-300">
      <Content />
    </Card>
  );
}