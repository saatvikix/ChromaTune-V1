const sideNavigators = document.querySelectorAll(".sidebarNavigators"); 

const navigatorRoutes = {
   tuner: "../tuner/tuner.html",
   library: "../library/library.html",
   metronome: "../metronome/metronome.html"
};

const currentPage = window.location.pathname.split("/").pop();
const activeNavigator = Object.keys(navigatorRoutes).find((navigatorId) =>
  navigatorRoutes[navigatorId].endsWith(currentPage)
);

if (activeNavigator) {
  document.getElementById(activeNavigator)?.classList.add("active");
}

sideNavigators.forEach((navigator) => {
  navigator.addEventListener("click", () => {
    const route = navigatorRoutes[navigator.id];

    if (route) {
      window.location.href = route;
    }
  });
});