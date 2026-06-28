import { Switch, Route } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import FreelancersPage from "./pages/FreelancersPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import EditProjectPage from "./pages/EditProjectPage";
import FreelancerProfilePage from "./pages/FreelancerProfilePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import FreelancerDashboard from "./pages/dashboard/FreelancerDashboard";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import MyApplicationsPage from "./pages/dashboard/MyApplicationsPage";
import MyProjectsPage from "./pages/dashboard/MyProjectsPage";
import PostProjectPage from "./pages/PostProjectPage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import ManageSkillsPage from "./pages/profile/ManageSkillsPage";
import ManagePortfolioPage from "./pages/profile/ManagePortfolioPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import SavedPage from "./pages/SavedPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientProfilePage from "./pages/ClientProfilePage";

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/projects" component={ProjectsPage} />
            <Route path="/projects/:id/edit">
              <ProtectedRoute role="client">
                <EditProjectPage />
              </ProtectedRoute>
            </Route>
            <Route path="/projects/:id" component={ProjectDetailPage} />
            <Route path="/freelancers" component={FreelancersPage} />
            <Route path="/freelancers/:id" component={FreelancerProfilePage} />
            <Route path="/clients/:id" component={ClientProfilePage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/forgot-password" component={ForgotPasswordPage} />
            <Route path="/reset-password" component={ResetPasswordPage} />
            <Route path="/dashboard">
              <ProtectedRoute role="freelancer">
                <FreelancerDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/dashboard/client">
              <ProtectedRoute role="client">
                <ClientDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/applications">
              <ProtectedRoute role="freelancer">
                <MyApplicationsPage />
              </ProtectedRoute>
            </Route>
            <Route path="/my-projects">
              <ProtectedRoute role="client">
                <MyProjectsPage />
              </ProtectedRoute>
            </Route>
            <Route path="/post-project">
              <ProtectedRoute role="client">
                <PostProjectPage />
              </ProtectedRoute>
            </Route>
            <Route path="/profile/edit">
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            </Route>
            <Route path="/profile/skills">
              <ProtectedRoute role="freelancer">
                <ManageSkillsPage />
              </ProtectedRoute>
            </Route>
            <Route path="/profile/portfolio">
              <ProtectedRoute role="freelancer">
                <ManagePortfolioPage />
              </ProtectedRoute>
            </Route>
            <Route path="/messages">
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            </Route>
            <Route path="/messages/:id">
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            </Route>
            <Route path="/notifications">
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            </Route>
            <Route path="/saved">
              <ProtectedRoute>
                <SavedPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin">
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            </Route>
            <Route component={NotFoundPage} />
          </Switch>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
