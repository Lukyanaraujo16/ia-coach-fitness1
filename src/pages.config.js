import Home from './pages/Home';
import Workouts from './pages/Workouts';
import Progress from './pages/Progress';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Workouts": Workouts,
    "Progress": Progress,
    "Community": Community,
    "Profile": Profile,
    "Subscription": Subscription,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};