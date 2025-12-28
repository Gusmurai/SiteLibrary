import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [formData, setFormData] = useState({ login: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Функция ввода учетных данных и динамического получения прав доступа от сервера
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('http://library-site.ru/api/login.php', formData);
            if (response.data.status === 'success') {
                // Выгрузка полученных данных пользователя в глобальное состояние (Context)
                login(response.data.user);
                navigate('/'); 
            } else {
                setError(response.data.error || 'Ошибка входа');
            }
        } catch (err) {
            setError('Ошибка соединения с сервером');
        }
    };

    return (
        <div className="login-page">
            <div className="login-form-container">
                <h2>Вход в библиотеку</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Логин:</label>
                        <input type="text" name="login" value={formData.login} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Пароль:</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn-submit">Войти</button>
                </form>

                {/* Блок с информацией о регистрации для новых пользователей */}
                <div className="login-info-box">
                    <h4>Как получить доступ?</h4>
                    <p>
                        Войти на сайт могут только авторизованные пользователи. 
                    </p>
                    <p>
                        Пожалуйста, посетите нашу библиотеку для оформления читательского билета. 
                        После регистрации вы получите логин и пароль для доступа к личному кабинету 
                        и расширенным функциям: просмотру подробной информации о книгах и системе онлайн-бронирования.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;