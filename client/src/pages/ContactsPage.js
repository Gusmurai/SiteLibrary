import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContactsPage = () => {
    const [info, setInfo] = useState(null);

    // Загрузка и динамический вывод контактной информации из базы данных
    useEffect(() => {
        axios.get('http://library-site.ru/api/library_info.php')
            .then(res => setInfo(res.data))
            .catch(err => console.error(err));
    }, []);

    if (!info) return <div>Загрузка...</div>;

    return (
        <div className="contacts-page" style={{padding: '20px', background: 'white', borderRadius: '8px'}}>
            <h1>Контакты</h1>
            <div className="contact-info">
                <p><strong>📍 Адрес:</strong> {info.address}</p>
                <p><strong>📞 Телефон:</strong> {info.phone}</p>
                <p><strong>📧 Email:</strong> {info.email}</p>
            </div>
            <div style={{marginTop: '30px'}}>
                <h3>Мы на карте:</h3>
                {/* Динамический вывод интерактивной карты по коду из базы данных */}
                {info.map_code ? (
                    <div 
                        className="map-container"
                        dangerouslySetInnerHTML={{ __html: info.map_code }} 
                        style={{width: '100%', height: '400px', overflow: 'hidden', borderRadius: '8px'}}
                    />
                ) : (
                    <div style={{padding: '20px', background: '#eee', textAlign: 'center'}}>
                        Карта еще не добавлена администратором.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactsPage;