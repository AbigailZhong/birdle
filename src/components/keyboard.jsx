const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export function Keyboard({ onKeyPress, letterStates }) {
  const getKeyClass = (key) => {
    const state = letterStates.get(key);
    
    switch (state) {
      case 'correct':
        return 'green';
      case 'present':
        return 'yellow';
      case 'absent':
        return 'bg-gray-500 text-white border-gray-500';
      default:
        return 'bg-gray-200 text-black border-gray-300 hover:bg-gray-300';
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-lg">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 justify-center">
          {row.map((key) => {
            const isWide = key === 'ENTER' || key === 'BACKSPACE';
            
            return (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className={`
                  ${isWide ? 'px-4 text-xs' : 'w-10'} 
                  h-14 rounded font-bold border-2 transition-colors
                  ${getKeyClass(key)}
                `}
              >
                {key === 'BACKSPACE' ? '←' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
