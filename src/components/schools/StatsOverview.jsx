import { School, Award, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsOverview({ schools }) {
  const totalSchools = schools.length;
  const avgRating = schools.reduce((sum, s) => sum + (s.average_rating || 0), 0) / totalSchools || 0;
  const totalReviews = schools.reduce((sum, s) => sum + (s.review_count || 0), 0);
  const topRated = schools.filter(s => s.average_rating >= 15).length;

  const stats = [
    { label: "Établissements", value: totalSchools, icon: School, color: "blue" },
    { label: "Note moyenne", value: avgRating.toFixed(1) + "/20", icon: Award, color: "amber" },
    { label: "Avis totaux", value: totalReviews, icon: Users, color: "green" },
    { label: "Bien notés (≥15)", value: topRated, icon: TrendingUp, color: "purple" }
  ];

  const colorClasses = {
    blue: "from-blue-600 to-blue-700",
    amber: "from-amber-500 to-amber-600",
    green: "from-green-600 to-green-700",
    purple: "from-purple-600 to-purple-700"
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-slate-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center shadow-md`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}