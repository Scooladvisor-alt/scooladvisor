import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Smile, BookOpen, Target, TrendingUp } from "lucide-react";

const criteriaConfig = {
  workload_avg: { label: "Charge de travail", icon: Briefcase, color: "bg-blue-500" },
  friendliness_avg: { label: "Gentillesse", icon: Smile, color: "bg-green-500" },
  teaching_avg: { label: "Qualité des cours", icon: BookOpen, color: "bg-purple-500" },
  grading_avg: { label: "Notation", icon: Target, color: "bg-orange-500" }
};

export default function TeacherStats({ teacher }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg lg:sticky lg:top-24 w-full">
      <CardHeader>
        <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-lg sm:text-xl bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent" />
          Statistiques détaillées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5">
        {teacher.review_count > 0 ?
        <>
            {Object.entries(criteriaConfig).map(([key, { label, icon: Icon, color }]) => {
            const value = teacher[key] || 0;
            const percentage = value / 5 * 100;

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
                    style={{ width: `${percentage}%` }} />

                  </div>
                </div>);

          })}

            <div className="pt-4 mt-4 border-t border-slate-200">
              <p className="text-xs sm:text-sm text-slate-600 text-center">
                Basé sur <span className="font-semibold">{teacher.review_count}</span> avis
              </p>
            </div>
          </> :

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
        }
      </CardContent>
    </Card>);

}