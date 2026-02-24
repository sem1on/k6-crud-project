import http from 'k6/http';
import { check, sleep } from 'k6'

export const options = {
    stages: [
        { duration: '10s', target: 3 },
        { duration: '20s', target: 5 },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01'],
    },

};

export default function () {
    const endpoints = [
        '/posts',
        '/comments',
        '/albums',
        '/photos',
        '/todos'
    ];
    const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(`https://jsonplaceholder.typicode.com${randomEndpoint}`);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time OK': (r) => r.timings.duration < 500,
        'has data' : (r) => JSON.parse(r.body).length > 0,
    });

    sleep(Math.random() * 1.5 + 0.5)
}
