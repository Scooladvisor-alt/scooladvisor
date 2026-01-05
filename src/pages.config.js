import Contact from './pages/Contact';
import Home from './pages/Home';
import Moderation from './pages/Moderation';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import TeacherDetail from './pages/TeacherDetail';
import TermsOfService from './pages/TermsOfService';
import Schools from './pages/Schools';
import SchoolDetail from './pages/SchoolDetail';
import About from './pages/About';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Contact": Contact,
    "Home": Home,
    "Moderation": Moderation,
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "TeacherDetail": TeacherDetail,
    "TermsOfService": TermsOfService,
    "Schools": Schools,
    "SchoolDetail": SchoolDetail,
    "About": About,
}

export const pagesConfig = {
    mainPage: "Schools",
    Pages: PAGES,
    Layout: __Layout,
};