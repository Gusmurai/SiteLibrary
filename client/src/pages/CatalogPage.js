import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const CatalogPage = () => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    const [viewArchive, setViewArchive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyAvailable, setOnlyAvailable] = useState(false);

    const [selectedBook, setSelectedBook] = useState(null);
    const [editBook, setEditBook] = useState(null); 
    const [isEditMode, setIsEditMode] = useState(false); 

    const [formBook, setFormBook] = useState({
        id: '', title: '', author: '', genre: '', description: '', 
        total_quantity: 1, available_quantity: 1
    });
    const [bookFile, setBookFile] = useState(null);

    // Функция динамического вывода каталога книг из базы данных
    const loadBooks = () => {
        axios.get(`http://library-site.ru/api/books.php?show_archived=true`) 
            .then(response => {
                setBooks(response.data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => { loadBooks(); }, [user]);

    // Обработка поиска и фильтрации книг на стороне клиента
    useEffect(() => {
        let result = books;
        if (viewArchive) {
            result = result.filter(book => book.is_archived == 1);
        } else {
            result = result.filter(book => book.is_archived == 0);
        }
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(book => 
                book.title.toLowerCase().includes(lowerTerm) || 
                book.author.toLowerCase().includes(lowerTerm)
            );
        }
        if (!viewArchive && onlyAvailable) {
            result = result.filter(book => book.available_quantity > 0);
        }
        setFilteredBooks(result);
    }, [searchTerm, onlyAvailable, books, viewArchive]);

    // Проверка прав доступа перед выводом подробной аннотации
    const handleViewDetails = (book) => {
        if (!user) {
            alert('Подробная информация доступна только зарегистрированным читателям.');
            return;
        }
        setSelectedBook(book);
    };

    // Функция изменения статуса архивности книги в базе данных
    const handleArchive = async (id) => {
        if(!window.confirm('Изменить статус архива?')) return;
        try {
            const formData = new FormData();
            formData.append('action', 'toggle_archive');
            formData.append('id', id);
            await axios.post('http://library-site.ru/api/books.php', formData);
            loadBooks();
        } catch (error) { alert('Ошибка сервера'); }
    };

    // Функция ввода новой заявки на бронирование
    const handleBooking = async (bookId) => {
        if (!window.confirm('Забронировать эту книгу?')) return;
        try {
            const response = await axios.post('http://library-site.ru/api/book_book.php', {
                user_id: user.id, book_id: bookId
            });
            if (response.data.status === 'success') {
                alert(response.data.message);
                loadBooks(); 
            } else { alert('Ошибка: ' + response.data.error); }
        } catch (error) { alert('Ошибка сети'); }
    };

    // Функция динамического ввода или обновления данных о книге в каталоге
    const handleSaveBook = async (e) => {
        e.preventDefault();
        if (parseInt(formBook.available_quantity) > parseInt(formBook.total_quantity)) {
            alert('Ошибка: доступных книг больше, чем всего в фонде');
            return;
        }
        const formData = new FormData();
        formData.append('title', formBook.title);
        formData.append('author', formBook.author);
        formData.append('genre', formBook.genre);
        formData.append('description', formBook.description);
        formData.append('total_quantity', formBook.total_quantity);
        formData.append('available_quantity', formBook.available_quantity);
        if (isEditMode) formData.append('id', formBook.id);
        if (bookFile) formData.append('cover_image', bookFile);

        try {
            const res = await axios.post('http://library-site.ru/api/books.php', formData);
            if (res.data.status === 'success') {
                alert(res.data.message);
                setEditBook(null); 
                loadBooks(); 
            } else { alert(res.data.error || 'Ошибка сохранения'); }
        } catch (error) { alert('Ошибка сети'); }
    };

    if (loading) return <div style={{textAlign: 'center', marginTop: '20px'}}>Загрузка...</div>;

    const tabStyle = (isActive) => ({
        padding: '10px 20px', cursor: 'pointer', background: 'none', border: 'none',
        borderBottom: isActive ? '3px solid #3498db' : '3px solid transparent',
        color: isActive ? '#3498db' : '#666', fontWeight: isActive ? 'bold' : 'normal',
        fontSize: '1rem', marginRight: '10px'
    });

    return (
        <div className="catalog-page">
            <h1 style={{margin: '0 0 10px 0', borderBottom: 'none'}}>Каталог книг</h1>
            <div style={{height: '2px', background: '#3498db', width: '100%', marginBottom: '20px'}}></div>

            {user && (user.role === 'librarian' || user.role === 'admin') && (
                <div style={{marginBottom: '20px', borderBottom: '1px solid #eee'}}>
                    <button style={tabStyle(!viewArchive)} onClick={() => setViewArchive(false)}>📚 Активные книги</button>
                    <button style={tabStyle(viewArchive)} onClick={() => setViewArchive(true)}>❌ Архив списанных</button>
                </div>
            )}

            {user && user.role === 'librarian' && !viewArchive && (
                <div style={{marginBottom: '20px'}}>
                    <button className="btn-action" style={{background: '#27ae60', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => { setIsEditMode(false); setFormBook({ id: '', title: '', author: '', genre: '', description: '', total_quantity: 1, available_quantity: 1 }); setBookFile(null); setEditBook(true); }}>
                        <span>➕</span> Добавить книгу
                    </button>
                </div>
            )}

            <div style={{display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center', flexWrap: 'wrap'}}>
                <input type="text" placeholder="🔍 Поиск..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{width: '400px', padding: '10px 15px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem'}} />
                {!viewArchive && (
                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none'}}>
                        <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)}/> Только в наличии
                    </label>
                )}
            </div>
            
            <div className="book-grid">
                {filteredBooks.map((book) => (
                    <div key={book.id} className="book-card" style={book.is_archived == 1 ? {opacity: 0.8, border: '1px dashed #999'} : {}}>
                        <div className="book-image" onClick={() => handleViewDetails(book)} style={{cursor: 'pointer'}}>
                            {book.cover_image ? <img src={`http://library-site.ru/uploads/${book.cover_image}`} alt="" /> : <div className="no-image">Нет обложки</div>}
                            {book.is_archived == 1 && <div className="archive-badge" style={{background:'#7f8c8d'}}>АРХИВ</div>}
                        </div>
                        <div className="book-info">
                            <h3 onClick={() => handleViewDetails(book)} style={{cursor: 'pointer'}}>{book.title}</h3>
                            <p className="author">{book.author}</p>
                            <p className="genre">{book.genre}</p>
                            <div className="book-footer" style={{marginTop: 'auto'}}>
                                {user ? <span className={book.available_quantity > 0 ? "status-ok" : "status-out"}>{book.is_archived == 1 ? "Списана" : (book.available_quantity > 0 ? `В наличии: ${book.available_quantity}` : "Нет в наличии")}</span> : <span style={{fontSize: '0.75rem', color: '#999'}}>Войдите для просмотра</span>}
                                {user && user.role === 'reader' && book.available_quantity > 0 && book.is_archived == 0 && <button className="btn-booking" onClick={() => handleBooking(book.id)}>Забронировать</button>}
                                {user && user.role === 'librarian' && (
                                    <div style={{display: 'flex', gap: '5px'}}>
                                        <button className="btn-action" style={{background: '#f39c12'}} onClick={() => { setIsEditMode(true); setFormBook({...book}); setBookFile(null); setEditBook(true); }}>✎</button> 
                                        <button className="btn-action" style={{background: book.is_archived == 1 ? '#27ae60' : '#7f8c8d'}} onClick={() => handleArchive(book.id)}>{book.is_archived == 1 ? 'Вернуть' : 'В архив'}</button>
                                    </div>
                                )}
                                <button className="btn-details" onClick={() => handleViewDetails(book)}>Подробнее</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedBook && (
                <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedBook(null)}>×</button>
                        <div className="modal-body">
                            <div className="modal-img">{selectedBook.cover_image ? <img src={`http://library-site.ru/uploads/${selectedBook.cover_image}`} alt="" /> : <div className="no-image">Нет обложки</div>}</div>
                            <div className="modal-text">
                                <h2>{selectedBook.title}</h2>
                                <p><strong>Автор:</strong> {selectedBook.author}</p>
                                <p><strong>Жанр:</strong> {selectedBook.genre}</p>
                                <p><strong>Статус:</strong> {selectedBook.is_archived == 1 ? <span style={{color:'red'}}>В архиве</span> : 'В фонде'}</p>
                                <p><strong>Всего в фонде:</strong> {selectedBook.total_quantity} экз.</p>
                                <p><strong>Доступно для брони:</strong> {selectedBook.available_quantity} экз.</p>
                                <hr/><p style={{lineHeight: '1.6'}}>{selectedBook.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editBook && (
                <div className="modal-overlay" onClick={() => setEditBook(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
                        <button className="close-btn" onClick={() => setEditBook(null)}>×</button>
                        <h2>{isEditMode ? 'Редактирование книги' : 'Новая книга'}</h2>
                        <form onSubmit={handleSaveBook} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                            <input placeholder="Название" value={formBook.title} onChange={e => setFormBook({...formBook, title: e.target.value})} required className="form-input"/>
                            <input placeholder="Автор" value={formBook.author} onChange={e => setFormBook({...formBook, author: e.target.value})} required className="form-input"/>
                            <input placeholder="Жанр" value={formBook.genre} onChange={e => setFormBook({...formBook, genre: e.target.value})} required className="form-input"/>
                            <textarea placeholder="Аннотация" rows="4" value={formBook.description} onChange={e => setFormBook({...formBook, description: e.target.value})} className="form-input"/>
                            <div style={{display:'flex', gap:'10px'}}>
                                <div style={{flex:1}}><label>Всего в фонде:</label><input type="number" min="0" value={formBook.total_quantity} onChange={e => setFormBook({...formBook, total_quantity: e.target.value})} required className="form-input"/></div>
                                <div style={{flex:1}}><label>Доступно сейчас:</label><input type="number" min="0" value={formBook.available_quantity} onChange={e => setFormBook({...formBook, available_quantity: e.target.value})} required className="form-input"/></div>
                            </div>
                            <label>Обложка:</label><input type="file" onChange={e => setBookFile(e.target.files[0])} accept="image/*"/>
                            <button type="submit" className="btn-submit">{isEditMode ? 'Сохранить изменения' : 'Создать книгу'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogPage;


