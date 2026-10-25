class Calculator {
  constructor(previousOperandTextElement, currentOperandTextElement, historyListElement) {
    this.previousOperandTextElement = previousOperandTextElement;
    this.currentOperandTextElement = currentOperandTextElement;
    this.historyListElement = historyListElement;
    this.history = [];
    this.clear();
  }

  clear() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = false;
  }

  delete() {
    if (this.currentOperand === 'Error') {
      this.clear();
      return;
    }
    if (this.currentOperand.length === 1 || this.currentOperand === '0') {
      this.currentOperand = '0';
    } else {
      this.currentOperand = this.currentOperand.toString().slice(0, -1);
    }
  }

  appendNumber(number) {
    if (this.currentOperand === 'Error' || this.shouldResetScreen) {
      this.currentOperand = '';
      this.shouldResetScreen = false;
    }
    if (number === '.' && this.currentOperand.includes('.')) return;
    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number.toString();
    } else {
      this.currentOperand = this.currentOperand.toString() + number.toString();
    }
  }

  chooseOperation(operation) {
    if (this.currentOperand === 'Error') return;

    if (operation === '±') {
      if (this.currentOperand === '0') return;
      this.currentOperand = (parseFloat(this.currentOperand) * -1).toString();
      return;
    }

    if (this.currentOperand === '' && this.previousOperand !== '') {
      this.operation = operation;
      return;
    }
    if (this.previousOperand !== '') {
      this.compute();
    }
    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.currentOperand = '';
  }

  compute() {
    let computation;
    const prev = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);

    if (isNaN(prev) || isNaN(current)) return;

    const opSymbol = this.operation;
    switch (this.operation) {
      case '+': computation = prev + current; break;
      case '-': computation = prev - current; break;
      case '×': computation = prev * current; break;
      case '÷': 
        if (current === 0) {
          this.currentOperand = 'Error';
          this.previousOperand = '';
          this.operation = undefined;
          return;
        }
        computation = prev / current; 
        break;
      case '%': computation = prev % current; break;
      default: return;
    }

    const result = Math.round(computation * 10000000) / 10000000;

    // Record to history array
    const entry = `${prev} ${opSymbol} ${current} = ${result}`;
    this.history.unshift(entry);
    if (this.history.length > 10) this.history.pop();
    this.updateHistoryUI();

    this.currentOperand = result;
    this.operation = undefined;
    this.previousOperand = '';
    this.shouldResetScreen = true;
  }

  updateHistoryUI() {
    if (!this.historyListElement) return;
    this.historyListElement.innerHTML = '';
    if (this.history.length === 0) {
      this.historyListElement.innerHTML = '<li class="empty-history">No history yet</li>';
      return;
    }
    this.history.forEach(item => {
      const li = document.createElement('li');
      li.innerText = item;
      this.historyListElement.appendChild(li);
    });
  }

  updateDisplay() {
    this.currentOperandTextElement.innerText = this.currentOperand;
    if (this.operation != null) {
      this.previousOperandTextElement.innerText = `${this.previousOperand} ${this.operation}`;
    } else {
      this.previousOperandTextElement.innerText = this.previousOperand;
    }
  }
}

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  const previousOperandTextElement = document.getElementById('previous-operand');
  const currentOperandTextElement = document.getElementById('current-operand');
  const historyListElement = document.getElementById('history-list');
  const historyPanel = document.getElementById('history-panel');

  const calculator = new Calculator(
    previousOperandTextElement,
    currentOperandTextElement,
    historyListElement
  );

  const grid = document.querySelector('.calculator-grid');
  const actionBar = document.querySelector('.action-bar');
  const historyBtn = document.getElementById('history-btn');
  const closeHistoryBtn = document.getElementById('close-history');

  // Keypad Clicks
  grid.addEventListener('click', (event) => {
    const target = event.target;
    if (!target.matches('button')) return;

    if (target.hasAttribute('data-number')) {
      calculator.appendNumber(target.innerText);
    } else if (target.getAttribute('data-action') === 'operator') {
      calculator.chooseOperation(target.innerText);
    } else if (target.getAttribute('data-action') === 'calculate') {
      calculator.compute();
    } else if (target.getAttribute('data-action') === 'clear') {
      calculator.clear();
    } else if (target.getAttribute('data-action') === 'delete') {
      calculator.delete();
    }

    calculator.updateDisplay();
  });

  // Action Bar (Backspace)
  if (actionBar) {
    actionBar.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;

      if (target.getAttribute('data-action') === 'delete') {
        calculator.delete();
        calculator.updateDisplay();
      }
    });
  }

  // History Panel Toggle
  if (historyBtn && historyPanel) {
    historyBtn.addEventListener('click', () => {
      historyPanel.classList.toggle('hidden');
    });
  }

  if (closeHistoryBtn && historyPanel) {
    closeHistoryBtn.addEventListener('click', () => {
      historyPanel.classList.add('hidden');
    });
  }
});