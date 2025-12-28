import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        login: '', password: '', full_name: '', phone: '', role: 'reader'
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); 
    const [roleFilter, setRoleFilter] = useState('all');

    // Динамический вывод списка всех пользователей системы
    const fetchUsers = () => {
        axios.get('http://library-site.ru/api/users.php')
            .then(res => setUsers(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'admin' && user.role !== 'librarian') {
            navigate('/');
        } else {
            fetchUsers();
        }
    }, [user, navigate]);

    // Обработка фильтрации и поиска пользователей на стороне клиента
    const filteredUsers = useMemo(() => {
        if (!user) return [];
        return users.filter(u => {
            if (u.id === user.id) return false;
            if (user.role === 'librarian' && u.role !== 'reader') return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const nameMatch = u.full_name.toLowerCase().includes(term);
                const phoneMatch = u.phone && u.phone.toLowerCase().includes(term);
                if (!nameMatch && !phoneMatch) return false;
            }
            if (statusFilter === 'active' && u.is_blocked == 1) return false;
            if (statusFilter === 'blocked' && u.is_blocked == 0) return false;
            if (user.role === 'admin' && roleFilter !== 'all' && u.role !== roleFilter) return false;
            return true;
        });
    }, [users, searchTerm, statusFilter, roleFilter, user]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Подготовка данных для ввода изменений в существующий профиль
    const handleEditClick = (u) => {
        setEditingUser(u);
        setFormData({
            login: u.login, password: '', full_name: u.full_name,
            phone: u.phone || '', role: u.role
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setFormData({ login: '', password: '', full_name: '', phone: '', role: 'reader' });
    };

    // Динамический ввод данных: создание нового или обновление текущего пользователя
    const handleSubmit = async (e) => {
        e.preventDefault();
        const phoneRegex = /^\+7\d{10}$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            alert('Ошибка формата телефона');
            return;
        }

        try {
            const payload = editingUser ? { ...formData, id: editingUser.id } : formData;
            const res = await axios.post('http://library-site.ru/api/users.php', payload);
            if (res.data.error) { alert(res.data.error); } 
            else { 
                alert(res.data.message); 
                handleCancelEdit(); 
                fetchUsers(); // Обновление вывода после успешного ввода
            }
        } catch (error) { alert('Ошибка сервера'); }
    };

    // Функция изменения статуса доступа пользователя (блокировка)
    const toggleBlock = async (id) => {
        if (!window.confirm('Изменить статус блокировки?')) return;
        await axios.post('http://library-site.ru/api/users.php', { id: id, action: 'toggle_block' });
        fetchUsers();
    };

    if (!user) return <div style={{padding: '40px', textAlign: 'center'}}>Загрузка...</div>;

    const isLibrarian = user.role === 'librarian';

    const inputStyle = {
        padding: '0 10px', borderRadius: '4px', border: '1px solid #ccc',
        height: '40px', width: '100%', boxSizing: 'border-box', fontSize: '0.95rem'
    };

    return (
        <div className="admin-page">
            <h1>{isLibrarian ? 'Управление читателями' : 'Управление пользователями'}</h1>

            <div className="admin-news-panel" style={editingUser ? {border: '2px solid #e67e22', background:'#fffbf0'} : {}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3>{editingUser ? `✎ Редактирование: ${editingUser.login}` : (isLibrarian ? '➕ Зарегистрировать читателя' : '➕ Добавить пользователя')}</h3>
                    {editingUser && <button onClick={handleCancelEdit}>Отмена</button>}
                </div>

                <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <input name="login" placeholder="Логин" value={formData.login} onChange={handleChange} required className="form-input"/>
                    <input name="password" type="text" placeholder={editingUser ? "Новый пароль" : "Пароль"} value={formData.password} onChange={handleChange} required={!editingUser} className="form-input"/>
                    <input name="full_name" placeholder="ФИО" value={formData.full_name} onChange={handleChange} required className="form-input"/>
                    <input name="phone" placeholder="+7xxxxxxxxxx" value={formData.phone} onChange={handleChange} className="form-input"/>
                    <select name="role" value={formData.role} onChange={handleChange} className="form-input">
                        <option value="reader">Читатель</option>
                        {!isLibrarian && <option value="librarian">Библиотекарь</option>}
                        {!isLibrarian && <option value="admin">Администратор</option>}
                    </select>
                    <button type="submit" style={editingUser ? {background:'#e67e22'} : {}} className="btn-submit">
                        {editingUser ? 'Сохранить изменения' : 'Зарегистрировать'}
                    </button>
                </form>
            </div>

            <div style={{display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', width: '100%'}}>
                <div style={{flex: 3, position: 'relative'}}>
                    <span style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#999', fontSize:'16px', lineHeight: 1}}>🔍</span>
                    <input type="text" placeholder="Поиск по ФИО или телефону..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{...inputStyle, paddingLeft: '35px'}} />
                </div>
                <div style={{flex: 1}}>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
                        <option value="all">Все статусы</option>
                        <option value="active">Активные</option>
                        <option value="blocked">Заблокированные</option>
                    </select>
                </div>
                {!isLibrarian && (
                    <div style={{flex: 1}}>
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={inputStyle}>
                            <option value="all">Все пользователи</option>
                            <option value="reader">Читатели</option>
                            <option value="librarian">Библиотекари</option>
                            <option value="admin">Администраторы</option>
                        </select>
                    </div>
                )}
            </div>

            <table className="bookings-table">
                <thead>
                    <tr>
                        <th>ФИО / Логин / Телефон</th>
                        <th>Пользователь</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.length === 0 ? (
                        <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>Пользователи не найдены</td></tr>
                    ) : (
                        filteredUsers.map(u => (
                            <tr key={u.id} style={{opacity: u.is_blocked == 1 ? 0.5 : 1}}>
                                <td>
                                    <strong>{u.full_name}</strong><br/>
                                    <span style={{color:'#666', fontSize:'0.9rem'}}>Login: {u.login}</span><br/>
                                    <span style={{color:'#2980b9', fontSize:'0.9rem'}}>📞 {u.phone || 'Нет'}</span>
                                </td>
                                <td>{u.role === 'admin' ? 'Администратор' : u.role === 'librarian' ? 'Библиотекарь' : 'Читатель'}</td>
                                <td>{u.is_blocked == 1 ? <span className="badge error">Заблокирован</span> : <span className="badge success">Активен</span>}</td>
                                <td>
                                    <div style={{display:'flex', gap:'5px'}}>
                                        <button className="btn-action" style={{background:'#f39c12'}} onClick={() => handleEditClick(u)}>✎</button>
                                        <button className="btn-action btn-cancel" onClick={() => toggleBlock(u.id)}>{u.is_blocked == 1 ? '🔓' : '🔒'}</button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AdminPage;