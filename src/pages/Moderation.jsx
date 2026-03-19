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
import HiddenTeachers from "../components/moderation/HiddenTeachers";

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

      setStats({
        pendingReports: reportsCount,
        recentReviews: teacherReviews.length + schoolReviews.length,
        contactMessages: contactMessages.length,
        bannedUsers: bannedUsers.length,
        totalSchools: activeSchools.length,
        deletedItems: deletedSchools.length + rejectedReviews.length,
        recentContent: recentContentCount,
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
      title: "Signalements actifs",
      value: stats.pendingReports,
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      tab: "reports"
    },
    {
      title: "Contenu récent",
      value: stats.recentContent,
      icon: Clock,
      color: "from-purple-500 to-purple-600",
      tab: "recent"
    },
    {
      title: "Messages contact",
      value: stats.contactMessages,
      icon: MessageSquare,
      color: "from-amber-500 to-amber-600",
      tab: "contact"
    },
    {
      title: "Utilisateurs bannis",
      value: stats.bannedUsers,
      icon: UserX,
      color: "from-slate-500 to-slate-600",
      tab: "banned"
    },
    {
      title: "Établissements",
      value: stats.totalSchools,
      icon: School,
      color: "from-blue-500 to-blue-600",
      tab: "schools"
    },
    {
      title: "Corbeille",
      value: stats.deletedItems,
      icon: Trash2,
      color: "from-orange-500 to-orange-600",
      tab: "trash"
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Centre de Modération</h1>
              <p className="text-slate-600 dark:text-slate-300">Bienvenue, {user?.full_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-md`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-1 gap-1">
            <TabsTrigger value="reports" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Signalements</span>
              <span className="sm:hidden">🚩</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-xs">
              <Clock className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Récents</span>
              <span className="sm:hidden">🕐</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 text-xs">
              <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Contact</span>
              <span className="sm:hidden">📧</span>
            </TabsTrigger>
            <TabsTrigger value="banned" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700 text-xs">
              <UserX className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Bannis</span>
              <span className="sm:hidden">🚫</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs">
              <School className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Établissements</span>
              <span className="sm:hidden">🏫</span>
            </TabsTrigger>
            <TabsTrigger value="trash" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs">
              <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Corbeille</span>
              <span className="sm:hidden">🗑️</span>
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
        </Tabs>
      </div>
    </div>
  );
}