import Workouts from './pages/Workouts';
import Progress from './pages/Progress';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Onboarding from './pages/Onboarding';
import WorkoutDetail from './pages/WorkoutDetail';
import Admin from './pages/Admin';
import WorkoutExecution from './pages/WorkoutExecution';
import WorkoutSelection from './pages/WorkoutSelection';
import Nutrition from './pages/Nutrition';
import AICoach from './pages/AICoach';
import NutritionSetup from './pages/NutritionSetup';
import WorkoutSetup from './pages/WorkoutSetup';
import LandingPage from './pages/LandingPage';
import MyWorkouts from './pages/MyWorkouts';
import Leaderboard from './pages/Leaderboard';
import Badges from './pages/Badges';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import AdminNotifications from './pages/AdminNotifications';
import Support from './pages/Support';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Workouts": Workouts,
    "Progress": Progress,
    "Community": Community,
    "Profile": Profile,
    "Subscription": Subscription,
    "Onboarding": Onboarding,
    "WorkoutDetail": WorkoutDetail,
    "Admin": Admin,
    "WorkoutExecution": WorkoutExecution,
    "WorkoutSelection": WorkoutSelection,
    "Nutrition": Nutrition,
    "AICoach": AICoach,
    "NutritionSetup": NutritionSetup,
    "WorkoutSetup": WorkoutSetup,
    "LandingPage": LandingPage,
    "MyWorkouts": MyWorkouts,
    "Leaderboard": Leaderboard,
    "Badges": Badges,
    "Dashboard": Dashboard,
    "Home": Home,
    "AdminNotifications": AdminNotifications,
    "Support": Support,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};