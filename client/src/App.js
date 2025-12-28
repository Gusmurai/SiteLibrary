import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import axios from 'axios';
import './App.css';

import NewsPage from './pages/NewsPage';
import AboutPage from './pages/AboutPage';
import CatalogPage from './pages/CatalogPage';
import ContactsPage from './pages/ContactsPage';
import LoginPage from './pages/LoginPage';
import LibrarianPage from './pages/LibrarianPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import LibraryEditPage from './pages/LibraryEditPage';

function App() {
  const { user, logout } = useContext(AuthContext);

  // Состояние для хранения контактной информации библиотеки
  const [footerInfo, setFooterInfo] = useState(null);

  // Функция динамического вывода данных о библиотеке из базы данных
  const fetchFooterData = () => {
    axios.get('http://library-site.ru/api/library_info.php')
      .then(res => setFooterInfo(res.data))
      .catch(err => console.error("Ошибка загрузки подвала", err));
  };

  // Первичная загрузка данных и настройка автоматического обновления информации
  useEffect(() => {
    // Начальный вывод данных при загрузке сайта
    fetchFooterData(); 

    // Функция прослушивания системного события об обновлении информации
    // Это позволяет подвалу мгновенно обновиться, когда админ сохраняет настройки
    window.addEventListener('libraryInfoUpdated', fetchFooterData);

    // Удаление слушателя при размонтировании компонента для оптимизации памяти
    return () => window.removeEventListener('libraryInfoUpdated', fetchFooterData);
  }, []);

  // Функция очистки сессии пользователя и перенаправления на страницу ввода данных
  const handleLogout = () => {
      logout(); 
      window.location.href = '/login'; 
  };

  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <div className="logo">📚 Библиотека</div>
          <nav>
            <Link to="/">Новости</Link>
            <Link to="/about">О нас</Link>
            <Link to="/catalog">Каталог</Link>
            <Link to="/contacts">Контакты</Link>
            {user && (user.role === 'admin' || user.role === 'librarian') && (<Link to="/librarian">Бронирование</Link>)}
            {user && (user.role === 'admin' || user.role === 'librarian') && (<Link to="/admin">{user.role === 'librarian' ? 'Читатели' : 'Пользователи'}</Link>)}
            {user && user.role === 'admin' && (<Link to="/settings">⚙ Настройки</Link>)}

            {user ? (
              <div className="user-menu" style={{display: 'flex', alignItems: 'center'}}>
                <Link to="/profile" style={{ marginRight: '20px', color: '#f1c40f', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    {user.full_name}
                </Link>
                <button onClick={handleLogout} className="login-btn" style={{cursor:'pointer'}}>Выйти</button>
              </div>
            ) : (
              <Link to="/login" className="login-btn">Войти</Link>
            )}
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<NewsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/librarian" element={<LibrarianPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<LibraryEditPage />} />
          </Routes>
        </main>

        {/* Динамический вывод контактных данных в подвале сайта */}
        <footer className="app-footer">
          <p>&copy; 2025 {footerInfo ? footerInfo.library_name : 'Городская библиотека'}. Все права защищены.</p>
          {footerInfo && (
            <div style={{ marginTop: '5px', fontSize: '0.85rem', opacity: 0.8 }}>
              <span>📍 {footerInfo.address}</span>
              <span style={{ margin: '0 10px' }}>|</span>
              <span>📞 {footerInfo.phone}</span>
            </div>
          )}
        </footer>
      </div>
    </Router>
  );
}

export default App;