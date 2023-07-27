import Vue from "vue";
import VueRouter from "vue-router";
import SheetEditor from "../views/sheetEditor.vue";

Vue.use(VueRouter);

export function useRouter() {
  return router;
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
    {
      path: "/:service/:fkCol/:fkVal",
      name: "sheetEditor",
      component: () => import("../views/sheetEditor.vue"),
    },
  ],
});

export default router;
