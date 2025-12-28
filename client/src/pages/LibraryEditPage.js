import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LibraryEditPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [info, setInfo] = useState({
        library_name: '', address: '', phone: '', email: '', description: '', map_code: ''
    });

    // Получение текущих настроек библиотеки для предварительного вывода в форме
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        axios.get('http://library-site.ru/api/library_info.php')
            .then(res => {
                const data = res.data;
                setInfo({
                    library_name: data.library_name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    description: data.description || '',
                    map_code: data.map_code || ''
                });
            });
    }, [user, navigate]);

    const handleChange = (e) => {
        setInfo({...info, [e.target.name]: e.target.value});
    };

    // Функция динамического ввода измененной информации о библиотеке в базу данных
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://library-site.ru/api/library_info.php', info);
            if (res.data.status === 'success') {
                
                // === ОТПРАВЛЯЕМ СИГНАЛ ОБ ОБНОВЛЕНИИ ===
                window.dispatchEvent(new Event('libraryInfoUpdated'));
                
                alert('Настройки сохранены!');
            } else {
                alert('Ошибка сохранения');
            }
        } catch (error) {
            alert('Ошибка сети');
        }
    };

    return (
        <div className="admin-page">
            <h1>⚙ Настройки библиотеки</h1>
            <form onSubmit={handleSubmit} className="admin-news-panel">
                <div style={{marginBottom: '15px'}}>
                    <label>Название библиотеки:</label>
                    <input name="library_name" value={info.library_name} onChange={handleChange} required className="form-input"/>
                </div>
                <div style={{marginBottom: '15px'}}>
                    <label>Адрес:</label>
                    <input name="address" value={info.address} onChange={handleChange} required className="form-input"/>
                </div>
                <div style={{marginBottom: '15px'}}>
                    <label>Телефон:</label>
                    <input name="phone" value={info.phone} onChange={handleChange} required className="form-input"/>
                </div>
                <div style={{marginBottom: '15px'}}>
                    <label>Email:</label>
                    <input name="email" value={info.email} onChange={handleChange} required className="form-input"/>
                </div>
                <div style={{marginBottom: '15px'}}>
                    <label>Описание (О нас):</label>
                    <textarea name="description" rows="5" value={info.description} onChange={handleChange} required className="form-input"/>
                </div>
                <div style={{marginBottom: '15px'}}>
                    <label>Код карты (iframe):</label>
                    <textarea name="map_code" rows="4" value={info.map_code} onChange={handleChange} className="form-input"/>
                </div>
                <button type="submit" className="btn-submit">Сохранить изменения</button>
            </form>

            <div className="admin-news-panel" style={{marginTop: '40px', background: '#fff3cd', borderColor: '#ffecb5'}}>
                <h3>💾 Экспорт и импорт каталога</h3>
                <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                    {/* Выгрузка данных каталога из базы данных в файл формата json */}
                    <a href="http://library-site.ru/api/export_import.php" target="_blank" rel="noreferrer">
                        <button className="btn-action" style={{backgroundColor: '#e67e22', padding: '10px 20px', fontSize: '1rem'}}>
                            ⬇ Скачать каталог (JSON)
                        </button>
                    </a>

                    <div style={{borderLeft: '1px solid #ccc', paddingLeft: '20px'}}>
                        <p style={{margin: '0 0 5px'}}>Загрузить книги из файла:</p>
                        {/* Загрузка внешнего файла для последующего ввода данных в базу */}
                        <input 
                            type="file" 
                            onChange={async (e) => {
                                if(!window.confirm('Загрузить книги в базу?')) return;
                                const file = e.target.files[0];
                                if(!file) return;
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                    const res = await axios.post('http://library-site.ru/api/export_import.php', formData);
                                    alert(res.data.message);
                                } catch(err) { alert('Ошибка загрузки'); }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryEditPage;