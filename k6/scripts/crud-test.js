import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Кастомные метрики
const getTrend = new Trend('get_duration');
const postTrend = new Trend('post_duration');
const putTrend = new Trend('put_duration');
const deleteTrend = new Trend('delete_duration');
const errorRate  = new Rate('crud_errors');

export const options = {
    stages: [
        { duration: '10s', target: 2 },
        { duration: '20s', target: 5 },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.05'],
        get_duration: ['p(95)<300'],
        post_duration: ['p(95)<400'],
        put_duration: ['p(95)<400'],
        delete_duration: ['p(95)<300'],
    },
};

export default function () {
    const BASE_URL = 'http://localhost:3333/api';

    // 1. CREATE (POST)
    const newItem = {
        name: `Item ${Math.floor(Math.random() * 1000)}`
    };

    let postRes = http.post(`${BASE_URL}/items`, JSON.stringify(newItem), {
        headers: { 'Content-Type': 'application/json' },
    });

    if (postRes.status === 201) {
        postTrend.add(postRes.timings.duration);
    } else {
        errorRate.add(1);
    }

    check(postRes, {
        'create status is 201': (r) => r.status === 201,
        'created item has id': (r) => r.json('id') !== undefined,
    });

    sleep(1);

    // 2. READ (GET)
    let getRes = http.get(`${BASE_URL}/items`);
    
    if (getRes.status === 200) {
        getTrend.add(getRes.timings.duration);
    } else {
        errorRate.add(1);
    }
    
    check(getRes, {
        'get status is 200': (r) => r.status === 200,
        'returns array': (r) => Array.isArray(r.json()),
    });
    
    sleep(1);

    // Извлекаем ID созданного элемента для следующих операций
    let items = postRes.json();
    let itemId = items && items.id ? items.id : 1;

    // 3. UPDATE (PUT)
    const updatedItem = {
        name: `Updated Item ${Math.floor(Math.random() * 1000)}`
    };
    
    let putRes = http.put(`${BASE_URL}/items/${itemId}`, JSON.stringify(updatedItem), {
        headers: { 'Content-Type': 'application/json' },
    });
    
    if (putRes.status === 200) {
        putTrend.add(putRes.timings.duration);
    } else {
        errorRate.add(1);
    }
    
    check(putRes, {
        'update status is 200': (r) => r.status === 200,
        'name updated': (r) => r.json('name') === updatedItem.name,
    });
    
    sleep(1);

     // 4. DELETE
    let delRes = http.del(`${BASE_URL}/items/${itemId}`);
    
    if (delRes.status === 204) {
        deleteTrend.add(delRes.timings.duration);
    } else {
        errorRate.add(1);
    }
    
    check(delRes, {
        'delete status is 204': (r) => r.status === 204,
    });
    
    sleep(1);
}