import React, { createContext, useState, useEffect } from 'react';

// Создаем "Контекст" (хранилище данных)
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // При обновлении страницы проверяем, не входил ли юзер ранее (смотрим в LocalStorage)
    useEffect(() => {
        const savedUser = localStorage.getItem('library_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // Функция Входа
    const login = (userData) => {
        setUser(userData);
        // Сохраняем в браузере, чтобы при обновлении страницы не вылетало
        localStorage.setItem('library_user', JSON.stringify(userData));
    };

    // Функция Выхода
    const logout = () => {
        setUser(null);
        localStorage.removeItem('library_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};