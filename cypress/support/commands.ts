// Cypress Custom Commands
// You can add custom utility commands for testing here.
// For example, a custom login command:

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to perform user login
       * @example cy.login('admin', 'password123')
       */
      login(username: string, password: string): Chainable<any>;
    }
  }
}

Cypress.Commands.add('login', (username, password) => {
  cy.visit('/');
  cy.get('#username').type(username);
  cy.get('#password').type(password);
  cy.get('#login-btn').click();
});
