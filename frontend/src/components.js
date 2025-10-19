import React, { useState, useEffect, useContext, createContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setIsAdmin(user.user_type === 'admin');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      const { access_token, user_type, user } = response.data;
      
      // Store authentication data
      localStorage.setItem('userToken', access_token);
      localStorage.setItem('userData', JSON.stringify({ ...user, user_type }));
      
      setCurrentUser({ ...user, user_type });
      setIsAdmin(user_type === 'admin');
      
      return { success: true, isAdmin: user_type === 'admin' };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Ошибка входа' };
    }
  };

  const register = async (email, password, name) => {
    try {
      // For now, we'll use the same login endpoint since we're creating users on the fly
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      const { access_token, user_type, user } = response.data;
      
      localStorage.setItem('userToken', access_token);
      localStorage.setItem('userData', JSON.stringify({ ...user, user_type }));
      
      setCurrentUser({ ...user, user_type });
      setIsAdmin(user_type === 'admin');
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Ошибка регистрации' };
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const value = {
    currentUser,
    isAdmin,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Header Component
export const Header = () => {
  const { currentUser, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const isCurrentPage = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">У</span>
              </div>
              <span className="text-2xl font-bold text-teal-600">ИСЛАМА</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link 
                to="/"
                className={`${isCurrentPage('/') && location.pathname === '/' ? 'text-teal-600' : 'text-gray-700'} hover:text-teal-600 font-medium`}
              >
                Главная
              </Link>
              <Link 
                to="/lessons"
                className={`${isCurrentPage('/lessons') ? 'text-teal-600' : 'text-gray-700'} hover:text-teal-600 font-medium`}
              >
                Уроки
              </Link>
              <Link 
                to="/qa"
                className={`${isCurrentPage('/qa') ? 'text-teal-600' : 'text-gray-700'} hover:text-teal-600 font-medium`}
              >
                Вопросы и Ответы
              </Link>
              <Link 
                to="/leaderboard"
                className={`${isCurrentPage('/leaderboard') ? 'text-teal-600' : 'text-gray-700'} hover:text-teal-600 font-medium `}
              >
                Лидерборд
              </Link>
              <Link 
                to="/about"
                className={`${isCurrentPage('/about') ? 'text-teal-600' : 'text-gray-700'} hover:text-teal-600 font-medium `}
              >
                О проекте
              </Link>
            </nav>

            {/* Desktop Auth buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/profile"
                    className="flex items-center space-x-2 text-gray-700 hover:text-teal-600 transition duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden lg:block">Профиль</span>
                  </Link>
                  <span className="text-gray-700 hidden lg:block">Привет, {currentUser.displayName || currentUser.name || 'Пользователь'}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 "
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600  font-medium"
                >
                  Войти
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {currentUser && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="p-2 text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-100">
              <div className="px-4 py-2 space-y-1">
                <Link
                  to="/"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isCurrentPage('/') && location.pathname === '/' ? 'text-teal-600 bg-teal-50' : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Главная
                </Link>
                <Link
                  to="/lessons"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isCurrentPage('/lessons') ? 'text-teal-600 bg-teal-50' : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Уроки
                </Link>
                <Link
                  to="/qa"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isCurrentPage('/qa') ? 'text-teal-600 bg-teal-50' : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Вопросы и Ответы
                </Link>
                <Link
                  to="/leaderboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isCurrentPage('/leaderboard') ? 'text-teal-600 bg-teal-50' : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Лидерборд
                </Link>
                <Link
                  to="/about"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isCurrentPage('/about') ? 'text-teal-600 bg-teal-50' : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  О проекте
                </Link>
                
                {currentUser && (
                  <Link
                    to="/profile"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isCurrentPage('/profile') ? 'text-teal-600 bg-teal-50' : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    👤 Мой профиль
                  </Link>
                )}
                
                {!currentUser && (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-teal-500 hover:bg-teal-600"
                  >
                    Войти
                  </button>
                )}
                
                {currentUser && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-gray-50"
                  >
                    Выйти
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
};

// Auth Modal Component
export const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && !name)) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await register(email, password, name);
      }
      
      if (result.success) {
        onClose();
        
        // If user is admin, redirect to admin panel
        if (result.isAdmin) {
          // Show success message for admin
          alert('Добро пожаловать в админ панель!');
          // Force page reload to show admin panel
          window.location.reload();
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Произошла ошибка. Попробуйте снова.');
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Вход' : 'Регистрация'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>



        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
              required
              placeholder={isLogin ? "Введите ваш email" : "example@domain.com"}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
              required
              minLength={6}
              placeholder="Введите пароль"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600  disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-teal-500 hover:text-teal-600"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hero Section Component
export const HeroSection = ({ onStartLearning }) => {
  return (
    <section className="relative bg-gradient-to-br from-white to-teal-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                УРОКИ <span className="text-teal-500">ИСЛАМА</span>
              </h1>
              <p className="text-2xl text-gray-600 mt-4">
                Ваш первый учитель
              </p>
            </div>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              Образовательная платформа об основах ислама для начинающих мусульман
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={onStartLearning}
                className="bg-teal-500 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-teal-600   shadow-lg"
              >
                Начать учиться
              </button>
              <button className="flex items-center text-teal-600 font-medium text-lg hover:text-teal-700 ">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                смотреть видео
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src="https://raw.githubusercontent.com/sunduksuar/suar/refs/heads/main/WhatsApp%20Image%202025-09-26%20at%2014.02.53%20(1).png"
                alt="Красивая мечеть на закате"
                className="w-full h-96 object-cover rounded-2xl shadow-2xl"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-24 h-24 bg-teal-200 rounded-full opacity-20"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-teal-300 rounded-full opacity-30"></div>
          </div>
        </div>
      </div>

      {/* Decorative SVG shapes */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 text-teal-100">
        <svg fill="currentColor" viewBox="0 0 100 100">
          <path d="M0,0 L100,0 L100,100 Z" opacity="0.1"/>
        </svg>
      </div>
    </section>
  );
};

// Why Study Islam Section
export const WhyStudySection = () => {
  const benefits = [
    {
      title: "Ислам - мировая религия",
      description: "Узнайте о ценностях 1,8 миллиарда мусульман планеты."
    },
    {
      title: "Духовная гармония",
      description: "Найдите свой путь к Богу и подготовьтесь к вечной жизни."
    },
    {
      title: "Знание истины",
      description: "Развейте сомнения, не будьте заложниками внушенных стереотипов."
    }
  ];

  return (
    <section className="bg-teal-500 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-8">
              ПОЧЕМУ
              <br />
              ИЗУЧЕНИЕ ИСЛАМА
              <br />
              ВАЖНО?
            </h2>
          </div>
          
          <div className="space-y-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-white">
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-teal-100 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Leaderboard Component
export const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for demonstration if Firestore is not available
  const mockLeaders = [
    { id: '1', name: 'Ахмед Иванов', totalScore: 45, createdAt: new Date() },
    { id: '2', name: 'Фатима Петрова', totalScore: 42, createdAt: new Date() },
    { id: '3', name: 'Умар Сидоров', totalScore: 38, createdAt: new Date() },
    { id: '4', name: 'Айша Козлова', totalScore: 35, createdAt: new Date() },
    { id: '5', name: 'Али Морозов', totalScore: 32, createdAt: new Date() },
    { id: '6', name: 'Хадиджа Волкова', totalScore: 28, createdAt: new Date() },
    { id: '7', name: 'Юсуф Лебедев', totalScore: 25, createdAt: new Date() },
    { id: '8', name: 'Зейнаб Новикова', totalScore: 22, createdAt: new Date() },
    { id: '9', name: 'Ибрагим Орлов', totalScore: 18, createdAt: new Date() },
    { id: '10', name: 'Марьам Соколова', totalScore: 15, createdAt: new Date() },
  ];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/leaderboard`);
        const data = response.data;
        
        // Transform data to match component expectations
        const transformedData = data.map((leader, index) => ({
          id: leader.student_id,
          name: leader.name,
          totalScore: leader.total_score,
          testCount: leader.test_count,
          bestScore: leader.best_score,
          createdAt: new Date(leader.created_at)
        }));
        
        setLeaders(transformedData);
        setLoading(false);
        
        if (transformedData.length === 0) {
          setError('Пока нет данных о прохождении тестов.');
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        // Fallback to mock data
        setLeaders(mockLeaders);
        setLoading(false);
        setError('Не удалось загрузить данные. Показаны демо-данные.');
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-gray-600">Загрузка лидерборда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Лидерборд</h1>
          <p className="text-lg text-gray-600">Топ-10 лучших учеников</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Рейтинг учеников</h2>
          </div>
          
          <div className="p-6">
            {leaders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Пока никто не прошел тесты</p>
                <p className="text-gray-400">Станьте первым!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaders.map((leader, index) => (
                  <div
                    key={leader.id}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg  ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-300'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-300'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg ${
                        index === 0
                          ? 'bg-yellow-500 text-white'
                          : index === 1
                          ? 'bg-gray-500 text-white'
                          : index === 2
                          ? 'bg-orange-500 text-white'
                          : 'bg-teal-500 text-white'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                          {leader.name || 'Аноним'}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">
                          Зарегистрирован: {leader.createdAt?.toDate ? leader.createdAt.toDate().toLocaleDateString('ru-RU') : leader.createdAt?.toLocaleDateString('ru-RU') || 'Недавно'}
                        </p>
                        <p className="text-gray-600 text-xs sm:hidden">
                          {leader.createdAt?.toDate ? leader.createdAt.toDate().toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }) : 'Недавно'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xl sm:text-2xl font-bold ${
                        index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : index === 2 ? 'text-orange-600' : 'text-teal-600'
                      }`}>
                        {leader.totalScore || 0}
                      </div>
                      <p className="text-gray-500 text-xs sm:text-sm">баллов</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Проходите тесты и набирайте баллы, чтобы попасть в топ!
          </p>
          <p className="text-gray-500 text-sm mt-2">
            За каждый правильный ответ +1 балл
          </p>
        </div>
      </div>
    </div>
  );
};

// Lessons Component
export const Lessons = ({ setCurrentPage }) => {
  const { currentUser } = useAuth();
  const [showAuthMessage, setShowAuthMessage] = useState(false);

  const lessons = [
    {
      id: 1,
      title: "Основы веры",
      description: "Изучите пять столпов ислама и основные принципы веры",
      image: "https://images.pexels.com/photos/7249250/pexels-photo-7249250.jpeg",
      duration: "15 мин",
      questions: 10,
      difficulty: "Легко"
    },
    {
      id: 2,
      title: "Практика веры",
      description: "Узнайте о ежедневных практиках и обрядах",
      image: "https://images.unsplash.com/photo-1582033131298-5bb54c589518",
      duration: "20 мин",
      questions: 15,
      difficulty: "Средне"
    },
    {
      id: 3,
      title: "Этика ислама",
      description: "Изучите моральные принципы и этические нормы",
      image: "https://images.pexels.com/photos/32470206/pexels-photo-32470206.jpeg",
      duration: "25 мин",
      questions: 12,
      difficulty: "Легко"
    },
    {
      id: 4,
      title: "История ислама",
      description: "Познакомьтесь с историей возникновения и развития ислама",
      image: "https://images.unsplash.com/photo-1655552090825-e12b509c83ca",
      duration: "30 мин",
      questions: 20,
      difficulty: "Сложно"
    }
  ];

  const handleStartLesson = (lessonId) => {
    if (!currentUser) {
      setShowAuthMessage(true);
      setTimeout(() => setShowAuthMessage(false), 3000);
      return;
    }
    setCurrentPage(`quiz-${lessonId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Уроки ислама</h1>
          <p className="text-lg text-gray-600">Изучите 4 самых важных предмета для верующего</p>
        </div>

        {showAuthMessage && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50">
            <p>Войдите в систему, чтобы проходить уроки</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl   overflow-hidden group">
              <div className="relative h-48">
                <img
                  src={lesson.image}
                  alt={lesson.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform "
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lesson.difficulty === 'Легко' ? 'bg-green-100 text-green-800' :
                    lesson.difficulty === 'Средне' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {lesson.difficulty}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
                <p className="text-gray-600 mb-4">{lesson.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {lesson.duration}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {lesson.questions} вопросов
                  </span>
                </div>
                
                <button
                  onClick={() => handleStartLesson(lesson.id)}
                  className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg hover:bg-teal-600  font-medium"
                >
                  Начать урок
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Как проходит обучение?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Изучение материала</h3>
                <p className="text-gray-600 text-sm">Читайте теоретический материал по теме урока</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Прохождение теста</h3>
                <p className="text-gray-600 text-sm">Отвечайте на вопросы по изученному материалу</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Получение баллов</h3>
                <p className="text-gray-600 text-sm">За каждый правильный ответ получайте +1 балл</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quiz Component
export const Quiz = ({ lessonId, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [quizStarted, setQuizStarted] = useState(false);

  // Sample quiz data
  const quizData = {
    1: {
      title: "Основы веры",
      timeLimit: 300,
      questions: [
        {
          question: "Сколько столпов ислама существует?",
          options: ["3", "4", "5", "6"],
          correct: 2
        },
        {
          question: "Как называется священная книга мусульман?",
          options: ["Тора", "Библия", "Коран", "Веды"],
          correct: 2
        },
        {
          question: "Какой город является священным для мусульман?",
          options: ["Медина", "Мекка", "Иерусалим", "Каир"],
          correct: 1
        },
        {
          question: "Как называется ежедневная молитва в исламе?",
          options: ["Дуа", "Салят", "Зикр", "Таваф"],
          correct: 1
        },
        {
          question: "Сколько раз в день мусульмане должны молиться?",
          options: ["3", "4", "5", "6"],
          correct: 2
        }
      ]
    },
    2: {
      title: "Практика веры",
      timeLimit: 400,
      questions: [
        {
          question: "В каком месяце мусульмане соблюдают пост?",
          options: ["Рамадан", "Шаввал", "Зуль-Хиджа", "Мухаррам"],
          correct: 0
        },
        {
          question: "Как называется паломничество в Мекку?",
          options: ["Умра", "Хадж", "Зиярат", "Сафар"],
          correct: 1
        },
        {
          question: "Какая сумма обязательного пожертвования в исламе?",
          options: ["1%", "2.5%", "5%", "10%"],
          correct: 1
        },
        {
          question: "Как называется направление на Мекку для молитвы?",
          options: ["Кибла", "Михраб", "Минарет", "Минбар"],
          correct: 0
        },
        {
          question: "В какое время начинается утренняя молитва?",
          options: ["На рассвете", "На восходе", "В полдень", "Вечером"],
          correct: 0
        }
      ]
    },
    3: {
      title: "Этика ислама",
      timeLimit: 360,
      questions: [
        {
          question: "Что является основой исламской этики?",
          options: ["Коран и Сунна", "Только Коран", "Традиции предков", "Современные законы"],
          correct: 0
        },
        {
          question: "Как ислам относится к честности в торговле?",
          options: ["Запрещает", "Поощряет", "Не регулирует", "Ограничивает"],
          correct: 1
        },
        {
          question: "Что говорит ислам о почитании родителей?",
          options: ["Необязательно", "Желательно", "Обязательно", "Запрещено"],
          correct: 2
        }
      ]
    },
    4: {
      title: "История ислама",
      timeLimit: 600,
      questions: [
        {
          question: "В каком году началось пророчество Мухаммада?",
          options: ["610 г.", "620 г.", "630 г.", "640 г."],
          correct: 0
        },
        {
          question: "Как называется переселение из Мекки в Медину?",
          options: ["Хиджра", "Фатх", "Газва", "Сира"],
          correct: 0
        },
        {
          question: "Кто был первым халифом после пророка Мухаммада?",
          options: ["Али", "Умар", "Усман", "Абу Бакр"],
          correct: 3
        }
      ]
    }
  };

  const currentQuiz = quizData[lessonId];

  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleQuizEnd();
    }
  }, [timeLeft, quizStarted, showResult]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === currentQuiz.questions[currentQuestion].correct) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < currentQuiz.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      handleQuizEnd();
    }
  };

  const handleQuizEnd = async () => {
    setShowResult(true);
    
    if (currentUser) {
      try {
        // Save quiz result
        await addDoc(collection(db, 'scores'), {
          uid: currentUser.uid,
          lessonId: lessonId,
          score: score,
          totalQuestions: currentQuiz.questions.length,
          timeSpent: currentQuiz.timeLimit - timeLeft,
          timestamp: serverTimestamp()
        });

        // Update user's total score
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const currentTotalScore = userDoc.data()?.totalScore || 0;
        
        await updateDoc(userRef, {
          totalScore: currentTotalScore + score
        });
      } catch (error) {
        console.error('Error saving quiz result:', error);
      }
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeLeft(currentQuiz.timeLimit);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Требуется авторизация</h2>
          <p className="text-gray-600 mb-6">Войдите в систему, чтобы проходить тесты</p>
          <button
            onClick={() => setCurrentPage('home')}
            className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 "
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentQuiz.title}</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Вопросов:</span>
                <span className="font-medium">{currentQuiz.questions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Время:</span>
                <span className="font-medium">{formatTime(currentQuiz.timeLimit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Баллов за урок:</span>
                <span className="font-medium">до {currentQuiz.questions.length}</span>
              </div>
            </div>
            <button
              onClick={startQuiz}
              className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg hover:bg-teal-600  font-medium"
            >
              Начать тест
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / currentQuiz.questions.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6">
              {percentage >= 70 ? (
                <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Тест завершен!</h2>
            <p className="text-gray-600 mb-6">
              {percentage >= 70 ? 'Отличный результат!' : 'Попробуйте еще раз!'}
            </p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Правильных ответов:</span>
                <span className="font-medium">{score} из {currentQuiz.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Процент:</span>
                <span className="font-medium">{percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span>Заработано баллов:</span>
                <span className="font-medium text-teal-600">+{score}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setCurrentPage('lessons')}
                className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg hover:bg-teal-600  font-medium"
              >
                К урокам
              </button>
              <button
                onClick={() => setCurrentPage('leaderboard')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200  font-medium"
              >
                Посмотреть лидерборд
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = currentQuiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">{currentQuiz.title}</h1>
            <div className="text-right">
              <div className="text-sm text-gray-600">Время</div>
              <div className={`text-lg font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-teal-600'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Вопрос {currentQuestion + 1} из {currentQuiz.questions.length}
            </div>
            <div className="text-sm text-gray-600">
              Набрано баллов: {score}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-teal-500 h-2 rounded-full  "
              style={{ width: `${((currentQuestion + 1) / currentQuiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-medium text-gray-900 mb-8">{currentQ.question}</h2>
          
          <div className="space-y-4 mb-8">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left rounded-lg border-2  ${
                  selectedAnswer === index
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedAnswer === index
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswer === index && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>
          
          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg hover:bg-teal-600  font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion + 1 === currentQuiz.questions.length ? 'Завершить тест' : 'Следующий вопрос'}
          </button>
        </div>
      </div>
    </div>
  );
};
