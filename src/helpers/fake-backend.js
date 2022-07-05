export { fakeBackend };

function fakeBackend() {
  let users = [
    {
      id: 1,
      username: "test",
      password: "test",
      firstName: "Test",
      lastName: "User",
    },
  ];
  let realFetch = window.fetch;
  window.fetch = function (url, opts) {
    return new Promise((resolve, reject) => {
      // wrap in timeout to simulate server api call
      setTimeout(handleRoute, 500);

      function handleRoute() {
        switch (true) {
          case url.endsWith("/users/authenticate") && opts.method === "POST":
            return authenticate();
          case url.endsWith("/users/register") && opts.method === "POST":
            return register();
          case url.endsWith("/users") && opts.method === "GET":
            return getUsers();
          default:
            // pass through any requests not handled above
            return realFetch(url, opts)
              .then((response) => resolve(response))
              .catch((error) => reject(error));
        }
      }

      // route functions

      function authenticate() {
        const { username, password } = body();
        const user = users.find(
          (x) => x.username === username && x.password === password
        );

        if (!user) return error("Username or password is incorrect");

        return ok({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          token: "fake-jwt-token",
        });
      }

      function register() {
        const { username, password, firstName, lastName } = body();

        if (!username || !password || !firstName || !lastName)
          return error("Data is not correct!");

        if (users.find((item) => item.username === username))
          return error("This userName already exist!");

        users.push({
          username,
          password,
          firstName,
          lastName,
          id: users.length,
          token: "fake-jwt-token",
        });

        // Return last item in the users that has been created just now
        return ok(users[users.length - 1]);
      }

      function getUsers() {
        if (!isAuthenticated()) return unauthorized();
        return ok(users);
      }

      // helper functions

      function ok(body) {
        resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(body)),
        });
      }

      function unauthorized() {
        resolve({
          status: 401,
          text: () =>
            Promise.resolve(JSON.stringify({ message: "Unauthorized" })),
        });
      }

      function error(message) {
        resolve({
          status: 400,
          text: () => Promise.resolve(JSON.stringify({ message })),
        });
      }

      function isAuthenticated() {
        return opts.headers["Authorization"] === "Bearer fake-jwt-token";
      }

      function body() {
        return opts.body && JSON.parse(opts.body);
      }
    });
  };
}
