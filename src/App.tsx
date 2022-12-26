import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import moveSoundEffect from "./assets/move.wav";
import pointSoundEffect from "./assets/point.wav";
import dieSoundEffect from "./assets/die.wav";
import arrowDownIcon from "./assets/arrow-down.svg";
import arrowRightIcon from "./assets/arrow-right.svg";

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CONTAINER_WIDTH = 48;
const CONTAINER_HEIGHT = 48;

const INITIAL_POSITION = {
  x: CONTAINER_WIDTH / 2,
  y: CONTAINER_HEIGHT / 2,
};

function App() {
  const [playState, setPlayState] = useState<"init" | "playing" | "gameover">(
    "init"
  );
  const [snakeHeadPos, setSnakeHeadPos] = useState(INITIAL_POSITION);
  const [applePos, setApplePos] = useState({
    x: getRandomInt(1, CONTAINER_WIDTH),
    y: getRandomInt(1, CONTAINER_HEIGHT),
  });
  const [snakeBodies, setSnakeBodies] = useState<typeof snakeHeadPos[]>([]);
  const [direction, setDirection] = useState<"right" | "left" | "down" | "up">(
    "right"
  );

  const updatePosition = useCallback(() => {
    setSnakeHeadPos((prev) => {
      const nextState = { ...prev };

      switch (direction) {
        case "right":
          nextState.x += 1;
          break;
        case "left":
          nextState.x -= 1;
          break;
        case "up":
          nextState.y -= 1;
          break;
        case "down":
          nextState.y += 1;
          break;
      }

      if (
        nextState.x > CONTAINER_WIDTH ||
        nextState.x < 1 ||
        nextState.y > CONTAINER_HEIGHT ||
        nextState.y < 1 ||
        !!snakeBodies.find(
          (pos) => pos.x === nextState.x && pos.y === nextState.y
        )
      ) {
        setPlayState("gameover");
        const audio = document.getElementById("die-sound") as HTMLAudioElement;
        audio.play();
        return prev;
      }

      return nextState;
    });

    setSnakeBodies((prev) => {
      const bodies = [snakeHeadPos, ...prev];
      bodies.pop();
      return bodies;
    });
  }, [direction, snakeHeadPos, snakeBodies]);

  const controller = useCallback(
    (event: KeyboardEvent) => {
      if (!event.key.includes("Arrow")) return;
      if (playState === "gameover") {
        setSnakeHeadPos(INITIAL_POSITION);
        setSnakeBodies([]);
      }
      setPlayState("playing");

      const audio = document.getElementById("move-sound") as HTMLAudioElement;
      audio.play();

      switch (event.key) {
        case "ArrowDown":
          if (snakeBodies.length > 0 && direction === "up") return;
          setDirection("down");
          break;
        case "ArrowUp":
          if (snakeBodies.length > 0 && direction === "down") return;
          setDirection("up");
          break;
        case "ArrowLeft":
          if (snakeBodies.length > 0 && direction === "right") return;
          setDirection("left");
          break;
        case "ArrowRight":
          if (snakeBodies.length > 0 && direction === "left") return;
          setDirection("right");
          break;
      }
    },
    [snakeBodies.length, direction, playState]
  );

  const mobileController = useCallback(
    (direct: typeof direction) => () => {
      if (playState === "gameover") {
        setSnakeHeadPos(INITIAL_POSITION);
        setSnakeBodies([]);
      }
      setPlayState("playing");

      const audio = document.getElementById("move-sound") as HTMLAudioElement;
      audio.play();

      switch (direct) {
        case "down":
          if (snakeBodies.length > 0 && direction === "up") return;
          setDirection("down");
          break;
        case "up":
          if (snakeBodies.length > 0 && direction === "down") return;
          setDirection("up");
          break;
        case "left":
          if (snakeBodies.length > 0 && direction === "right") return;
          setDirection("left");
          break;
        case "right":
          if (snakeBodies.length > 0 && direction === "left") return;
          setDirection("right");
          break;
      }
    },
    [snakeBodies.length, direction, playState]
  );

  useEffect(() => {
    if (playState !== "playing") return;
    const interval = setInterval(updatePosition, 1000 / 15);
    return () => {
      clearInterval(interval);
    };
  }, [updatePosition, playState]);

  useEffect(() => {
    window.addEventListener("keyup", controller);
    return () => {
      window.removeEventListener("keyup", controller);
    };
  }, [controller]);

  useEffect(() => {
    if (snakeHeadPos.x === applePos.x && snakeHeadPos.y === applePos.y) {
      setApplePos({
        x: getRandomInt(1, CONTAINER_WIDTH),
        y: getRandomInt(1, CONTAINER_HEIGHT),
      });
      setSnakeBodies((prev) => [snakeHeadPos, ...prev]);
      const audio = document.getElementById("point-sound") as HTMLAudioElement;
      audio.play();
    }
  }, [snakeHeadPos, applePos]);

  const footerText = useMemo(() => {
    switch (playState) {
      case "init":
        return "Click arrow keys to start playing";
      case "playing":
        return `Score: ${snakeBodies.length}`;
      default:
        return "Game over. Click arrow keys to play again";
    }
  }, [playState, snakeBodies.length]);

  return (
    <main className="app">
      <audio id="move-sound" src={moveSoundEffect}></audio>
      <audio id="point-sound" src={pointSoundEffect}></audio>
      <audio id="die-sound" src={dieSoundEffect}></audio>
      <div id="container" data-footer-text={footerText}>
        <div
          className="apple"
          style={{
            gridColumnStart: applePos.x,
            gridRowStart: applePos.y,
          }}
        ></div>
        <div
          className="head"
          style={{
            gridColumnStart: snakeHeadPos.x,
            gridRowStart: snakeHeadPos.y,
          }}
        ></div>
        {snakeBodies.map((body, index) => (
          <div
            key={index}
            className="body"
            style={{
              gridColumnStart: body.x,
              gridRowStart: body.y,
            }}
          ></div>
        ))}
      </div>
      <div className="mobile-control">
        <button
          className="mobile-control__left"
          onClick={mobileController("left")}
        >
          <img src={arrowRightIcon} alt="arrow left" />
        </button>
        <button
          className="mobile-control__right"
          onClick={mobileController("right")}
        >
          <img src={arrowRightIcon} alt="arrow right" />
        </button>
        <button className="mobile-control__up" onClick={mobileController("up")}>
          <img src={arrowDownIcon} alt="arrow up" />
        </button>
        <button
          className="mobile-control__down"
          onClick={mobileController("down")}
        >
          <img src={arrowDownIcon} alt="arrow down" />
        </button>
      </div>
    </main>
  );
}

export default App;
