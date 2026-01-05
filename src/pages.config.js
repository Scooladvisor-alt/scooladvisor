import About from './pages/About';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Moderation from './pages/Moderation';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import SchoolDetail from './pages/SchoolDetail';
import Schools from './pages/Schools';
import TeacherDetail from './pages/TeacherDetail';
import TermsOfService from './pages/TermsOfService';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Contact": Contact,
    "Home": Home,
    "Moderation": Moderation,
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "SchoolDetail": SchoolDetail,
    "Schools": Schools,
    "TeacherDetail": TeacherDetail,
    "TermsOfService": TermsOfService,
}

export const pagesConfig = {
    mainPage: "Schools",
    Pages: PAGES,
    Layout: __Layout,
};