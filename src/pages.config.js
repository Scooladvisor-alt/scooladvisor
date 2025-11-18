import Schools from './pages/Schools';
import SchoolDetail from './pages/SchoolDetail';
import TeacherDetail from './pages/TeacherDetail';
import Moderation from './pages/Moderation';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Schools": Schools,
    "SchoolDetail": SchoolDetail,
    "TeacherDetail": TeacherDetail,
    "Moderation": Moderation,
    "TermsOfService": TermsOfService,
    "PrivacyPolicy": PrivacyPolicy,
    "Contact": Contact,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Schools",
    Pages: PAGES,
    Layout: __Layout,
};