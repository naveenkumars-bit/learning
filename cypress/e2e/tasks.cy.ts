describe('Kanban Tasks Board CRUD E2E Tests', () => {
  before(() => {
    cy.request('POST', '/api/tasks/reset');
  });

  beforeEach(() => {
    cy.visit('/');
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.login('admin', 'password123');
    
    // Intercept loading tasks
    cy.intercept('GET', '/api/tasks').as('getTasks');
    cy.get('#tab-tasks').click();
    cy.wait('@getTasks');
  });

  it('should render default sample tasks in columns', () => {
    cy.get('#list-done').should('contain', 'Implement Auth Page');
    cy.get('#list-in-progress').should('contain', 'Build Profile Photo Upload');
    cy.get('#list-todo').should('contain', 'Add API Integration Tests');
    
    cy.get('#count-done').should('contain', '1');
    cy.get('#count-in-progress').should('contain', '1');
    cy.get('#count-todo').should('contain', '1');
  });

  it('should create a new task and add it to the Todo column', () => {
    cy.intercept('POST', '/api/tasks').as('createTask');

    cy.get('#add-task-btn').click();
    cy.get('#task-modal').should('be.visible');

    // Fill form
    cy.get('#task-title-input').type('Write Newman API Tests');
    cy.get('#task-desc-input').type('Verify express endpoints via Postman suite');
    cy.get('#save-task-btn').click();

    // Confirm api response
    cy.wait('@createTask').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      expect(interception.response?.body.task.title).to.eq('Write Newman API Tests');
    });

    // Check modal closed and card is visible
    cy.get('#task-modal').should('not.be.visible');
    cy.get('#list-todo')
      .should('contain', 'Write Newman API Tests')
      .and('contain', 'Verify express endpoints via Postman suite');
    
    // Verify toast
    cy.get('.toast.success')
      .should('be.visible')
      .and('contain', 'Task added successfully!');
  });

  it('should transition a task through Todo -> In Progress -> Done, then delete it', () => {
    const taskTitle = 'Newman CI Integration';
    
    // 1. Create a task
    cy.get('#add-task-btn').click();
    cy.get('#task-title-input').type(taskTitle);
    cy.get('#task-desc-input').type('Integrate reports into pipeline');
    cy.get('#save-task-btn').click();
    
    cy.get('#list-todo').should('contain', taskTitle);

    // 2. Intercept status updates
    cy.intercept('PATCH', /\/api\/tasks\/\d+/).as('updateStatus');

    // Move to In Progress
    cy.get('#list-todo')
      .contains('.task-card', taskTitle)
      .find('.btn-move-progress')
      .click();

    cy.wait('@updateStatus').its('response.statusCode').should('eq', 200);
    cy.get('#list-in-progress').should('contain', taskTitle);
    cy.get('#list-todo').should('not.contain', taskTitle);

    // Move to Done
    cy.get('#list-in-progress')
      .contains('.task-card', taskTitle)
      .find('.btn-move-progress')
      .click();

    cy.wait('@updateStatus').its('response.statusCode').should('eq', 200);
    cy.get('#list-done').should('contain', taskTitle);
    cy.get('#list-in-progress').should('not.contain', taskTitle);

    // Confirm that the "Move" button is removed in Done column
    cy.get('#list-done')
      .contains('.task-card', taskTitle)
      .find('.btn-move-progress')
      .should('not.exist');

    // 3. Delete task
    cy.intercept('DELETE', /\/api\/tasks\/\d+/).as('deleteTask');
    
    cy.get('#list-done')
      .contains('.task-card', taskTitle)
      .find('.btn-delete-task')
      .click();

    cy.wait('@deleteTask').its('response.statusCode').should('eq', 200);
    
    // Verify removed from DOM
    cy.get('.task-card').contains(taskTitle).should('not.exist');
    cy.get('.toast.info')
      .should('be.visible')
      .and('contain', 'Task deleted successfully');
  });
});
