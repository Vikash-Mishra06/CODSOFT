// Calculator with History (old-school abstract style)
// - Buttons & keyboard support
// - History stored in localStorage
// - Handle basic arithmetic safely using Function() parse with checks

(function(){
  const display = document.getElementById('result');
  const expressionEl = document.getElementById('expression');
  const buttons = Array.from(document.querySelectorAll('.btn'));
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');
  const exportBtn = document.getElementById('export-history');

  let current = '';
  let expression = '';
  let history = JSON.parse(localStorage.getItem('calc_history') || '[]');

  function renderDisplay(){
    display.textContent = current || '0';
    expressionEl.textContent = expression;
  }

  function pushToHistory(expr, result){
    const item = { expr, result, time: new Date().toISOString() };
    history.unshift(item);
    if(history.length > 50) history.pop(); // limit
    localStorage.setItem('calc_history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory(){
    historyList.innerHTML = '';
    if(history.length === 0){
      historyList.innerHTML = '<div style="opacity:0.6;padding:12px">No history yet</div>';
      return;
    }
    history.forEach(h => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.innerHTML = '<div class="history-expression">'+escapeHtml(h.expr)+'</div>' +
                     '<div class="history-result">'+escapeHtml(String(h.result))+'</div>';
      el.addEventListener('click', ()=> {
        current = String(h.result);
        expression = h.expr + ' =';
        renderDisplay();
      });
      historyList.appendChild(el);
    });
  }

  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function safeEval(input){
    // Only allow digits, operators, decimal, parentheses and whitespace
    if(!/^[0-9+\-*/().%\s]+$/.test(input)) throw new Error('Invalid characters');
    // Prevent sequences like '++' (but allow '- -' etc), we'll rely on JS eval semantics for simplicity
    // Evaluate using Function to avoid direct eval
    try {
      // Replace percent operator: 50% -> (50/100)
      const transformed = input.replace(/([0-9.]+)\s*%/g, '($1/100)');
      // Avoid unexpected tokens by running a final check
      if(!/^[0-9+\-*/().\s]+$/.test(transformed.replace(/\(/g,'').replace(/\)/g,''))) {
        throw new Error('Unsafe expression');
      }
      // Use Function to evaluate
      /* eslint-disable no-new-func */
      const fn = new Function('return (' + transformed + ')');
      const result = fn();
      if(typeof result === 'number' && !Number.isFinite(result)) throw new Error('Math error');
      return result;
    } catch(e){
      throw new Error('Calculation error');
    }
  }

  function handleInput(v){
    if(v === '.') {
      // prevent multiple decimals in current number
      const parts = current.split(/[\+\-\*\/]/);
      const last = parts[parts.length - 1];
      if(last && last.includes('.')) return;
    }
    // Append number or operator to current expression
    if(/[0-9.]/.test(v)) {
      current = (current === '0' || expression.endsWith('=') ? v : (current + v));
      if(expression.endsWith('=')) expression = '';
    } else {
      // operator
      if(expression.endsWith('=')){
        // start new expression with previous result
        expression = current + ' ' + v + ' ';
        current = '';
      } else {
        // append operator
        if(current === '' && expression === '') return; // avoid leading operator
        expression = (expression + (current ? current + ' ' : '') + v + ' ');
        current = '';
      }
    }
    renderDisplay();
  }

  function clearAll(){
    current = '';
    expression = '';
    renderDisplay();
  }

  function deleteChar(){
    if(current) {
      current = current.slice(0, -1);
    } else if(expression){
      // remove trailing operator from expression
      expression = expression.replace(/\s+$|[+\-*/]$/,'').trim();
    }
    renderDisplay();
  }

  function calculate(){
    let full = expression;
    if(current) full = expression + current;
    // Trim trailing operators
    full = full.trim();
    if(full === '') return;
    // Remove trailing operator like '2 +'
    full = full.replace(/[\+\-\*\/\s]+$/,'');
    try {
      const res = safeEval(full);
      pushToHistory(full, res);
      expression = full + ' =';
      current = String(res);
      renderDisplay();
    } catch(e) {
      current = 'Error';
      renderDisplay();
      setTimeout(()=> {
        current = '';
        renderDisplay();
      }, 900);
    }
  }

  // Buttons
  buttons.forEach(b => {
    b.addEventListener('click', (ev) => {
      const action = b.dataset.action;
      const value = b.dataset.value;
      if(action === 'clear') { clearAll(); return; }
      if(action === 'del') { deleteChar(); return; }
      if(action === 'equals') { calculate(); return; }
      if(value) {
        handleInput(value);
      }
    });
  });

  // Keyboard support
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    if((key >= '0' && key <= '9') || key === '.') {
      handleInput(key);
      e.preventDefault();
      return;
    }
    if(key === 'Backspace') { deleteChar(); e.preventDefault(); return; }
    if(key === 'Enter' || key === '=') { calculate(); e.preventDefault(); return; }
    if(key === '+' || key === '-' || key === '*' || key === '/') {
      handleInput(key);
      e.preventDefault();
      return;
    }
    if(key === '%') { handleInput('%'); e.preventDefault(); return; }
    if(key.toLowerCase() === 'c') { clearAll(); e.preventDefault(); return; }
  });

  // History controls
  clearHistoryBtn.addEventListener('click', ()=> {
    if(!confirm('Clear calculation history?')) return;
    history = [];
    localStorage.removeItem('calc_history');
    renderHistory();
  });

  exportBtn.addEventListener('click', ()=> {
    if(history.length === 0) { alert('No history to export'); return; }
    let csv = 'Expression,Result,Time\n';
    history.slice().reverse().forEach(h => {
      csv += `"${h.expr.replace(/"/g,'""')}","${String(h.result).replace(/"/g,'""')}","${h.time}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calculator_history.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Initialize
  renderHistory();
  renderDisplay();
})();
