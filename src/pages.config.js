import AICoach from './pages/AICoach';
import Admin from './pages/Admin';
import AdminNotifications from './pages/AdminNotifications';
import Badges from './pages/Badges';
import BodyAnalysis from './pages/BodyAnalysis';
import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import Fasting from './pages/Fasting';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import Leaderboard from './pages/Leaderboard';
import MyWorkouts from './pages/MyWorkouts';
import Nutrition from './pages/Nutrition';
import NutritionSetup from './pages/NutritionSetup';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Progress from './pages/Progress';
import Subscription from './pages/Subscription';
import Support from './pages/Support';
import WorkoutDetail from './pages/WorkoutDetail';
import WorkoutExecution from './pages/WorkoutExecution';
import WorkoutReports from './pages/WorkoutReports';
import WorkoutSelection from './pages/WorkoutSelection';
import WorkoutSetup from './pages/WorkoutSetup';
import Workouts from './pages/Workouts';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AICoach": AICoach,
    "Admin": Admin,
    "AdminNotifications": AdminNotifications,
    "Badges": Badges,
    "BodyAnalysis": BodyAnalysis,
    "Community": Community,
    "Dashboard": Dashboard,
    "Fasting": Fasting,
    "Home": Home,
    "LandingPage": LandingPage,
    "Leaderboard": Leaderboard,
    "MyWorkouts": MyWorkouts,
    "Nutrition": Nutrition,
    "NutritionSetup": NutritionSetup,
    "Onboarding": Onboarding,
    "Profile": Profile,
    "Progress": Progress,
    "Subscription": Subscription,
    "Support": Support,
    "WorkoutDetail": WorkoutDetail,
    "WorkoutExecution": WorkoutExecution,
    "WorkoutReports": WorkoutReports,
    "WorkoutSelection": WorkoutSelection,
    "WorkoutSetup": WorkoutSetup,
    "Workouts": Workouts,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};