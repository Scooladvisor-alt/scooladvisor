import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { security } from "../shared/security";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Plus, ChevronDown, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const predefinedSubjects = [
"Français",
"Mathématiques",
"Histoire-Géographie",
"Enseignement moral et civique",
"Anglais",
"Espagnol",
"Allemand",
"Sciences de la Vie et de la Terre (SVT)",
"Physique-Chimie",
"Technologie",
"Éducation physique et sportive (EPS)",
"Arts plastiques",
"Éducation musicale",
"Philosophie",
"Sciences économiques et sociales (SES)",
"Numérique et sciences informatiques",
"Droit",
"Management",
"Sciences de gestion et numérique"];


const teacherAvatars = [
  { id: 'avatar1', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/e9adea65a_3d-stylized-portrait-of-a-40-year-old-french-femal1.png", name: "Avatar 1" },
  { id: 'avatar2', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/ee3b6a834_3d-stylized-portrait-of-a-40-year-old-french-femal.png", name: "Avatar 2" },
  { id: 'avatar3', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/21140f986_3d-stylized-portrait-of-a-40-year-old-french-male-1.png", name: "Avatar 3" },
  { id: 'avatar4', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/9c2debfb2_3d-stylized-portrait-of-a-40-year-old-french-male-.png", name: "Avatar 4" },
  { id: 'avatar5', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/6477234f2_3d-stylized-portrait-of-a-47-year-old-french-femal.png", name: "Avatar 5" },
  { id: 'avatar6', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4ad46a841_a-3d-stylized-character-designed-as-a-wise--clever.png", name: "Avatar 6" },
  { id: 'avatar7', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/8548ab7bc_a-3d-stylized-character-of-a-distinguished-senior-.png", name: "Avatar 7" },
  { id: 'avatar8', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/2df7514e1_a-3d-stylized-character-of-a-far-left-male-profess1.png", name: "Avatar 8" },
  { id: 'avatar9', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cb005e0e3_a-3d-stylized-character-of-a-far-left-male-profess.png", name: "Avatar 9" },
  { id: 'avatar10', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/bfb28ca03_a-3d-stylized-character-of-a-mature-black-female-p.png", name: "Avatar 10" },
  { id: 'avatar11', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1df71def2_a-3d-stylized-character-of-a-middle-aged-bald-male.png", name: "Avatar 11" },
  { id: 'avatar12', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/3401f44f9_a-3d-stylized-character-of-a-middle-aged-male-prof1.png", name: "Avatar 12" },
  { id: 'avatar13', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/8df82aac9_a-3d-stylized-character-of-a-middle-aged-male-prof.png", name: "Avatar 13" },
  { id: 'avatar14', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d543c99da_a-3d-stylized-character-of-a-young-black-female-pr.png", name: "Avatar 14" },
  { id: 'avatar15', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/3f9e2d766_a-3d-stylized-character-of-a-young-male-professor-.png", name: "Avatar 15" },
  { id: 'avatar16', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1635b03d7_a-3d-stylized-character-of-a-young-progressive-mal.png", name: "Avatar 16" },
  { id: 'avatar17', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1db025fc3_a-3d-stylized-character-of-an-elderly-male-profess.png", name: "Avatar 17" },
  { id: 'avatar18', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/00300b279_a-3d-stylized-character-unpeu-de-cheveux-of-a-youn.png", name: "Avatar 18" },
  { id: 'avatar19', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/74fa7afa3_a-3d-stylized-male-character-representing-a-black-1.png", name: "Avatar 19" },
  { id: 'avatar20', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/095c14bd5_a-3d-stylized-male-character-representing-a-black-.png", name: "Avatar 20" },
  { id: 'avatar21', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/724bfaeea_a-3d-stylized-male-character-representing-a-young-.png", name: "Avatar 21" },
  { id: 'avatar22', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/87dfbfbe1_a-3d-stylized-portrait-of-a-40-year-old-french-wom.png", name: "Avatar 22" },
  { id: 'avatar23', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/9ca4c4bc1_a-3d-stylized-portrait-of-a-51-year-old-french-wom.png", name: "Avatar 23" },
  { id: 'avatar24', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/38510b2d8_a-3d-stylized-portrait-of-a-55-year-old-french-fem.png", name: "Avatar 24" },
  { id: 'avatar25', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/7f487a938_a-3d-stylized-portrait-of-a-75-year-old-obese-fema.png", name: "Avatar 25" },
  { id: 'avatar26', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/2f1a80b2d_a-3d-stylized-portrait-of-a-young-french-male-prof.png", name: "Avatar 26" },
  { id: 'avatar27', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4d5fc138f_a-high-quality-3d-semi-realistic-avatar-of-a-50-wo.png", name: "Avatar 27" },
  { id: 'avatar28', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4fdcd180b_a-high-quality-3d-semi-realistic-hrender-of-a-wise.png", name: "Avatar 28" },
  { id: 'avatar29', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/844474e63_a-high-quality-3d-stylized-character-of-a-senior-b.png", name: "Avatar 29" },
  { id: 'avatar30', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c4f7b9868_a-professional-front-facing-portrait-of-a-35-50-ye.png", name: "Avatar 30" },
  { id: 'avatar31', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/ddc1f0845_a-professional-front-facing-portrait-of-a-45-year-1.png", name: "Avatar 31" },
  { id: 'avatar32', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d887d1ae9_a-professional-front-facing-portrait-of-a-45-year-2.png", name: "Avatar 32" },
  { id: 'avatar33', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/7af406a5a_a-professional-front-facing-portrait-of-a-45-year-.png", name: "Avatar 33" },
  { id: 'avatar34', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d8f3162c1_a-semi-realistic-3d-stylized-portrait-of-a-40-year.png", name: "Avatar 34" },
  { id: 'avatar35', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1c937245d_a-semi-realistic-3d-stylized-portrait-of-a-50-year.png", name: "Avatar 35" },
  { id: 'avatar36', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/472e9adfb_a-semi-realistic-3d-stylized-portrait-of-a-52-year1.png", name: "Avatar 36" },
  { id: 'avatar37', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/e2573f551_a-spanish-man--25-35-years-old--fair-to-light-oliv1.png", name: "Avatar 37" },
  { id: 'avatar38', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5646d4b4f_a-spanish-man--65-years-old--fair-to-light-olive-s.png", name: "Avatar 38" },
  { id: 'avatar39', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/b57fdfc5a_a-women-50yeaurs-to-middle-aged-east-asian-man--ch1.png", name: "Avatar 39" },
  { id: 'avatar40', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/18be337da_a-women-50yeaurs-to-middle-aged-east-asian-man--ch.png", name: "Avatar 40" },
  { id: 'avatar41', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cbacb8a2b_a-spanish-women--35-50-years-years-old--fair-to-li.png", name: "Avatar 41" },
  { id: 'avatar42', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/b5c3ddb16_a-spanish-man--25-35-years-old--fair-to-light-oliv.png", name: "Avatar 42" },
  { id: 'avatar43', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/23fee7aaa_a-semi-realistic-3d-stylized-portrait-of-a-52-year.png", name: "Avatar 43" },
  { id: 'avatar44', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/7a1cfcb44_a-young--expressive-female-professor--with-grey-ha.png", name: "Avatar 44" },
  { id: 'avatar45', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/50cf6dea1_a-young--expressive-female-professor-in-her-early-.png", name: "Avatar 45" },
  { id: 'avatar46', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/938b4aa3e_a-young--expressive-female-professor-with-short-or.png", name: "Avatar 46" },
  { id: 'avatar47', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/61514bb04_a-young--expressive-female-professor-with-very-lon.png", name: "Avatar 47" },
  { id: 'avatar48', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c47eadb70_c-est-un-professeur-avec-les-cheveux-tres-tres-noi.png", name: "Avatar 48" },
  { id: 'avatar49', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/9dd02b6cf_front-facing-3d-avatar-of-a--50-year-old-woman-wit.png", name: "Avatar 49" },
  { id: 'avatar50', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/88bc759ad_image1.png", name: "Avatar 50" },
  { id: 'avatar51', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/7c74ba560_image2.png", name: "Avatar 51" },
  { id: 'avatar52', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/8fbe58256_image4.png", name: "Avatar 52" },
  { id: 'avatar53', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/b38248dc3_image6.png", name: "Avatar 53" },
  { id: 'avatar54', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1bff0ac2c_image7.png", name: "Avatar 54" },
  { id: 'avatar55', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/415e68f28_professional-male-teacher-avatar--35-40-years-old-.png", name: "Avatar 55" },
  { id: 'avatar56', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1cef01048_professional-male-teacher-avatar--35-40-years-old-1.png", name: "Avatar 56" },
  { id: 'avatar57', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/df0321af3_image.png", name: "Avatar 57" },
  { id: 'avatar58', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/0c61d36c9_image9.png", name: "Avatar 58" },
  { id: 'avatar59', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/a25406217_image8.png", name: "Avatar 59" },
  { id: 'avatar60', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/8a69e3e71_image5.png", name: "Avatar 60" },
  { id: 'avatar61', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c65133277_image3.png", name: "Avatar 61" },
  { id: 'avatar62', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/eb942acac_une-professeure-de-45-ans--confiante-et-rus-e--ave.png", name: "Avatar 62" },
  { id: 'avatar63', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d9bdf8495_professional-teacher-avatar-female-70-years-skin-t.png", name: "Avatar 63" },
  { id: 'avatar64', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/0d695947c_professional-teacher-avatar-female-50-years-skin-t.png", name: "Avatar 64" },
  { id: 'avatar65', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/afe010464_professional-teacher-avatar-female-50-years-light-.png", name: "Avatar 65" },
  { id: 'avatar66', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c9e047778_professional-teacher-avatar-female-45-years-light-.png", name: "Avatar 66" },
  { id: 'avatar67', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4b4198974_professional-teacher-avatar-female-35-40-years-lig.png", name: "Avatar 67" },
  { id: 'avatar68', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/751d922d9_professional-teacher-avatar-female-35-40-years-lig1.png", name: "Avatar 68" },
  { id: 'avatar69', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/0ddd02323_professional-teacher-avatar-female-35-40-years--in.png", name: "Avatar 69" },
  { id: 'avatar70', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f01c15848_professional-teacher-avatar-female-35-40-years-bla.png", name: "Avatar 70" },
  { id: 'avatar71', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f80d9669a_professional-teacher-avatar--male-metisse-around-4.png", name: "Avatar 71" },
  { id: 'avatar72', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c567f6ba3_professional-teacher-avatar--male--around-50-years.png", name: "Avatar 72" },
  { id: 'avatar73', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f76db8d23_professional-teacher-avatar--male--around-55-60-ye.png", name: "Avatar 73" },
  { id: 'avatar74', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4e3a17c97_professional-teacher-avatar--male--around-50-years1.png", name: "Avatar 74" },
  { id: 'avatar75', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1bc5a3bd7_professional-teacher-avatar--male--around-40-years.png", name: "Avatar 75" },
  { id: 'avatar76', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4ebee2697_professional-teacher-avatar--male--around-35-45-ye.png", name: "Avatar 76" },
  { id: 'avatar77', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/883e22ed3_professional-teacher-avatar--male--around-35-45-ye2.png", name: "Avatar 77" },
  { id: 'avatar78', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/06d1e6c9c_professional-teacher-avatar--male--around-35-45-ye1.png", name: "Avatar 78" },
  { id: 'avatar79', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/7e0a83cde_professional-teacher-avatar--male--around-35-40-ye.png", name: "Avatar 79" },
  { id: 'avatar80', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/9d7d36c37_professional-teacher-avatar--male--around-35-40-ye1.png", name: "Avatar 80" },
  { id: 'avatar81', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/21c9b9a47_professional-teacher-avatar--male--35-40-years-old.png", name: "Avatar 81" },
  { id: 'avatar82', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f461233bd_professional-teacher-avatar--female--around-50-yea.png", name: "Avatar 82" },
  { id: 'avatar83', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/8b7a29fae_professional-teacher-avatar--female--around-40-yea.png", name: "Avatar 83" },
  { id: 'avatar84', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4766629bb_professional-teacher-avatar--female--around-35-yea.png", name: "Avatar 84" }
];


export default function AddTeacherDialog({ open, onOpenChange, schoolId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [showMoreAvatars, setShowMoreAvatars] = useState(false);
  const [avatarsList, setAvatarsList] = useState(teacherAvatars);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    customSubject: "",
    photo_url: teacherAvatars.length > 0 ? teacherAvatars[0].url : "",
    is_former: false
  });

  useEffect(() => {
    loadAvatarsOrder();
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const user = await base44.auth.me();
      setIsAdmin(user && (user.role === 'admin' || user.email === 'antownin@gmail.com'));
    } catch (e) {
      setIsAdmin(false);
    }
  };

  const loadAvatarsOrder = async () => {
    try {
      const configs = await base44.entities.AppConfig.filter({ key: "teacher_avatars_order" });
      if (configs.length > 0 && configs[0].value && Array.isArray(configs[0].value.order)) {
        const orderedIds = configs[0].value.order;
        // Reorder avatars based on saved IDs, append new ones at the end
        const orderedAvatars = [];
        const avatarsMap = new Map(teacherAvatars.map(a => [a.id, a]));
        
        orderedIds.forEach(id => {
          if (avatarsMap.has(id)) {
            orderedAvatars.push(avatarsMap.get(id));
            avatarsMap.delete(id);
          }
        });
        
        // Add remaining (new) avatars
        avatarsMap.forEach(avatar => orderedAvatars.push(avatar));
        setAvatarsList(orderedAvatars);
        
        // Update selected photo if it was the default first one
        if (formData.photo_url === teacherAvatars[0].url && orderedAvatars.length > 0) {
           // Only change if user hasn't selected something else manually (hard to track here but ok for init)
        }
      }
    } catch (error) {
      console.error("Error loading avatars order:", error);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(avatarsList);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAvatarsList(items);

    // Save new order
    try {
      const configs = await base44.entities.AppConfig.filter({ key: "teacher_avatars_order" });
      const newOrder = items.map(a => a.id);
      
      if (configs.length > 0) {
        await base44.entities.AppConfig.update(configs[0].id, {
          value: { order: newOrder }
        });
      } else {
        await base44.entities.AppConfig.create({
          key: "teacher_avatars_order",
          value: { order: newOrder }
        });
      }
    } catch (error) {
      console.error("Error saving avatars order:", error);
    }
  };

  const checkTeacherLimits = async () => {
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return { ok: false, message: "Utilisateur non authentifié." };
    }

    if (user.email === 'antownin@gmail.com') {
      return { ok: true, userEmail: user.email };
    }

    const teachersInSchool = await base44.entities.Teacher.filter({
      school_id: schoolId,
      created_by: user.email
    });

    if (teachersInSchool.length >= 5) {
      return { ok: false, message: "Vous avez déjà ajouté 5 professeurs dans cet établissement. Maximum 5 par établissement." };
    }

    const allTeachers = await base44.entities.Teacher.filter({
      created_by: user.email
    });

    if (allTeachers.length >= 10) {
      return { ok: false, message: "Vous avez atteint la limite de 10 professeurs ajoutés au total." };
    }

    return { ok: true, userEmail: user.email };
  };

  const sendToModerationWebhook = async (teacherData) => {
    try {
      const response = await fetch('https://n8n.srv996204.hstgr.cloud/webhook/fea1f7e8-a1c0-40fb-a64b-c330dbe1e73d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'teacher_creation',
          teacher_id: teacherData.id,
          teacher_name: teacherData.name,
          subject: teacherData.subject,
          school_id: schoolId,
          created_by: teacherData.created_by,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      const action = result?.output?.action || result?.action;

      if (action === 'delete') {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending to moderation webhook:", error);
      return true;
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem('pending_teacher_submission_school_' + schoolId);
    if (savedData && open) {
      try {
        const parsed = JSON.parse(savedData);
        // Fusionner avec les valeurs par défaut
        setFormData(prev => ({ ...prev, ...parsed }));
        localStorage.removeItem('pending_teacher_submission_school_' + schoolId);
      } catch (e) {
        console.error("Failed to parse saved teacher submission", e);
        localStorage.removeItem('pending_teacher_submission_school_' + schoolId);
      }
    }
  }, [open, schoolId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check authentication
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      user = null;
    }

    if (!user) {
      localStorage.setItem('pending_teacher_submission_school_' + schoolId, JSON.stringify(formData));
      await base44.auth.redirectToLogin(window.location.href);
      return;
    }

    // SECURITY: Check Permissions
    if (!security.canPost(user)) {
      setError("Action non autorisée.");
      setLoading(false);
      return;
    }

    const limitCheck = await checkTeacherLimits();
    if (!limitCheck.ok) {
      setError(limitCheck.message);
      setLoading(false);
      return;
    }

    // SECURITY: Sanitize inputs
    const cleanName = security.sanitize(formData.name);
    const finalSubjectRaw = showCustomSubject ? formData.customSubject : formData.subject;
    const cleanSubject = security.sanitize(finalSubjectRaw);

    if (!cleanSubject || !cleanName) {
      setError("Veuillez vérifier les champs (caractères interdits détectés).");
      setLoading(false);
      return;
    }

    // SECURITY: Anti-Duplicate Check
    const duplicateCheck = await base44.entities.Teacher.filter({
      school_id: schoolId,
      name: cleanName
    });

    if (duplicateCheck.length > 0) {
      setError("Ce professeur existe déjà dans cet établissement.");
      setLoading(false);
      return;
    }

    try {
      const tempTeacher = {
        name: cleanName,
        subject: cleanSubject,
        school_id: schoolId,
        created_by: limitCheck.userEmail,
        id: 'temp-' + Date.now()
      };

      const isApproved = await sendToModerationWebhook(tempTeacher);

      if (!isApproved) {
        setError("Cette demande d'ajout de professeur a été refusée par la modération. Merci de vérifier les informations.");
        setLoading(false);
        return;
      }

      const newTeacher = await base44.entities.Teacher.create({
        school_id: schoolId,
        name: cleanName,
        subject: cleanSubject,
        photo_url: formData.photo_url,
        status: "approved",
        average_rating: 0,
        workload_avg: 0,
        friendliness_avg: 0,
        teaching_avg: 0,
        grading_avg: 0,
        review_count: 0,
        status_report_count: 0,
        is_former: formData.is_former
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setFormData({ name: "", subject: "", customSubject: "", photo_url: teacherAvatars.length > 0 ? teacherAvatars[0].url : "", is_former: false });
        setShowCustomSubject(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error creating teacher:", err);
      setError("Erreur lors de l'ajout du professeur: " + (err.message || ""));
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl
        [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 
        [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full 
        [&::-webkit-scrollbar-thumb]:hover:bg-gray-500">






        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Ajouter un professeur
            </span>
          </DialogTitle>
        </DialogHeader>

        {success &&
        <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs sm:text-sm">
              ✅ Professeur ajouté avec succès !
            </AlertDescription>
          </Alert>
        }

        {error &&
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        }

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Nom du professeur *</Label>
            <div className="flex items-center gap-3">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="M. Dupont"
                className="h-9 sm:h-10 text-xs sm:text-sm flex-1" />
              <div className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-blue-50 px-3 py-2 rounded-lg border border-pink-200">
                <input
                  type="checkbox"
                  id="is_former"
                  checked={formData.is_former}
                  onChange={(e) => setFormData({ ...formData, is_former: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                <label htmlFor="is_former" className="text-xs font-medium text-orange-800 whitespace-nowrap cursor-pointer">
                  Ancien prof
                </label>
              </div>
            </div>
          </div>

          {!showCustomSubject ?
          <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="subject" className="text-xs sm:text-sm">Matière enseignée *</Label>
              <Select
              value={formData.subject}
              onValueChange={(value) => {
                if (value === "__add_custom__") {
                  setShowCustomSubject(true);
                  setFormData({ ...formData, subject: "" });
                } else {
                  setFormData({ ...formData, subject: value });
                }
              }}>

                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Sélectionnez une matière" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem
                  value="__add_custom__"
                  className="bg-gradient-to-r from-pink-50 to-rose-50 border-b-2 border-pink-200 font-semibold text-pink-700 hover:bg-pink-100">

                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Ajouter une autre matière
                    </div>
                  </SelectItem>
                  {predefinedSubjects.map((subject) =>
                <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                )}
                </SelectContent>
              </Select>
            </div> :

          <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="customSubject" className="text-xs sm:text-sm">Autre matière *</Label>
              <Input
              id="customSubject"
              value={formData.customSubject}
              onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
              required
              placeholder="Entrez le nom de la matière"
              className="h-9 sm:h-10 text-xs sm:text-sm" />

              <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCustomSubject(false);
                setFormData({ ...formData, customSubject: "" });
              }}
              className="w-full h-8 text-xs">

                Retour aux matières prédéfinies
              </Button>
            </div>
          }

          <div className="space-y-1 sm:space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs sm:text-sm">Avatar du professeur</Label>
              {isAdmin && <span className="text-[10px] text-blue-600 font-medium">Mode Admin : Déplace les avatars pour changer l'ordre</span>}
            </div>
            
            <div className="w-full bg-slate-50 rounded-lg p-2 sm:p-3 border border-slate-200">
              {avatarsList.length > 0 ? (
                isAdmin ? (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="avatars-grid" direction="horizontal">
                      {(provided) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="flex flex-wrap content-start p-1 min-h-[200px]"
                        >
                          {avatarsList.map((avatar, index) => {
                            const isSelected = formData.photo_url === avatar.url;
                            return (
                              <Draggable key={avatar.id} draggableId={avatar.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{ ...provided.draggableProps.style }}
                                    className="w-[16.66%] p-1 sm:p-1.5"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setFormData({ ...formData, photo_url: avatar.url })}
                                      className={`relative rounded-lg transition-all overflow-hidden w-full ${
                                        isSelected 
                                          ? 'p-[3px] bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 shadow-md' 
                                          : 'p-[2px] bg-slate-200 hover:bg-gradient-to-r hover:from-[#FF4D8D]/50 hover:via-purple-500/50 hover:to-blue-500/50'
                                      } ${snapshot.isDragging ? 'opacity-50 scale-105 z-50' : ''}`}
                                    >
                                      <div className="absolute top-1 right-1 z-10 bg-black/20 rounded p-0.5">
                                        <GripVertical className="w-3 h-3 text-white" />
                                      </div>
                                      <div className="rounded-md w-full h-full flex items-center justify-center bg-white p-1">
                                        <img
                                          src={avatar.url}
                                          alt={avatar.name}
                                          className="w-full h-10 sm:h-16 md:h-20 object-contain rounded-md" 
                                        />
                                      </div>
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {avatarsList.map((avatar) => {
                      const isSelected = formData.photo_url === avatar.url;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, photo_url: avatar.url })}
                          className={`relative rounded-lg transition-all overflow-hidden ${
                            isSelected 
                              ? 'p-[3px] bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 shadow-md' 
                              : 'p-[2px] bg-slate-200 hover:bg-gradient-to-r hover:from-[#FF4D8D]/50 hover:via-purple-500/50 hover:to-blue-500/50'
                          }`}
                        >
                          <div className="rounded-md w-full h-full flex items-center justify-center bg-white p-1">
                            <img
                              src={avatar.url}
                              alt={avatar.name}
                              className="w-full h-10 sm:h-16 md:h-20 object-contain rounded-md" 
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs sm:text-sm italic">
                  Aucun avatar disponible pour le moment.
                  <br />
                  Ils seront bientôt ajoutés ! 📸
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm h-8 sm:h-10">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground px-4 py-2 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-xs sm:text-sm h-8 sm:h-10 text-white shadow-md">
              {loading ? "Envoi..." : "Ajouter le professeur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

}