import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/Layout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'adoption',
        name: 'Adoption',
        component: () => import('@/views/Adoption.vue'),
        meta: { title: '领养大厅' }
      },
      {
        path: 'pet/:id',
        name: 'PetDetail',
        component: () => import('@/views/PetDetail.vue'),
        meta: { title: '宠物详情' }
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/Services.vue'),
        meta: { title: '宠物服务' }
      },
      {
        path: 'community',
        name: 'Community',
        component: () => import('@/views/Community.vue'),
        meta: { title: '社区' }
      },
      {
        path: 'post/:id',
        name: 'PostDetail',
        component: () => import('@/views/PostDetail.vue'),
        meta: { title: '帖子详情' }
      },
      // 需登录的页面
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', requiresAuth: true }
      },
      {
        path: 'my-pets',
        name: 'MyPets',
        component: () => import('@/views/MyPets.vue'),
        meta: { title: '我的宠物', requiresAuth: true }
      },
      {
        path: 'my-appointments',
        name: 'MyAppointments',
        component: () => import('@/views/MyAppointments.vue'),
        meta: { title: '我的预约', requiresAuth: true }
      },
      {
        path: 'my-orders',
        name: 'MyOrders',
        component: () => import('@/views/MyOrders.vue'),
        meta: { title: '我的订单', requiresAuth: true }
      },
      {
        path: 'my-adoptions',
        name: 'MyAdoptions',
        component: () => import('@/views/MyAdoptions.vue'),
        meta: { title: '我的领养', requiresAuth: true }
      },
      {
        path: 'my-posts',
        name: 'MyPosts',
        component: () => import('@/views/MyPosts.vue'),
        meta: { title: '我的帖子', requiresAuth: true }
      },
      {
        path: 'checkout',
        name: 'Checkout',
        component: () => import('@/views/Checkout.vue'),
        meta: { title: '收银台', requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    // 需要登录但未登录 → 跳到登录页
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    // 已登录还访问登录/注册页 → 跳到首页
    next('/home')
  } else {
    next()
  }
})

export default router
