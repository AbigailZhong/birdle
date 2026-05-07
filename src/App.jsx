import "./style/App.css";
import YellowIcon from './assets/feather-yellow.svg';
import GreenIcon from './assets/feather-green.svg';
import GrayIcon from './assets/feather-gray.svg';

import { useEffect, useState, useCallback } from "react";
import { BirdleGrid } from './components/wordgrid';
import { Keyboard } from './components/keyboard';
import { getRandomWord, isValidWord } from './assets/birdlist';

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
  //boolean that toggles dark or light theme
  const [isDarkMode, setIsDarkMode] = useState(false);


  const maxGuesses = 6;
  const wordLength = answer.length;

  document.body.classList.add('peacock-bg');

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
      showMessage("Not in bird list");
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
      showMessage("Im-peck-able guessing!");
    
    //if user used up all guesses, change game state to lost & show answer
    } else if (currentRow + 1 >= maxGuesses) {
      setGameStatus("lost");
      showMessage(`The word was: ${answer}. You wing some, you lose some.`);
    };
    //reset current input
    setCurrentGuess("");
    //move one row down
    setCurrentRow(currentRow + 1);
  }, 
  [
    currentGuess,
    currentRow,
    guesses,
    letterStates,
    answer,
    keyboardStates,
  ]
);

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
    setTimeout(() => setMessage(""), 5000);
  };

  //give hint as next letter
  const handleHint = (e) => {
    if (gameStatus !== "playing") return;
    if (currentGuess.length >= wordLength) {
      showMessage("Complete the word first");
      return;
    }

    // Add the next correct letter
    const nextPosition = currentGuess.length;
    const correctLetter = answer[nextPosition];
    setCurrentGuess(currentGuess + correctLetter);
    showMessage("Hint used!");
    e.currentTarget.blur();
  };

  //resets game by clearing all states to original config & getting a new Answer word
  const resetGame = (e) => {
    setAnswer(getRandomWord());
    setGuesses([]);
    setCurrentGuess("");
    setCurrentRow(0);
    setGameStatus("playing");
    setLetterStates([]);
    setKeyboardStates(new Map());
    setMessage("");
    setShake('false');
    setIsDarkMode(isDarkMode);
    e.currentTarget.blur();
  };


  return (
    <div className={`page ${isDarkMode ? 'navy-page' : 'light-page'}`}>
      {/* Header */}
      <div id="game-header">
        <h1 id="game-title" className={`${isDarkMode ? 'text-antique' : 'text-brown'}`}>Birdle</h1>
        <p className={`${isDarkMode ? 'text-antique' : 'text-brown'}`}>
          Guess the one-word-bird in {maxGuesses} tries!
        </p>
      </div>

      <button
        onClick={(e) => {
          setIsDarkMode(!isDarkMode);
          if (document.body.classList.contains('dark-mode')) {
            // If currently dark, switch to light
            document.body.classList.remove('dark-mode');
            document.body.classList.add('peacock-bg');
          } else {
            // If currently light, switch to dark
            document.body.classList.remove('peacock-bg');
            document.body.classList.add('dark-mode');
          }
          e.currentTarget.blur();
        }}
        id="theme-toggle"
        className={`${isDarkMode ? 'cream-toggle' : 'navy-toggle'}`}
        aria-label="Toggle theme"
      >
        <span>{isDarkMode ? '☀️' : '🌙'}</span>
      </button>

      {/* Message */}
      {message && (
        <div id="message-container" className="float">
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
        isDarkMode={isDarkMode}
      />

      {/* Keyboard */}
      <Keyboard
        onKeyPress={handleKeyPress}
        letterStates={keyboardStates}
        isDarkMode={isDarkMode}
      />

      {/* Instructions */}
      <div id ="instructions-container">

        <div id="color-code-container">
          <div className="color-code">
            <img src={GreenIcon} alt="feather icon" className="feather-icon"/>
            <span className={`${isDarkMode ? 'text-antique' : 'text-brown'}`}>Correct</span>
          </div>
          <div className="color-code">
            <img src={YellowIcon} alt="feather icon" className="feather-icon"/>
            <span className={`${isDarkMode ? 'text-antique' : 'text-brown'}`}>Wrong spot</span>
          </div>
          <div className="color-code">
            <img src={GrayIcon} alt="feather icon" className="feather-icon"/>
            <span className={`${isDarkMode ? 'text-antique' : 'text-brown'}`}>Not in word</span>
          </div>
        </div>
      </div> {/* instructions container */}

      <div id="button-container">
        {/* Hint Button */}
        {gameStatus === "playing" && (
          <button
            onClick={handleHint}
            className={`${isDarkMode ? 'button-antique' : 'button-brown'}`}
            id="hint-button"
          >
            Hint: Next Letter
          </button>
        )}

        {/* Reset Button */}
        {<button
            onClick={resetGame}
            className={`${isDarkMode ? 'button-antique' : 'button-brown'}`}
            id="reset-button"
          >
            New Game
          </button>
        }

        {/* Mobile Submit Guess Button */}
        {<button
          onClick={submitGuess}
          id="mobile-submit-button"
          className={`${isDarkMode ? 'button-antique' : 'button-brown'}`}
          > Submit
          </button>}
      </div>
    </div>
  );

};

export default App
