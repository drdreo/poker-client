describe("The Home Page", () => {

    beforeEach(() => {
        cy.intercept("GET", "/api/poker/home", {fixture: "home-info"}).as("getHomeInfo");
        cy.intercept("GET", "/api/poker/table", {fixture: "table"}).as("getTable");
        cy.visit("/", {});
    });

    it("should fetch home info", function () {
        cy.wait(["@getHomeInfo"]);
        cy.get("[data-cy=overview_rooms]").children().should("have.length", 2);
    });

    it("should show players online", function () {
        cy.get("[data-cy=overview_online]").should("contain", "Online: 3");
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

        cy.wait(["@getTable"]);

        cy.location("pathname").should("include", "table/" + room.toLowerCase());
    });
});
