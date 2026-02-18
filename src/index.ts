import { type PrometheusMetricsData, prometheusMetrics } from './api/index.js';


let param: PrometheusMetricsData = {
    url: '/metrics',
};

prometheusMetrics().then(metrics => {
    console.log(metrics);
}).catch(error => {
    console.error('Error fetching metrics:', error);
});
// src/index.ts
const greeting: string = "Hello, TypeScript!";
console.log(greeting);