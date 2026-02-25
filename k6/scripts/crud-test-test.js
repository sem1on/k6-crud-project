import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { generateRandomPost, checkResponse } from './helpers.js';

// =============================================
// КАСТОМНЫЕ МЕТРИКИ
// =============================================

// Тренды (время выполнения) для каждой операции
const getTrend = new Trend('get_duration');
const getByIdTrend = new Trend('get_by_id_duration');
const postTrend = new Trend('post_duration');
const putTrend = new Trend('put_duration');
const deletTrend = new Trend('delete_duration');

// Счетчики успешных операций
const getSuccessCount = new Counter('get_success_count');
const postSuccessCount = new Counter('post_success_count');
const putSuccessCount = new Counter('put_success_count');
const deleteSuccessCount = new Counter('delete_success_count');

// Процент ошибок по типам операций
const getErrorRate = new Rate('get_errors');
const postErrorRate = new Rate('post_errors');
const putErrorRate = new Rate('put_errors');
const deleteErrorRate = new Rate('delete_errors');

// =============================================
// НАСТРОЙКИ ТЕСТА
// =============================================

export const options = {
    // Этапы нагрузки
    stages: [
        { duration: '10s', target: 2 }, // Разогрев
        { duration: '20s', target: 5 }, // Рабочая нагрузка
        { duration: '10s', target: 0 }, // Спад
    ],

    // Пороги производительности
    thresholds: {
        // Общие метрики
        http_req_duration: ['p(95)<2000'],  // 95% запросов быстрее 2с
        http_req_failed: ['rate<0.1'],      // Меньше 10% ошибок

        // Специфичные для операций
        'get_duration': ['p(95)<1000'],     // GET должен быть быстрым
        'post_duration': ['p(95)<1500'],    // CREATE чуть медленнее
        'put_duration': ['p(95)<1500'],     // UPDATE тоже
        'delete_duration': ['p(95)<1000'],  // DELETE быстрый

        // Процент ошибок по операциям
        'get_errors': ['rate<0.05'],        // Меньше 5% ошибок на GET
        'post_errors': ['rate<0.1'],        // Меньше 10% на POST
    },
};

// =============================================
// ОСНОВНОЙ СЦЕНАРИЙ
// =============================================

const BASE_URL = 'https://jsonplaceholder.typicode.com';

export default function() {
    // Выбираем случайный ID для тестов
    const postId = Math.floor(Math.random() * 10) +1;

    // =========================================
    // 1. GET ALL posts (READ - коллекция)
    // =========================================
    let getRes = http.get(`${BASE_URL}/posts`);

    if (getRes.status === 200) {
        getTrend.add(getRes.timings.duration);
        getSuccessCount.add(1);
    } else {
        getErrorRate.add(1);
    }

    check(getRes, {
        'GET /posts status is 200': (r) => r.status === 200,
        'GET /posts has data': (r) => JSON.parse(r.body).length > 0,
    });

    sleep(1);

    // =========================================
    // 2. GET BY ID posts (READ - один элемент)
    // =========================================
    let getByIdRes = http.get(`${BASE_URL}/posts/${postId}`);

    if (getByIdRes.status === 200) {
        getByIdTrend.add(getByIdRes.timtngs.duration);
        getSuccessCount.add(1);
    } else {
        getErrorRate.add(1);
    }

    check(getByIdRes, {
        'GET /posts/1 status is 200': (r) => r.status === 200,
        'GET by ID has correct id': (r) => JSON.parse(r.body).id === postId,
    });

    sleep(1);

    // =========================================
    // 3. CREATE post (CREATE)
    // =========================================

    const newPost = generateRandomPost();

    let createRes = http.post(`${BASE_URL}/posts`, JSON.stringify(newPost), {
        headers: { 'Content-Type': 'application/json' },
    });

    if (createRes.status === 201) {
        postTrend.add(createRes.timings.duration);
        postSuccessCount.add(1);
    } else {
        postErrorRate.add(1);
    }

    check(createRes, {
        'POST /posts status is 201': (r) => r.status === 201,
        'POST returns created post': (r) => JSON.parse(r.body).title === newPost.title,
    });

    sleep(2); // Пользователь думает

    // =========================================
    // 4. UPDATE post (UPDATE)
    // =========================================

    const updatedPost = { 
        ...newPost, 
        title: `Updated: ${newPost.title}`,
        body: `This post was updated at ${new Date().toISOString()}`
    };
    
    let updateRes = http.put(`${BASE_URL}/posts/${newPost.id}`, JSON.stringify(updatedPost), {
        headers: { 'Content-Type': 'application/json' },
    });
    
    if (updateRes.status === 200) {
        putTrend.add(updateRes.timings.duration);
        putSuccessCount.add(1);
    } else {
        putErrorRate.add(1);
    }
    
    check(updateRes, {
        'PUT /posts status is 200': (r) => r.status === 200,
        'PUT updates title': (r) => JSON.parse(r.body).title === updatedPost.title,
    });
    
    sleep(1);

    // =========================================
    // 5. DELETE post (DELETE)
    // =========================================
    let deleteRes = http.del(`${BASE_URL}/posts/${newPost.id}`);
    
    if (deleteRes.status === 200) {
        deleteTrend.add(deleteRes.timings.duration);
        deleteSuccessCount.add(1);
    } else {
        deleteErrorRate.add(1);
    }
    
    check(deleteRes, {
        'DELETE /posts status is 200': (r) => r.status === 200,
    });
    
    // Случайная пауза перед следующей итерацией
    sleep(Math.random() * 2 + 1);

}