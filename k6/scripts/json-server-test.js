import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const getTrend = new Trend('get_duration');
const postTrend = new Trend('post_duration');
const putTrend = new Trend('put_duration');
const deleteTrend = new Trend('delete_duration');
const errorRate = new Rate('crud_errors');

export const options = {
    stages: [
        { duration: '5s', target: 2 },
        { duration: '10s', target: 3 },
        { duration: '5s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.05'],
        get_duration: ['p(95)<300'],
        post_duration: ['p(95)<400'],
    },
};

const BASE_URL = 'http://localhost:3333';

export default function () {
    // 1. READ - получить все items
    let getRes = http.get(`${BASE_URL}/items`);
    if (getRes.status === 200) {
        getTrend.add(getRes.timings.duration);
    } else {
        errorRate.add(1);
    }
    
    check(getRes, {
        'GET status is 200': (r) => r.status === 200,
        'GET returns array': (r) => Array.isArray(JSON.parse(r.body)),
    });
    
    sleep(1);
    
    // 2. CREATE - создать новый item
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
        'POST status is 201': (r) => r.status === 201,
        'POST returns item with id': (r) => JSON.parse(r.body).id !== undefined,
    });
    
    sleep(1);
}