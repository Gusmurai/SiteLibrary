import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ProfilePage = () => {
    const { user, login } = useContext(AuthContext); 
    
    // Состояние для переключения вкладок рабочего стола и настроек
    const [activeTab, setActiveTab] = useState('dashboard'); 
    
    // Состояния для хранения динамических данных бронирования и статистики системы
    const [bookings, setBookings] = useState([]);
    const [readerStats, setReaderStats] = useState({ total: 0, active: 0, completed: 0 });
    const [staffStats, setStaffStats] = useState(null);

    // Состояние для фильтрации вывода истории читателя
    const [filter, setFilter] = useState('all');

    // Состояния для форм ввода персональных данных и паролей
    const [oldPass, setOldPass] = useState(''); 
    const [newPass, setNewPass] = useState(''); 
    const [profileData, setProfileData] = useState({ full_name: '', login: '', phone: '' });

    // Функция динамического получения актуальных данных пользователя из базы данных
    const refreshUserInfo = () => {
        if (!user) return;
        
        axios.get(`http://library-site.ru/api/get_user_info.php?id=${user.id}`)
            .then(res => {
                if (res.data && !res.data.error) {
                    // Заполнение состояния формы актуальными значениями из базы данных
                    setProfileData({
                        full_name: res.data.full_name,
                        login: res.data.login,
                        phone: res.data.phone || ''
                    });
                    // Обновление глобального контекста авторизации
                    login(res.data);
                }
            })
            .catch(err => console.error("Ошибка обновления профиля", err));
    };

    useEffect(() => {
        if (user) {
            refreshUserInfo(); // Синхронизация данных пользователя при загрузке компонента
            
            if (user.role === 'reader') {
                fetchReaderData();
            } else {
                fetchStaffData();
            }
        }
    }, [user?.id]);

    // Динамический вывод истории всех бронирований текущего читателя
    const fetchReaderData = () => {
        axios.get(`http://library-site.ru/api/my_bookings.php?user_id=${user.id}`)
            .then(res => {
                const data = res.data;
                setBookings(data);
                setReaderStats({
                    total: data.length,
                    active: data.filter(b => b.status === 'active').length,
                    completed: data.filter(b => b.status === 'completed').length
                });
            });
    };

    // Динамический вывод статистических показателей для сотрудников библиотеки
    const fetchStaffData = () => {
        axios.get(`http://library-site.ru/api/staff_stats.php?user_id=${user.id}&role=${user.role}`)
            .then(res => setStaffStats(res.data))
            .catch(err => console.error(err));
    };

    // Функция динамического ввода изменений в статус брони (отмена пользователем)
    const handleCancel = async (bookingId) => {
        if(!window.confirm('Отменить бронирование?')) return;
        try {
            const res = await axios.post('http://library-site.ru/api/my_bookings.php', {
                booking_id: bookingId, user_id: user.id
            });
            if(res.data.status === 'success') { 
                alert(res.data.message); 
                fetchReaderData(); // Обновление вывода истории после изменений
            } 
        } catch (error) { alert('Ошибка сети'); }
    };

    // Функция ввода обновленных данных профиля (доступна только для администратора)
    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        const phoneRegex = /^\+7\d{10}$/;
        if (profileData.phone && !phoneRegex.test(profileData.phone)) {
            alert('Ошибка формата телефона');
            return;
        }

        try {
            const res = await axios.post('http://library-site.ru/api/profile.php', {
                action: 'update_info',
                user_id: user.id,
                ...profileData
            });

            if (res.data.status === 'success') {
                alert(res.data.message);
                login(res.data.user); // Синхронизация отображаемых данных в интерфейсе
            }
        } catch (error) { alert('Ошибка соединения с сервером'); }
    };

    // Функция ввода нового пароля с предварительной проверкой текущего значения
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!newPass || !oldPass) return;
        try {
            const res = await axios.post('http://library-site.ru/api/profile.php', {
                user_id: user.id, old_password: oldPass, new_password: newPass
            });
            if (res.data.error) { alert(res.data.error); } 
            else { 
                alert('Пароль изменен!'); 
                setOldPass(''); 
                setNewPass(''); 
            }
        } catch (error) { alert('Ошибка'); }
    };

    // Обработка динамической фильтрации списка бронирований
    const filteredBookings = bookings.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    if (!user) return <div>Загрузка...</div>;

    const isReader = user.role === 'reader';
    const isAdmin = user.role === 'admin';
    const isLibrarian = user.role === 'librarian';

    return (
        <div className="profile-page">
            <h1>Личный кабинет</h1>
            
            <div className="tabs">
                <button className={activeTab === 'dashboard' ? 'tab active' : 'tab'} onClick={() => setActiveTab('dashboard')}>
                    {isReader ? '📚 Мои книги' : '📊 Рабочие показатели'}
                </button>
                <button className={activeTab === 'profile' ? 'tab active' : 'tab'} onClick={() => setActiveTab('profile')}>
                    👤 Настройки профиля
                </button>
            </div>

            {/* Вкладка 1: Информационная панель (вывод данных) */}
            {activeTab === 'dashboard' && (
                <div className="tab-content">
                    {isReader && (
                        <>
                            <div className="stats-container">
                                <div className="stat-box" style={{background: '#fff3cd', color: '#856404'}}><h3>{readerStats.active}</h3><p>Активные брони</p></div>
                                <div className="stat-box" style={{background: '#d4edda', color: '#155724'}}><h3>{readerStats.completed}</h3><p>Завершённые брони</p></div>
                                <div className="stat-box" style={{background: '#e2e3e5', color: '#383d41'}}><h3>{readerStats.total}</h3><p>Всего заявок</p></div>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                <h2 style={{margin: 0}}>История заявок</h2>
                                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input" style={{width: '200px', padding: '5px 10px', height: '35px'}}>
                                    <option value="all">Все статусы</option>
                                    <option value="active">Ждет выдачи</option>
                                    <option value="completed">Выдана</option>
                                    <option value="expired">Истек срок</option>
                                    <option value="cancelled">Отменена</option>
                                </select>
                            </div>
                            <table className="bookings-table">
                                <thead><tr><th>Дата</th><th>Книга</th><th>Автор</th><th>Статус</th><th>Действие</th></tr></thead>
                                <tbody>
                                    {filteredBookings.map(item => (
                                        <tr key={item.id}>
                                            <td>{new Date(item.booking_date).toLocaleDateString()}</td>
                                            <td>{item.title}</td>
                                            <td>{item.author}</td>
                                            <td>
                                                {/* ИСПРАВЛЕННЫЙ БЛОК СТАТУСОВ */}
                                                {item.status === 'active' && <span className="badge active">Ждет выдачи</span>}
                                                {item.status === 'completed' && <span className="badge success">Выдана</span>}
                                                {item.status === 'expired' && <span className="badge error">Истек срок</span>}
                                                {item.status === 'cancelled' && <span className="badge gray">Отменена</span>}
                                            </td>
                                            <td>
                                                {item.status === 'active' && 
                                                    <button className="btn-action btn-cancel" style={{fontSize: '0.8rem'}} onClick={() => handleCancel(item.id)}>Отменить</button>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {!isReader && (
                        <>
                           <h2 style={{marginTop: 0}}>{isAdmin ? 'Статистика системы' : 'Ваша эффективность работы с бронированием книг'}</h2>
                            
                            {staffStats ? (
                                <div className="stats-container">
                                    {isAdmin && (
                                        <>
                                            <div className="stat-box" style={{background: '#d6eaf8'}}><h3>{staffStats.total_users}</h3><p>Пользователей</p></div>
                                            <div className="stat-box" style={{background: '#d5f5e3'}}><h3>{staffStats.total_books}</h3><p>Книг в фонде</p></div>
                                            <div className="stat-box" style={{background: '#fcf3cf'}}><h3>{staffStats.active_bookings}</h3><p>Активных заявок</p></div>
                                            <div className="stat-box" style={{background: '#e8daef'}}><h3>{staffStats.completed_bookings}</h3><p>Выдано книг</p></div>
                                            <div className="stat-box" style={{background: '#fadbd8'}}><h3>{staffStats.cancelled_bookings}</h3><p>Отмен/Просрочек</p></div>
                                            <div className="stat-box" style={{background: '#e5e8e8'}}><h3>{staffStats.all_time_bookings}</h3><p>Всего заявок</p></div>
                                        </>
                                    )}
                                    {isLibrarian && (
                                        <>
                                            <div className="stat-box" style={{background: '#d5f5e3'}}><h3>{staffStats.issued_by_me}</h3><p>Выдано вами</p></div>
                                            <div className="stat-box" style={{background: '#fadbd8'}}><h3>{staffStats.cancelled_by_me}</h3><p>Отменено вами</p></div>
                                            <div className="stat-box" style={{background: '#e2e3e5'}}><h3>{staffStats.total_processed}</h3><p>Всего операций</p></div>
                                        </>
                                    )}
                                </div>
                            ) : <p>Загрузка статистики...</p>}

                            <div style={{marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px'}}>
                                <h3>ℹ Информация</h3>
                                <p>Используйте меню сверху для доступа к рабочим разделам:</p>
                                <ul>
                                    <li><strong>Бронирование:</strong> Выдача и прием книг.</li>
                                    {isAdmin ? (
                                        <li><strong>Пользователи:</strong> Управление аккаунтами.</li>
                                    ) : (
                                        <li><strong>Читатели:</strong> Регистрация читателей.</li>
                                    )}
                                    {isLibrarian && (
                                        <li><strong>Каталог:</strong> Заполнение каталога и редактирование книг.</li>
                                    )}
                                    <li><strong>Новости:</strong> Публикация новостей на главной странице.</li>
                                    {isAdmin && (
                                        <li><strong>Настройки:</strong> Изменение информации о библиотеке.</li>
                                    )}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Вкладка настроек профиля (ввод данных) */}
            {activeTab === 'profile' && (
                <div className="tab-content profile-info-container">
                    <p><strong>Пользователь:</strong> {isAdmin ? 'Администратор' : isLibrarian ? 'Библиотекарь' : 'Читатель'}</p>

                    <h3>✏ Основная информация</h3>
                    {isLibrarian && <p style={{color:'#888', fontSize:'0.9rem'}}>* Для изменения ФИО, телефона, логина обратитесь к администратору.</p>}
                    {isReader && <p style={{color:'#888', fontSize:'0.9rem'}}>* Для изменения ФИО, телефона, логина обратитесь к администратору или библиотекарю.</p>}
                    
                    <form onSubmit={handleUpdateInfo} style={{maxWidth: '500px', marginBottom: '40px'}}>
                        <div style={{marginBottom: '10px'}}>
                            <label>ФИО:</label>
                            <input className="form-input" value={profileData.full_name} onChange={e => setProfileData({...profileData, full_name: e.target.value})} required disabled={!isAdmin} style={!isAdmin ? {backgroundColor: '#f5f5f5', cursor: 'not-allowed'} : {}} />
                        </div>
                        <div style={{marginBottom: '10px'}}>
                            <label>Логин:</label>
                            <input className="form-input" value={profileData.login} onChange={e => setProfileData({...profileData, login: e.target.value})} required disabled={!isAdmin} style={!isAdmin ? {backgroundColor: '#f5f5f5', cursor: 'not-allowed'} : {}} />
                        </div>
                        <div style={{marginBottom: '10px'}}>
                            <label>Телефон:</label>
                            <input className="form-input" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} placeholder="+79209239687" disabled={!isAdmin} style={!isAdmin ? {backgroundColor: '#f5f5f5', cursor: 'not-allowed'} : {}} />
                        </div>
                        {isAdmin && <button type="submit" className="btn-submit" style={{background: '#3498db'}}>Сохранить данные</button>}
                    </form>
                    
                    <hr />
                    <h3>🔐 Смена пароля</h3>
                    <form onSubmit={handleChangePassword} style={{maxWidth: '500px'}}>
                        <div style={{marginBottom: '10px'}}><label>Текущий пароль:</label><input className="form-input" type="password" placeholder="Введите старый пароль" value={oldPass} onChange={(e) => setOldPass(e.target.value)} required /></div>
                        <div style={{marginBottom: '10px'}}><label>Новый пароль:</label><input className="form-input" type="text" placeholder="Придумайте новый пароль" value={newPass} onChange={(e) => setNewPass(e.target.value)} required /></div>
                        <button type="submit" className="btn-submit">Обновить пароль</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;