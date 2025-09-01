export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InsufficientStockError extends DomainError {
  constructor(message = 'Can\'t sell more stocks than you have') {
    super(message);
  }
}
