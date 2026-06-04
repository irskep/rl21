import Game from "./src/game";

function main() {
  const root = document.getElementById("app");
  if (!root) {
    throw new Error("Missing #app root element");
  }
  const game = new Game();
  root.appendChild(game.app.view);
}
main();
