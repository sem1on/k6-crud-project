import http from 'k6/http';
import { check, sleep } from 'k6';


export const options = {
    vus: 5,               // 5 виртуальных пользователей
    duration: '30s',      // тест длится 30 секунд
};

export default function () {
    // Делаем GET запрос к тестовому API
    const res = http.get('https://jsonplaceholder.typicode.com/posts/1');

    // Проверяем, что ответ правильный
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
        'body is not empty': (r) => r.body.length > 0,
    });

    // Пауза между действиями (имитация реального пользователя)
    sleep(1);
}
