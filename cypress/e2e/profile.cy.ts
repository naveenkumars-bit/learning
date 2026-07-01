describe('Profile Photo Upload and Cropping E2E Tests', () => {
  before(() => {
    cy.request('POST', '/api/tasks/reset');
  });

  beforeEach(() => {
    // Clear storage and log in using the custom command
    cy.visit('/');
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.login('admin', 'password123');
    cy.get('#view-profile').should('have.class', 'active');
  });

  it('should display default profile details initially', () => {
    cy.get('#profile-username-text').should('contain', 'QA_Engineer');
    cy.get('#profile-email-text').should('contain', 'qa@company.com');
    cy.get('#profile-avatar-preview')
      .should('have.attr', 'src')
      .and('include', 'default-avatar.png');
  });

  it('should upload a photo, adjust zoom, drag canvas, and save cropped avatar', () => {
    // Create a dummy image buffer to upload dynamically (1px PNG)
    const dummyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const binary = Cypress.Buffer.from(dummyImage, 'base64');

    // Intercept upload & save endpoints
    cy.intercept('POST', '/api/profile/upload').as('uploadRequest');
    cy.intercept('POST', '/api/profile/save').as('saveRequest');

    // Trigger file selection
    cy.get('#file-upload-input').selectFile({
      contents: binary,
      fileName: 'avatar.png',
      mimeType: 'image/png'
    });

    // Wait for upload response
    cy.wait('@uploadRequest').its('response.statusCode').should('eq', 200);

    // Verify canvas container is visible and dropzone is hidden
    cy.get('#canvas-wrapper').should('be.visible');
    cy.get('#upload-dropzone').should('not.be.visible');
    cy.get('#crop-canvas').should('be.visible');

    // Adjust zoom slider
    cy.get('#zoom-slider')
      .invoke('val', 1.8)
      .trigger('input');
    cy.get('#zoom-value').should('contain', '1.8x');

    // Drag the canvas viewport image to pan
    cy.get('#crop-canvas')
      .trigger('mousedown', { clientX: 200, clientY: 150 })
      .trigger('mousemove', { clientX: 250, clientY: 185 })
      .trigger('mouseup');

    // Save profile cropping configs
    cy.get('#save-profile-btn').click();

    // Verify saving response
    cy.wait('@saveRequest').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      const profile = interception.response?.body.profile;
      expect(profile.photoUrl).to.include('profile-');
      expect(profile.cropConfig.zoom).to.eq(1.8);
      // Verify crop boundary offsets (clamped or relative calculations)
      expect(profile.cropConfig.x).to.be.a('number');
      expect(profile.cropConfig.y).to.be.a('number');
    });

    // Check that toast alert confirms success
    cy.get('.toast.success')
      .should('be.visible')
      .and('contain', 'Profile photo saved and cropped successfully');

    // Confirm preview avatar image src is updated
    cy.get('#profile-avatar-preview')
      .should('have.attr', 'src')
      .and('include', '/uploads/profile-');

    // Confirm canvas editor hides, dropzone restores
    cy.get('#canvas-wrapper').should('not.be.visible');
    cy.get('#upload-dropzone').should('be.visible');
  });

  it('should reset canvas cropper layout on click reset', () => {
    // Create a dummy image buffer to upload dynamically (1px PNG)
    const dummyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const binary = Cypress.Buffer.from(dummyImage, 'base64');

    // Select image
    cy.get('#file-upload-input').selectFile({
      contents: binary,
      fileName: 'test.png',
      mimeType: 'image/png'
    });

    cy.get('#canvas-wrapper').should('be.visible');

    // Change zoom
    cy.get('#zoom-slider').invoke('val', 2.5).trigger('input');
    cy.get('#zoom-value').should('contain', '2.5x');

    // Click reset layout
    cy.get('#btn-crop-reset').click();

    // Confirm reset triggers original zoom level
    cy.get('#zoom-slider').should('have.value', '1');
    cy.get('#zoom-value').should('contain', '1.0x');
  });
});
