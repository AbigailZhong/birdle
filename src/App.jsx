import "./style/App.css";
import BirdIcon from './assets/bird-icon.svg';

import { useEffect, useState, useCallback } from "react";
import { BirdleGrid } from './components/wordgrid';
import { Keyboard } from './components/keyboard';
import { getRandomWord, isValidWord } from './assets/birdlist';
import { LetterState, GameStatus } from './assets/states';

function App() {

  //answer is initialized once components mount using getRandomWord()
  const [answer, setAnswer] = useState(getRandomWord);
  //keep track of previous guesses
  const [guesses, setGuesses] = useState([]);
  //what the user is typing, but not yet submitted
  const [currentGuess, setCurrentGuess] = useState("");
  //current row the user is on
  const [currentRow, setCurrentRow] = useState(0);
  //game status is either playing, won, or lost
  const [gameStatus, setGameStatus] = useState("playing");
  //2D array for storing color state of each letter in each guess. Ex: [["correct", "absent", "present", "absent", "correct"]]
  const [letterStates, setLetterStates] = useState([]);
  //a map tracking which letters should be colored on the keyboard. Ex: {"H" => "correct", "E" => "present", "X" => "absent"}
  const [keyboardStates, setKeyboardStates] = useState(new Map());
  //boolean that makes letters shake if true (invalid guess).
  const [shake, setShake] = useState(false);
  //text to display in popup message. Ex: "Not enough letters"
  const [message, setMessage] = useState("");

  const maxGuesses = 6;
  const wordLength = answer.length;

  // GAME LOGIC -----------------------------------------------------------------------
  const calculateLetterStates = (guess, answer) => {
    //start with every letter blank
    const states = Array(wordLength).fill("absent");
    //turn answer word into an array of letters
    const answerLetters = answer.split("");
    //turn guess word into an array of letters
    const guessLetters = guess.split("");

    // Mark correct letters green
    // Consume these letters from the Answer array by replacing with empty strs to avoid double counting
    guessLetters.forEach((letter, index, ) => {
      if (letter === answerLetters[index]) {
        states[index] = "correct";
        answerLetters[index] = "";
      }
    });

    // For remaining letters, mark present letters yellow and consume from Answer
    guessLetters.forEach((letter, index) => {
      if (
        states[index] === "absent" &&
        answerLetters.includes(letter)
      ) {
        states[index] = "present";
        answerLetters[answerLetters.indexOf(letter)] = "";
      }
    });

    return states;
  };

  // KEYBOARD LOGIC -------------------------------------------------------------------------------
  const updateKeyboardStates = (newGuess, newStates, ) => {
    //new keyboard states
    const updatedStates = new Map(keyboardStates);

    newGuess.split("").forEach((letter, index) => {
      const currentState = updatedStates.get(letter);
      const newState = newStates[index];

      // if letter has never been guessed, set its state
      // if a letter is correct, update state to correct
      // if a letter is present and not correct, update state to present
      // if a letter is absent, update it to absent if not previously updated
      if (
        !currentState ||
        newState === "correct" ||
        (newState === "present" && currentState !== "correct")
      ) {
        updatedStates.set(letter, newState);
      }
    });

    setKeyboardStates(updatedStates);
  };

  // GUESS SUBMISSION -----------------------------------------------------------------------------
  // Called when the player presses Enter
  // Uses useCallback to avoid recreating the function on every render

  const submitGuess = useCallback(() => {

    //checks if the guess is the correct length
    if (currentGuess.length !== wordLength) {
      showMessage("Not enough letters");
      triggerShake();
      return;
    }

    //checks for non-valid bird name, runs shake animation if not valid
    if (!isValidWord(currentGuess)) {
      showMessage("Not in word list");
      triggerShake();
      return;
    }

    //if valid:

    //calculating the color states for each letter
    const newStates = calculateLetterStates(currentGuess,answer,);
    setLetterStates([...letterStates, newStates]);
    //add current guess to list of previous guesses
    setGuesses([...guesses, currentGuess]);
    //update keyboard colors
    updateKeyboardStates(currentGuess, newStates);

    //if user guesses correctly, change game state to won & show winning message
    if (currentGuess === answer) {
      setGameStatus("won");
      showMessage("Congratulations! 🎉");
    
    //if user used up all guesses, change game state to lost & show answer
    } else if (currentRow + 1 >= maxGuesses) {
      setGameStatus("lost");
      showMessage(`The word was: ${answer}`);
    };
    //reset current input
    setCurrentGuess("");
    //move one row down
    setCurrentRow(currentRow + 1);
  }, [
    currentGuess,
    currentRow,
    guesses,
    letterStates,
    answer,
    keyboardStates,
  ]);

  //ON-SCREEN KEYBOARD LOGIC ------------------------------------------------------------------------------
  // handles clicking the keyboard buttons on-screen
  const handleKeyPress = useCallback(
    (key) => {
      //ignores clicks if game is over
      if (gameStatus !== "playing") return;

      //if user clicks enter, submit the guess
      //if user clicks delete, remove the last letter
      //if user clicks a letter A-Z, and the word isn't full yet, add it to current guess
      if (key === "ENTER") {
        submitGuess();
      } else if (key === "BACKSPACE") {
        setCurrentGuess(currentGuess.slice(0, -1));
      } else if (
        currentGuess.length < wordLength &&
        /^[A-Z]$/.test(key)
      ) {
        setCurrentGuess(currentGuess + key);
      }
    },
    [currentGuess, gameStatus, submitGuess],
  );

  // PHYSICAL KEYBOARD LOGIC --------------------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      //igore keypresses if game is over
      if (gameStatus !== "playing") return;

      //if user clicks enter, submit the guess
      //if user clicks delete, remove the last letter
      //if user clicks a letter A-Z, and the word isn't full yet, convert lowercase letters to uppercase
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress, gameStatus]);

  //shake animation
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  //message popup
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  //resets game by clearing all states to original config & getting a new Answer word
  const resetGame = () => {
    setAnswer(getRandomWord());
    setGuesses([]);
    setCurrentGuess("");
    setCurrentRow(0);
    setGameStatus("playing");
    setLetterStates([]);
    setKeyboardStates(new Map());
    setMessage("");
  };


  return (
    <div className="">
      {/* Header */}
      <div className="">
        <h1 className="" id="game-title">Birdle</h1>
        <p className="text-gray-600">
          Guess the bird in {maxGuesses} tries
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="absolute top-20 bg-gray-800 text-white px-6 py-3 rounded-lg font-bold animate-bounce">
          {message}
        </div>
      )}

      {/* Game Grid */}
      <BirdleGrid
        answer={answer}
        guesses={guesses}
        currentGuess={currentGuess}
        letterStates={letterStates}
        currentRow={currentRow}
        maxGuesses={maxGuesses}
        shake={shake}
      />

      {/* Keyboard */}
      <Keyboard
        onKeyPress={handleKeyPress}
        letterStates={keyboardStates}
      />

      {/* Reset Button */}
      {gameStatus !== "playing" && (
        <button
          onClick={resetGame}
          className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
        >
          Play Again
        </button>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600 max-w-md">
        <div className="flex gap-2 justify-center mb-2">
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-green-600 rounded"></div>
            <span>Correct</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            <span>Wrong spot</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-gray-500 rounded"></div>
            <div className="bird-color">
              <img src={BirdIcon} alt="bird icon" width="60em" height={"60em"}/>
              <img 
                src={BirdIcon} 
                alt="bird icon" 
                width="60" 
                height="60"
                style={{ filter: 'hue-rotate(90deg)' }} // turns it white, for example
              />
            </div>
            
            <span>Not in word</span>
          </div>
        </div>
      </div>
    </div>
  );

};

export default App
