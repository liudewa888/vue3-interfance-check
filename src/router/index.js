import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: "/", component: () => import('../view/Home.vue') },
  { path: "/login", component: () => import('../view/login.vue') },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export { router };
