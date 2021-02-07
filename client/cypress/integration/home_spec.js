describe("The Home Page", () => {

    beforeEach(() => {
        cy.visit("/");
    });

    it("should show players online", function () {
        cy.get("[data-cy=overview_online]").should("contain", "Online: 0");
    });

    it("should show have join button disabled", function () {
        cy.get("[data-cy=join_button]").should("be.disabled");
    });

    it("joins a room successfully", function () {
        const room = "CypRess_RoOm";
        const username = "cypress_user";

        cy.get("[data-cy=username]")
          .type(username);

        cy.get("[data-cy=room]")
          .type(room);

        cy.get("[data-cy=join_button]")
          .should("be.enabled")
          .click();

        cy.location("pathname").should("include", "table/" + room.toLowerCase());
    });
});
