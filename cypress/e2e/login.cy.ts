describe('SUT Authentication E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  it('should prevent access to protected tabs before logging in', () => {
    cy.get('#tab-profile').should('not.be.visible');
    cy.get('#tab-tasks').should('not.be.visible');
    cy.get('#header-username').should('contain', 'Not Authenticated');
  });

  it('should display error toast with invalid credentials', () => {
    cy.get('#username').type('wrong_user');
    cy.get('#password').type('wrong_password');
    cy.get('#login-btn').click();

    // Verify error toast triggers
    cy.get('.toast.error')
      .should('be.visible')
      .and('contain', 'Invalid username or password');

    // Make sure we remain on login view
    cy.get('#view-login').should('have.class', 'active');
    cy.get('#tab-profile').should('not.be.visible');
  });

  it('should log in successfully, set session token, and navigate to profile tab', () => {
    cy.intercept('POST', '/api/auth/login').as('loginRequest');

    cy.get('#username').type('admin');
    cy.get('#password').type('password123');
    cy.get('#login-btn').click();

    cy.wait('@loginRequest').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.be.true;
      expect(interception.response?.body.token).to.eq('jwt-mock-token-xyz123');
    });

    // Check header updates
    cy.get('#header-user-status').find('.status-dot').should('have.class', 'online');
    cy.get('#header-username').should('contain', 'Logged in: admin');

    // Confirm navigation occurred
    cy.get('#tab-profile').should('be.visible').and('have.class', 'active');
    cy.get('#view-profile').should('have.class', 'active');

    // Verify Session Storage contains the mock token
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('authToken')).to.eq('jwt-mock-token-xyz123');
      expect(win.sessionStorage.getItem('username')).to.eq('admin');
    });
  });
});
