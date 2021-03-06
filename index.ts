import Game from "./src/game";

function main() {
  const root = document.getElementById("app");
  const game = new Game();
  root.appendChild(game.app.view);
}
main();
