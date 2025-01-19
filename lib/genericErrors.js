export class BadGatewayError extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
  }
}
