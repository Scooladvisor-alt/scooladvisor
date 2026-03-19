import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Shield, 
  Users, 
  MessageSquare, 
  AlertTriangle,
  Eye,
  EyeOff,
  UserX,
  School,
  Trash2,
  Clock
} from "lucide-react";
import MobileHeader from "../components/mobile/MobileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

import AllReports from "../components/moderation/AllReports";
import ReviewModeration from "../components/moderation/ReviewModeration";
import ContactMessages from "../components/moderation/ContactMessages";
import BannedUsers from "../components/moderation/BannedUsers";
import AllSchools from "../components/moderation/AllSchools";
import TrashBin from "../components/moderation/TrashBin";
import RecentContent from "../components/moderation/RecentContent";
import HiddenItems from "../components/moderation/HiddenItems";

export default function ModerationPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingReports: 0,
    recentReviews: 0,
    contactMessages: 0,
    bannedUsers: 0,
    totalSchools: 0,
    deletedItems: 0,
    recentContent: 0,
    hiddenTeachers: 0,
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      if (currentUser.role !== 'admin' && currentUser.role !== 'moderator') {
        navigate(createPageUrl("Schools"));
        return;
      }
      
      setUser(currentUser);
      await loadStats();
    } catch (error) {
      console.error("Access check error:", error);
      navigate(createPageUrl("Schools"));
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const [
        teacherReviews,
        schoolReviews,
        contactMessages,
        bannedUsers,
        allSchools
      ] = await Promise.all([
        base44.entities.TeacherReview.list("-created_date", 50).catch(() => []),
        base44.entities.SchoolReview.list("-created_date", 50).catch(() => []),
        base44.entities.ContactMessage.filter({ status: "pending" }).catch(() => []),
        base44.entities.User.filter({ is_banned: true }).catch(() => []),
        base44.entities.School.list("-created_date", 500).catch(() => [])
      ]);

      let reportsCount = 0;
      try {
        const reports = await base44.entities.Report.filter({ status: "pending" });
        reportsCount += reports.length;
      } catch (error) {}

      try {
        const teacherReports = await base44.entities.TeacherStatusReport.filter({ status: "pending" });
        reportsCount += teacherReports.length;
      } catch (error) {}

      try {
        const fraudReports = await base44.entities.TeacherFraudReport.filter({ status: "pending" });
        reportsCount += fraudReports.length;
      } catch (error) {}

      try {
        const schoolReports = await base44.entities.SchoolReport.filter({ status: "pending" });
        reportsCount += schoolReports.length;
      } catch (error) {}

      const activeSchools = allSchools.filter(s => !s.is_deleted);
      const deletedSchools = allSchools.filter(s => s.is_deleted);
      const rejectedReviews = [...teacherReviews, ...schoolReviews].filter(r => r.status === 'rejected');
      const recentContentCount = activeSchools.length + teacherReviews.length + schoolReviews.length;

      let hiddenCount = 0;
      try {
        const allTeachers = await base44.entities.Teacher.list();
        const hiddenTeachersCount = allTeachers.filter(t => t.is_hidden === true || (t.is_deleted === true && t.is_hidden !== false)).length;
        const hiddenSchoolsCount = allSchools.filter(s => s.status === "banned").length;
        hiddenCount = hiddenTeachersCount + hiddenSchoolsCount;
      } catch {}

      setStats({
        pendingReports: reportsCount,
        recentReviews: teacherReviews.length + schoolReviews.length,
        contactMessages: contactMessages.length,
        bannedUsers: bannedUsers.length,
        totalSchools: activeSchools.filter(s => s.status !== "banned").length,
        deletedItems: deletedSchools.filter(s => s.status !== "banned").length + rejectedReviews.length,
        recentContent: recentContentCount,
        hiddenTeachers: hiddenCount,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Signalements",
      value: stats.pendingReports,
      icon: AlertTriangle,
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-100 dark:border-red-900/50",
      iconBg: "bg-red-100 dark:bg-red-900/50",
      iconColor: "text-red-600 dark:text-red-400",
      valueColor: "text-red-700 dark:text-red-300",
      labelColor: "text-red-500 dark:text-red-400",
      tab: "reports",
      alert: stats.pendingReports > 0
    },
    {
      title: "Contenu récent",
      value: stats.recentContent,
      icon: Clock,
      bg: "bg-violet-50 dark:bg-violet-950/30",
      border: "border-violet-100 dark:border-violet-900/50",
      iconBg: "bg-violet-100 dark:bg-violet-900/50",
      iconColor: "text-violet-600 dark:text-violet-400",
      valueColor: "text-violet-700 dark:text-violet-300",
      labelColor: "text-violet-500 dark:text-violet-400",
      tab: "recent",
      alert: false
    },
    {
      title: "Messages",
      value: stats.contactMessages,
      icon: MessageSquare,
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-100 dark:border-amber-900/50",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      valueColor: "text-amber-700 dark:text-amber-300",
      labelColor: "text-amber-500 dark:text-amber-400",
      tab: "contact",
      alert: stats.contactMessages > 0
    },
    {
      title: "Bannis",
      value: stats.bannedUsers,
      icon: UserX,
      bg: "bg-slate-50 dark:bg-slate-800/50",
      border: "border-slate-200 dark:border-slate-700",
      iconBg: "bg-slate-100 dark:bg-slate-700",
      iconColor: "text-slate-600 dark:text-slate-400",
      valueColor: "text-slate-700 dark:text-slate-300",
      labelColor: "text-slate-500 dark:text-slate-400",
      tab: "banned",
      alert: false
    },
    {
      title: "Établissements",
      value: stats.totalSchools,
      icon: School,
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-100 dark:border-blue-900/50",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-700 dark:text-blue-300",
      labelColor: "text-blue-500 dark:text-blue-400",
      tab: "schools",
      alert: false
    },
    {
      title: "Corbeille",
      value: stats.deletedItems,
      icon: Trash2,
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-100 dark:border-orange-900/50",
      iconBg: "bg-orange-100 dark:bg-orange-900/50",
      iconColor: "text-orange-600 dark:text-orange-400",
      valueColor: "text-orange-700 dark:text-orange-300",
      labelColor: "text-orange-500 dark:text-orange-400",
      tab: "trash",
      alert: false
    },
    {
      title: "Masqués",
      value: stats.hiddenTeachers,
      icon: EyeOff,
      bg: "bg-pink-50 dark:bg-pink-950/30",
      border: "border-pink-100 dark:border-pink-900/50",
      iconBg: "bg-pink-100 dark:bg-pink-900/50",
      iconColor: "text-pink-600 dark:text-pink-400",
      valueColor: "text-pink-700 dark:text-pink-300",
      labelColor: "text-pink-500 dark:text-pink-400",
      tab: "hidden-teachers",
      alert: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <MobileHeader 
        title="Centre de Modération"
        onBack={() => navigate(createPageUrl("Schools"))}
      />
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Centre de Modération</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Connecté en tant que <span className="font-medium text-purple-600 dark:text-purple-400">{user?.full_name}</span></p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            {statCards.map((stat, index) => (
              <motion.button
                key={stat.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  document.querySelector(`[data-value="${stat.tab}"]`)?.click();
                }}
                className={`relative group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border ${stat.bg} ${stat.border} hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer text-center`}
              >
                {stat.alert && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${stat.valueColor}`}>{stat.value}</p>
                  <p className={`text-[10px] font-medium mt-0.5 leading-tight ${stat.labelColor}`}>{stat.title}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-1 gap-1">
            <TabsTrigger value="reports" data-value="reports" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Signalements</span>
              <span className="sm:hidden">🚩</span>
            </TabsTrigger>
            <TabsTrigger value="recent" data-value="recent" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-xs">
              <Clock className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Récents</span>
              <span className="sm:hidden">🕐</span>
            </TabsTrigger>
            <TabsTrigger value="contact" data-value="contact" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 text-xs">
              <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Contact</span>
              <span className="sm:hidden">📧</span>
            </TabsTrigger>
            <TabsTrigger value="banned" data-value="banned" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700 text-xs">
              <UserX className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Bannis</span>
              <span className="sm:hidden">🚫</span>
            </TabsTrigger>
            <TabsTrigger value="schools" data-value="schools" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs">
              <School className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Établissements</span>
              <span className="sm:hidden">🏫</span>
            </TabsTrigger>
            <TabsTrigger value="trash" data-value="trash" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs">
              <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Corbeille</span>
              <span className="sm:hidden">🗑️</span>
            </TabsTrigger>
            <TabsTrigger value="hidden-teachers" data-value="hidden-teachers" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 text-xs">
              <EyeOff className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Masqués</span>
              <span className="sm:hidden">👁️</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Tous les signalements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AllReports onUpdate={loadStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Contenu récemment ajouté
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentContent onUpdate={loadStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  Messages de contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContactMessages onReload={loadStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banned">
            <BannedUsers onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="schools">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="w-5 h-5 text-blue-600" />
                  Tous les établissements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AllSchools onUpdate={loadStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trash">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-orange-600" />
                  Corbeille
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrashBin onUpdate={loadStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hidden-teachers">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeOff className="w-5 h-5 text-pink-600" />
                  Éléments masqués
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HiddenItems onUpdate={loadStats} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}