import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Heart, Brain, FileText, TrendingUp } from "lucide-react";

const criteriaConfig = {
  workload_avg: { label: "Charge de travail", icon: BookOpen, color: "bg-blue-500" },
  friendliness_avg: { label: "Gentillesse", icon: Heart, color: "bg-pink-500" },
  teaching_avg: { label: "Qualité des cours", icon: Brain, color: "bg-purple-500" },
  grading_avg: { label: "Notation", icon: FileText, color: "bg-orange-500" }
};

export default function TeacherStats({ teacher: initialTeacher, embedded = false }) {
  const [teacher, setTeacher] = useState(initialTeacher);

  useEffect(() => {
    if (!initialTeacher?.id) return;

    // Charger les données initiales
    const loadTeacher = async () => {
      try {
        const teachers = await base44.entities.Teacher.filter({ id: initialTeacher.id });
        if (teachers[0]) {
          setTeacher(teachers[0]);
        }
      } catch (error) {
        console.error("Error loading teacher:", error);
      }
    };

    loadTeacher();

    // S'abonner aux changements en temps réel
    const unsubscribe = base44.entities.Teacher.subscribe((event) => {
      if (event.id === initialTeacher.id && event.type === 'update') {
        setTeacher(event.data);
      }
    });

    return () => unsubscribe();
  }, [initialTeacher?.id]);
  const Content = () => (
    <div className={embedded ? "h-full" : ""}>
      <div className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 dark:from-amber-500/20 dark:via-orange-500/20 dark:to-red-500/20 p-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Statistiques détaillées
          </h3>
        </div>
      </div>
      
      <div className="space-y-5 p-6 pt-2">
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
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {value.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={percentage} className="h-2 bg-slate-100 dark:bg-slate-700" />
                    <div 
                      className={`absolute top-0 left-0 h-2 ${color} rounded-full transition-all shadow-sm`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Basé sur <span className="font-semibold text-slate-900 dark:text-white">{teacher.review_count}</span> avis
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-100 dark:border-amber-900">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Aucune statistique
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Soyez le premier à noter !
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return <Content />;

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-slate-200 dark:border-slate-700 border-x-0 sm:border-x shadow-xl w-full h-full flex flex-col hover:shadow-2xl transition-shadow duration-300 rounded-none sm:rounded-xl">
      <Content />
    </Card>
  );
}