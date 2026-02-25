import http from 'k6/http';
import { check, sleep } from 'k6';


export const options = {
    stages: [
        { duration: '10s', target: 3 },  // Разгон до 3 пользователей
        { duration: '20s', target: 5 },  // Пик нагрузки 5 пользователей
        { duration: '10s', target: 0 },  // Спад
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% запросов быстрее 500ms
        http_req_failed: ['rate<0.01'],    // Меньше 1% ошибок
    },
};

export default function () {
    // GET запрос к главной странице нашего Python-сервера
    let homeRes = http.get('http://localhost:3333');
    // Проверяем, что сервер ответил
    check(homeRes, {
        'home page status is 200': (r) => r.status === 200,
        'home page has content': (r) => r.body.length > 0,
    });
    // Имитация "думающего" пользователя
    sleep(1);
}