import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const NewsPage = () => {
    const [news, setNews] = useState([]);
    const { user } = useContext(AuthContext);

    // Состояние для хранения поискового запроса
    const [searchTerm, setSearchTerm] = useState('');

    // Состояния управления формой ввода данных
    const [showForm, setShowForm] = useState(false); 
    const [editingId, setEditingId] = useState(null); 

    // Состояния полей ввода новости
    const [title, setTitle] = useState('');
    const [shortContent, setShortContent] = useState('');
    const [fullContent, setFullContent] = useState('');
    const [file, setFile] = useState(null);

    // Состояние для динамического вывода новости в модальном окне
    const [selectedNews, setSelectedNews] = useState(null);

    // Динамический вывод ленты новостей из базы данных
    const fetchNews = async () => {
        try {
            const response = await axios.get('http://library-site.ru/api/news.php');
            setNews(response.data);
        } catch (error) {
            console.error("Ошибка загрузки", error);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    // Функция фильтрации новостей на стороне клиента для живого поиска
    const filteredNews = news.filter(item => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            item.title.toLowerCase().includes(lowerTerm) ||
            item.short_content.toLowerCase().includes(lowerTerm) ||
            item.full_content.toLowerCase().includes(lowerTerm)
        );
    });

    const handleAddClick = () => {
        setEditingId(null);
        setTitle('');
        setShortContent('');
        setFullContent('');
        setFile(null);
        setShowForm(true);
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setTitle(item.title);
        setShortContent(item.short_content);
        setFullContent(item.full_content);
        setFile(null);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Функция динамического удаления записи и связанного изображения с сервера
    const handleDeleteClick = async (id) => {
        if(!window.confirm('Вы уверены, что хотите удалить эту новость?')) return;

        try {
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('id', id);

            const res = await axios.post('http://library-site.ru/api/news.php', formData);
            
            if (res.data.status === 'success') {
                alert('Новость удалена');
                fetchNews(); // Обновление вывода после удаления
            }
        } catch (error) {
            alert('Ошибка сети');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
    };

    // Функция динамического ввода новых или измененных данных новости в базу данных
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !shortContent || !fullContent) return;

        const formData = new FormData();
        formData.append('title', title);
        formData.append('short_content', shortContent);
        formData.append('full_content', fullContent);
        
        if (editingId) {
            formData.append('id', editingId);
        }
        if (file) {
            formData.append('image', file);
        }

        try {
            const res = await axios.post('http://library-site.ru/api/news.php', formData);
            if (res.data.status === 'success') {
                alert(res.data.message);
                setShowForm(false);
                fetchNews(); // Синхронизация вывода с актуальными данными БД
                
                setTitle('');
                setShortContent('');
                setFullContent('');
                setFile(null);
            }
        } catch (error) {
            alert('Ошибка при сохранении');
        }
    };

    return (
        <div className="news-page">
            
            <h1 style={{margin: '0 0 10px 0', borderBottom: 'none'}}>Новости библиотеки</h1>
            <div style={{height: '2px', background: '#3498db', width: '100%', marginBottom: '20px'}}></div>

            {user && (user.role === 'admin' || user.role === 'librarian') && !showForm && (
                <div style={{marginBottom: '20px'}}>
                    <button 
                        className="btn-action" 
                        style={{background: '#27ae60', padding: '10px 20px', fontSize: '1rem', display:'flex', alignItems:'center', gap:'5px', width:'fit-content'}}
                        onClick={handleAddClick}
                    >
                        ➕ Добавить новость
                    </button>
                </div>
            )}

            {showForm && (
                <div className="admin-news-panel" style={{border: '2px solid #3498db', background: '#f0f8ff', marginBottom: '30px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                        <h3 style={{margin:0}}>{editingId ? '✎ Редактирование новости' : '📢 Новая новость'}</h3>
                        <button onClick={handleCancel} style={{background:'#ccc', border:'none', padding:'5px 10px', cursor:'pointer', borderRadius:'4px'}}>
                            Отмена
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{marginBottom:'10px'}}>
                            <label style={{display:'block', marginBottom:'5px', color:'#666'}}>Заголовок:</label>
                            <input className="form-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>
                        <div style={{marginBottom:'10px'}}>
                            <label style={{display:'block', marginBottom:'5px', color:'#666'}}>Краткое описание (для ленты):</label>
                            <textarea className="form-input" rows="2" value={shortContent} onChange={(e) => setShortContent(e.target.value)} required />
                        </div>
                        <div style={{marginBottom:'10px'}}>
                            <label style={{display:'block', marginBottom:'5px', color:'#666'}}>Полный текст (в окне):</label>
                            <textarea className="form-input" rows="6" value={fullContent} onChange={(e) => setFullContent(e.target.value)} required />
                        </div>
                        <div style={{marginBottom: '15px'}}>
                            <label style={{display:'block', marginBottom:'5px', color:'#666'}}>Изображение:</label>
                            <input id="fileInput" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
                        </div>
                        <button type="submit" className="btn-submit" style={{background: '#3498db'}}>
                            {editingId ? 'Сохранить изменения' : 'Опубликовать'}
                        </button>
                    </form>
                </div>
            )}

            <div style={{marginBottom: '20px'}}>
                <input 
                    type="text" 
                    placeholder="🔍 Поиск новостей..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{width: '100%', maxWidth: '400px', padding: '10px 15px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem'}}
                />
            </div>

            <div className="news-list">
                {filteredNews.map(item => (
                    <div key={item.id} className="news-item">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                            <div className="news-date">
                                {new Date(item.publish_date).toLocaleDateString()}
                            </div>
                            
                            {user && (user.role === 'admin' || user.role === 'librarian') && (
                                <div style={{display: 'flex', gap: '5px'}}>
                                    <button 
                                        className="btn-action" 
                                        style={{background: '#f39c12', padding: '5px 10px', fontSize: '0.8rem'}}
                                        onClick={() => handleEditClick(item)}
                                    >
                                        ✎
                                    </button>
                                    <button 
                                        className="btn-action" 
                                        style={{background: '#c0392b', padding: '5px 10px', fontSize: '0.8rem'}}
                                        onClick={() => handleDeleteClick(item.id)}
                                    >
                                        🗑
                                    </button>
                                </div>
                            )}
                        </div>

                        <h2>{item.title}</h2>
                        
                        {item.image && (
                            <div className="news-image">
                                <img 
                                    src={`http://library-site.ru/uploads/news/${item.image}`} 
                                    alt={item.title} 
                                    style={{maxHeight: '400px', objectFit: 'contain', width: 'auto'}} 
                                />
                            </div>
                        )}
                        
                        <p className="news-content">{item.short_content}</p>

                        <button 
                            className="btn-details" 
                            style={{marginTop: '10px'}}
                            onClick={() => setSelectedNews(item)}
                        >
                            Читать полностью
                        </button>
                    </div>
                ))}
            </div>

            {/* Вывод полного содержания новости в модальном окне */}
            {selectedNews && (
                <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedNews(null)}>×</button>
                        
                        {/* ИСПРАВЛЕНО: Добавлен gap: 5px и убраны отступы h2 для плотного прилегания */}
                        <div className="modal-body" style={{flexDirection: 'column', gap: '5px'}}>
                            <h2 style={{margin: '0'}}>{selectedNews.title}</h2>
                            
                            <p className="news-date" style={{margin: '0 0 15px 0', color: '#888'}}>
                                {new Date(selectedNews.publish_date).toLocaleString([], {
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>

                            {selectedNews.image && (
                                <img 
                                    src={`http://library-site.ru/uploads/news/${selectedNews.image}`} 
                                    alt={selectedNews.title} 
                                    style={{width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px'}}
                                />
                            )}

                            <div className="full-text" style={{lineHeight: '1.6', fontSize: '1.05rem', whiteSpace: 'pre-wrap'}}>
                                {selectedNews.full_content}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsPage;