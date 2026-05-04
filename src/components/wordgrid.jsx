export function BirdleGrid({ answer, guesses, currentGuess, letterStates, currentRow, maxGuesses, shake, isDarkMode }) {
  const getLetterClass = (state) => {
    switch (state) {
      case 'correct':
        return 'green';
      case 'present':
        return 'yellow';
      case 'absent':
        return 'gray';
      default:
        return 'white';
    }
  };

  const renderRow = (rowIndex) => {
    const letters = [];
    
    if (rowIndex < currentRow) {
      // Past guess
      letters.push(...guesses[rowIndex].split(''));
    } else if (rowIndex === currentRow) {
      // Current guess
      letters.push(...currentGuess.split(''));
    }
    
    // Fill remaining cells with empty strings
    while (letters.length < answer.length) {
      letters.push('');
    }

    return (
      <div 
        key={rowIndex} 
        className={`birdle-row ${shake && rowIndex === currentRow ? 'animate-shake' : ''}`}
      >
        {letters.map((letter, colIndex) => {
          const hasLetter = letter !== '';
          const state = rowIndex < currentRow ? letterStates[rowIndex][colIndex] : 'empty';
          const isRevealing = rowIndex === currentRow - 1;
          
          return (
            <div
              key={colIndex}
              className={`
                word-box
                ${isDarkMode ? 'light-word-box' : 'brown-word-box'}
                ${getLetterClass(state)}
                ${hasLetter && state === 'empty' ? 'randomClass' : ''}
                ${isRevealing ? 'animate-flip' : ''}
              `}
              style={{
                animationDelay: isRevealing ? `${colIndex * 100}ms` : '0ms'
              }}
            >
              {letter}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="birdle-grid">
      {Array.from({ length: maxGuesses }, (_, i) => renderRow(i))}
    </div>
  );
};
