import Vue from "vue";
import VueRouter from "vue-router";
import SheetEditor from "../views/sheetEditor.vue";

Vue.use(VueRouter);

export function useRouter() {
  return  router;
}
 
export function useRoute() {
  return router.currentRoute;
}


const router = new VueRouter({
  mode: "hash",
  base: import.meta.env.BASE_URL,
  routes: [
    {
      path: "/:service",
      name: "sheetEditor",
      component: SheetEditor,
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ],
});

export default router;
