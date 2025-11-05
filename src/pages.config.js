import Home from './pages/Home';
import Workouts from './pages/Workouts';
import Progress from './pages/Progress';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Welcome from './pages/Welcome';
import Onboarding from './pages/Onboarding';
import WorkoutDetail from './pages/WorkoutDetail';
import Admin from './pages/Admin';
import WorkoutExecution from './pages/WorkoutExecution';
import WorkoutSelection from './pages/WorkoutSelection';
import Nutrition from './pages/Nutrition';
import AICoach from './pages/AICoach';
import NutritionSetup from './pages/NutritionSetup';
import WorkoutSetup from './pages/WorkoutSetup';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Workouts": Workouts,
    "Progress": Progress,
    "Community": Community,
    "Profile": Profile,
    "Subscription": Subscription,
    "Welcome": Welcome,
    "Onboarding": Onboarding,
    "WorkoutDetail": WorkoutDetail,
    "Admin": Admin,
    "WorkoutExecution": WorkoutExecution,
    "WorkoutSelection": WorkoutSelection,
    "Nutrition": Nutrition,
    "AICoach": AICoach,
    "NutritionSetup": NutritionSetup,
    "WorkoutSetup": WorkoutSetup,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};