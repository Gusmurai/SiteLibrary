import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LibrarianPage = () => {
    const [bookings, setBookings] = useState([]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeSearch, setActiveSearch] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState('all'); 
    const [activeDateStart, setActiveDateStart] = useState('');
    const [activeDateEnd, setActiveDateEnd] = useState('');

    const [historySearch, setHistorySearch] = useState('');
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyLibrarian, setHistoryLibrarian] = useState('all');
    const [historyDateStart, setHistoryDateStart] = useState('');
    const [historyDateEnd, setHistoryDateEnd] = useState('');

    // Динамический вывод журнала всех бронирований из базы данных
    const fetchBookings = () => {
        axios.get('http://library-site.ru/api/get_bookings.php')
            .then(res => setBookings(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        if (!user || (user.role !== 'librarian' && user.role !== 'admin')) {
            navigate('/');
        } else {
            fetchBookings();
        }
    }, [user, navigate]);

    // Функция динамического ввода изменений: выдача или отмена бронирования
    const handleAction = async (id, action) => {
        const confirmText = action === 'complete' ? 'Выдать книгу читателю?' : 'Отменить бронь и вернуть книгу?';
        if (!window.confirm(confirmText)) return;

        try {
            await axios.post('http://library-site.ru/api/get_bookings.php', {
                booking_id: id,
                action: action,
                librarian_id: user.id
            });
            fetchBookings(); // Обновление вывода после внесения изменений в базу
        } catch (error) { alert('Ошибка сервера'); }
    };

    // Обработка динамической фильтрации активных заявок на стороне клиента
    const filteredActive = useMemo(() => {
        return bookings.filter(b => {
            if (b.status !== 'active') return false;
            if (activeStatusFilter === 'waiting' && b.is_overdue) return false;
            if (activeStatusFilter === 'overdue' && !b.is_overdue) return false;

            const searchLower = activeSearch.toLowerCase();
            const matchesSearch = b.full_name.toLowerCase().includes(searchLower) ||
                b.book_title.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;

            const date = new Date(b.booking_date);
            if (activeDateStart && date < new Date(activeDateStart)) return false;
            if (activeDateEnd) {
                const endDate = new Date(activeDateEnd);
                endDate.setHours(23, 59, 59);
                if (date > endDate) return false;
            }
            return true;
        });
    }, [bookings, activeSearch, activeStatusFilter, activeDateStart, activeDateEnd]);

    // Обработка динамической фильтрации истории операций на стороне клиента
    const filteredHistory = useMemo(() => {
        return bookings.filter(b => {
            if (b.status === 'active') return false;
            const searchLower = historySearch.toLowerCase();
            const matchesSearch = b.full_name.toLowerCase().includes(searchLower) ||
                b.book_title.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
            if (historyStatus !== 'all' && b.status !== historyStatus) return false;
            if (historyLibrarian !== 'all') {
                if (historyLibrarian === 'null' && b.librarian_name) return false;
                if (historyLibrarian !== 'null' && b.librarian_name !== historyLibrarian) return false;
            }
            const date = new Date(b.booking_date);
            if (historyDateStart && date < new Date(historyDateStart)) return false;
            if (historyDateEnd) {
                const endDate = new Date(historyDateEnd);
                endDate.setHours(23, 59, 59);
                if (date > endDate) return false;
            }
            return true;
        });
    }, [bookings, historySearch, historyStatus, historyLibrarian, historyDateStart, historyDateEnd]);

    const uniqueLibrarians = [...new Set(bookings
        .filter(b => b.librarian_name)
        .map(b => b.librarian_name)
    )];

    const isLibrarian = user && user.role === 'librarian';

    const inputStyle = {
        padding: '0 10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        height: '38px',
        lineHeight: '38px',
        width: '100%',
        boxSizing: 'border-box',
        fontSize: '14px',
        verticalAlign: 'middle',
        display: 'block',
    };

    const selectStyle = {
        ...inputStyle,
        transform: 'translateY(-5px)', 
        cursor: 'pointer'
    };

    return (
        <div className="librarian-page">
            <h1>Управление бронированием</h1>

            {/* === БЛОК 1: АКТИВНЫЕ ЗАЯВКИ === */}
            <div className="admin-news-panel" style={{ borderLeft: '5px solid #e67e22' }}>
                <h3 style={{ marginTop: 0 }}>🔥 Активные заявки ({filteredActive.length})</h3>

                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '15px',
                    alignItems: 'center',
                    flexWrap: 'nowrap'
                }}>
                    <div style={{ flex: 2, minWidth: '250px' }}>
                        <input
                            placeholder="🔍 Поиск (Читатель, Книга)"
                            value={activeSearch}
                            onChange={e => setActiveSearch(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: '160px' }}>
                        <select
                            value={activeStatusFilter}
                            onChange={e => setActiveStatusFilter(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="all">Статус: Все</option>
                            <option value="waiting">Ждёт выдачи</option>
                            <option value="overdue">Истекла</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <small style={{ color: '#666', whiteSpace: 'nowrap' }}>Дата с:</small>
                            <input
                                type="date"
                                value={activeDateStart}
                                onChange={e => setActiveDateStart(e.target.value)}
                                style={{ ...inputStyle, minWidth: '130px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <small style={{ color: '#666', whiteSpace: 'nowrap' }}>по:</small>
                            <input
                                type="date"
                                value={activeDateEnd}
                                onChange={e => setActiveDateEnd(e.target.value)}
                                style={{ ...inputStyle, minWidth: '130px' }}
                            />
                        </div>
                    </div>
                </div>

                {filteredActive.length === 0 ? (
                    <p>Новых заявок нет.</p>
                ) : (
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Читатель / Телефон</th>
                                <th>Книга</th>
                                <th>Статус</th>
                                {isLibrarian && <th>Действия</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredActive.map(item => (
                                <tr key={item.booking_id} style={item.is_overdue ? { backgroundColor: '#ffe6e6' } : {}}>
                                    <td style={{ verticalAlign: 'middle' }}>
                                        {new Date(item.booking_date).toLocaleDateString()} <br />
                                        <small>{new Date(item.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                    </td>
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <strong>{item.full_name}</strong>
                                        <div style={{ fontSize: '0.9rem', color: '#555' }}>Login: {item.login}</div>
                                        <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>📞 {item.phone || 'Нет телефона'}</div>
                                    </td>
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            {item.cover_image && (
                                                <img
                                                    src={`http://library-site.ru/uploads/${item.cover_image}`}
                                                    alt=""
                                                    style={{
                                                        width: '50px',
                                                        height: '75px',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            )}
                                            <span style={{ fontWeight: '500', fontSize: '1.05rem' }}>{item.book_title}</span>
                                        </div>
                                    </td>
                                    <td style={{ verticalAlign: 'middle' }}>
                                        {item.is_overdue
                                            ? <span className="badge error">Истекла</span>
                                            : <span className="badge active">Ждет выдачи</span>
                                        }
                                    </td>
                                    {isLibrarian && (
                                        <td style={{ verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                
                                                {/* Кнопка динамического ввода: выдача книги (скрыта, если бронь истекла) */}
                                                {!item.is_overdue && (
                                                    <button className="btn-action btn-issue" style={{ width: '100%' }} onClick={() => handleAction(item.booking_id, 'complete')}>Выдать</button>
                                                )}

                                                {/* Кнопка динамического ввода: отмена бронирования */}
                                                <button className="btn-action" style={{ backgroundColor: '#c0392b', width: '100%' }} onClick={() => handleAction(item.booking_id, 'cancel')}>Отменить</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* === БЛОК 2: ИСТОРИЯ ОПЕРАЦИЙ === */}
            <div className="admin-news-panel" style={{ marginTop: '40px', borderLeft: '5px solid #95a5a6', background: '#f8f9fa' }}>
                <h3 style={{ marginTop: 0 }}>📒 История операций ({filteredHistory.length})</h3>

                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '15px',
                    alignItems: 'center',
                    flexWrap: 'nowrap'
                }}>
                    <div style={{ flex: 2, minWidth: '200px' }}>
                        <input
                            placeholder="🔍 Поиск (Читатель, Книга)"
                            value={historySearch}
                            onChange={e => setHistorySearch(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <select
                            value={historyStatus}
                            onChange={e => setHistoryStatus(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="all">Статус: Все</option>
                            <option value="completed">Выдана</option>
                            <option value="cancelled">Отменена</option>
                            <option value="expired">Истекла</option>
                        </select>
                    </div>

                    <div style={{ flex: 1, minWidth: '180px' }}>
                        <select
                            value={historyLibrarian}
                            onChange={e => setHistoryLibrarian(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="all">Сотрудник: Все</option>
                            <option value="null">Читатель</option>
                            {uniqueLibrarians.map(lib => (
                                <option key={lib} value={lib}>{lib}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <small style={{ color: '#666', whiteSpace: 'nowrap' }}>Дата с:</small>
                            <input
                                type="date"
                                value={historyDateStart}
                                onChange={e => setHistoryDateStart(e.target.value)}
                                style={{ ...inputStyle, minWidth: '130px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <small style={{ color: '#666', whiteSpace: 'nowrap' }}>по:</small>
                            <input
                                type="date"
                                value={historyDateEnd}
                                onChange={e => setHistoryDateEnd(e.target.value)}
                                style={{ ...inputStyle, minWidth: '130px' }}
                            />
                        </div>
                    </div>
                </div>

                <table className="bookings-table" style={{ opacity: 0.9 }}>
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Читатель</th>
                            <th>Книга</th>
                            <th>Статус</th>
                            <th>Кем обработано</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHistory.map(item => (
                            <tr key={item.booking_id}>
                                <td>{new Date(item.booking_date).toLocaleDateString()}</td>
                                <td>{item.full_name}</td>
                                <td>{item.book_title}</td>
                                <td>
                                    {item.status === 'completed' && <span className="badge success">Выдана</span>}
                                    {item.status === 'cancelled' && <span className="badge gray">Отменена</span>}
                                    {item.status === 'expired' && <span className="badge error">Истекла</span>}
                                </td>
                                <td>
                                    {item.librarian_name ? (
                                        <span>👤 {item.librarian_name}</span>
                                    ) : (
                                        <span style={{ color: '#ccc' }}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LibrarianPage;