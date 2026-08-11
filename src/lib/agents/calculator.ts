/**
 * Deterministic expression evaluator so the calculator tool never touches
 * eval(). Supports + - * / % ^ , unary minus, and parentheses. LLM-supplied
 * strings are untrusted input; this is a hand-written recursive-descent parser.
 */
export function evaluateExpression(expression: string): number {
  const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/%^()]/g);
  if (!tokens || tokens.join("") !== expression.replace(/\s+/g, "")) {
    throw new Error("Expression may only contain numbers, + - * / % ^ and parentheses.");
  }

  let position = 0;
  const peek = () => tokens[position];
  const consume = () => tokens[position++];

  function parsePrimary(): number {
    const token = consume();
    if (token === "(") {
      const value = parseAdditive();
      if (consume() !== ")") throw new Error("Unbalanced parentheses.");
      return value;
    }
    if (token === "-") return -parsePrimary();
    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error(`Unexpected token: ${token}`);
    return value;
  }

  function parsePower(): number {
    const base = parsePrimary();
    if (peek() === "^") {
      consume();
      return base ** parsePower();
    }
    return base;
  }

  function parseMultiplicative(): number {
    let value = parsePower();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const operator = consume();
      const right = parsePower();
      if (operator === "*") value *= right;
      else if (operator === "/") value /= right;
      else value %= right;
    }
    return value;
  }

  function parseAdditive(): number {
    let value = parseMultiplicative();
    while (peek() === "+" || peek() === "-") {
      const operator = consume();
      const right = parseMultiplicative();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  const result = parseAdditive();
  if (position !== tokens.length) throw new Error("Could not parse the full expression.");
  return result;
}
