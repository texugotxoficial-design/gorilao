
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ContactPage from './pages/ContactPage'; // Added import
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminExtras from './pages/admin/AdminExtras';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <CartProvider>
                <HashRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        <Route path="/home" element={
                            <ProtectedRoute>
                                <MainLayout><HomePage /></MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <MainLayout><DashboardPage /></MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <MainLayout><ProfilePage /></MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/menu" element={
                            <ProtectedRoute>
                                <MainLayout><MenuPage /></MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/cart" element={
                            <ProtectedRoute>
                                <MainLayout><CartPage /></MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/checkout" element={<ProtectedRoute><MainLayout><CheckoutPage /></MainLayout></ProtectedRoute>} />
                        <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />

                        {/* Admin Routes */}
                        <Route path="/admin/*" element={
                            <AdminRoute>
                                <Routes>
                                    <Route path="/" element={<AdminDashboard />} />
                                    <Route path="/products" element={<AdminProducts />} />
                                    <Route path="/categories" element={<AdminCategories />} />
                                    <Route path="/extras" element={<AdminExtras />} />
                                    <Route path="/promotions" element={<AdminPromotions />} />
                                </Routes>
                            </AdminRoute>
                        } />

                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </HashRouter>
            </CartProvider>
        </AuthProvider>
    );
};

export default App;
