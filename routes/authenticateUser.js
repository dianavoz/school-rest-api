 'use strict';

const User = require("../models").User;
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");

// authenticate user
const authenticateUser = async (req, res, next) => {
  let message = null;

	// Parse the user's credentials from the Authorization header.
	// credentials can then be accessed as...
	// credentials.name for the username
	// credentials.pass for the password
  const credentials = auth(req);

  // If the user's credentials are available...
  // Attempt to retrieve the user from the data store
  // by their username (i.e. the user's "key"
  // from the Authorization header).
  if (credentials) {
    const user = await User.findOne({
      where: {
        emailAddress: credentials.name
      }
    });

    // If a user was successfully retrieved from the data store...
    // Use the bcryptjs npm package to compare the user's password
    // (from the Authorization header) to the user's password
    // that was retrieved from the data store.
    if (user) {
      const authenticated = bcryptjs.compareSync(
        credentials.pass,
        user.password
      );

      // If the passwords match...
      // Then store the retrieved user object on the request object
      // so any middleware functions that follow this middleware function
      // will have access to the user's information.
      if (authenticated) {
        console.log(`Authentication successful for username: ${user.username}`);
        // Set found user data to variable to be used later in routes
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.username}`;
      }
    } else {
      message = `User not found for username: ${credentials.emailAddress}`;
    }
  } else {
    message = "Auth header not found";
  }

  // If user authentication failed...
  if (message) {
    console.log(message);
    // Return a response with a 401 Unauthorized HTTP status code.
    res.status(401).json({ message: "Access Denied" });
  } else {
    // Or if user authentication succeeded...
    // Call the next() method.
    next();
  }
};

module.exports = authenticateUser;