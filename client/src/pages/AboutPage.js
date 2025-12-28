import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AboutPage = () => {
    const [info, setInfo] = useState(null);

    // Динамический вывод информации о библиотеке и статистики фонда
    useEffect(() => {
        axios.get('http://library-site.ru/api/library_info.php')
            .then(res => setInfo(res.data))
            .catch(err => console.error(err));
    }, []);

    if (!info) return <div>Загрузка...</div>;

    return (
        <div className="about-page" style={{padding: '20px', background: 'white', borderRadius: '8px'}}>
            <h1>О нашей библиотеке</h1>
            <h2 style={{color: '#3498db'}}>{info.library_name}</h2>
            
          <div style={{
                lineHeight: '1.6', 
                fontSize: '1.1rem', 
                whiteSpace: 'pre-wrap', 
                marginBottom: '20px',
                color: '#444'
            }}>
                {info.description}
            </div>

            <div className="stats" style={{
                marginTop: '30px', 
                padding: '25px', 
                background: 'linear-gradient(to right, #eef2f3, #e8e9eb)', 
                borderRadius: '12px',
                borderLeft: '5px solid #3498db'
            }}>
                <h3 style={{marginTop: 0, color: '#2c3e50'}}>📚 Электронный сервис библиотеки</h3>
                
                <p style={{fontSize: '1rem', color: '#555', marginBottom: '20px'}}>
                    Наш сайт позволяет читателям <strong>бронировать книги онлайн</strong>. 
                    Больше не нужно тратить время на поиск — выберите книгу в каталоге, 
                    нажмите кнопку «Забронировать», и мы подготовим её к вашему приходу.
                    Бронь действует 3 дня.
                </p>

                <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px'}}>
                    <div style={{flex: 1, background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'center'}}>
                        <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#3498db'}}>{info.book_count}</div>
                        <div style={{fontSize: '0.9rem', color: '#7f8c8d'}}>Книг в фонде</div>
                    </div>

                    <div style={{flex: 1, background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'center'}}>
                        <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#e67e22'}}>{info.active_bookings}</div>
                        <div style={{fontSize: '0.9rem', color: '#7f8c8d'}}>Активных заявок сейчас</div>
                    </div>

                    <div style={{flex: 1, background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'center'}}>
                        <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#27ae60'}}>{info.completed_bookings}</div>
                        <div style={{fontSize: '0.9rem', color: '#7f8c8d'}}>Книг уже выдано</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;