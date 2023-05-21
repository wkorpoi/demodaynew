const { ObjectId } = require("mongodb");
const accountSid = 'AC8599b0c30c5231841b5abdc16c568373';
const authToken = 'd49f2325220f76f8c549f8042874fa81';
const client = require('twilio')(accountSid, authToken);

module.exports = function (app, passport, db) {
  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get("/", function (req, res) {
    res.render("index.ejs");
  });

  // PROFILE SECTION =========================
  app.get("/booking", isLoggedIn, function (req, res) {
    db.collection("trips").find().toArray((err, trips) => {
      if (err) return console.log(err);
      res.render("booking.ejs", {
        user: req.user,
        trips: trips
      });
    });
  });
  
  app.get("/contacts", isLoggedIn, function (req, res) {
    db.collection("contacts")
      .find({ currentUser: req.user.local.email })
      .toArray((err, contacts) => {
        console.log({ contacts });
        res.render("contacts.ejs", {
          user: req.user,
          contacts,
        });
      });
  });

  app.get("/api/test", function (req, res) {
    client.messages
      .create({
        body:"You have been invited to my trip",
        from: "+18556422716",
        to: "+12157910642",
      })
      .then((message) => {
        console.log("message sent!", message.sid);
      })
      .catch((error) => console.error(error));
  });

  app.get("/profile", isLoggedIn, function (req, res) {
    const pictureApi = [];
    const currentUser = req.user.local.email;
    db.collection("trips")
      .find({ user: currentUser })
      .toArray(async (err, trips) => {
        if (err) return console.log(err);
        for (let i = 0; i < trips.length; i++){
          // let destination = await fetchPic(trips.destination)
          const data = await fetch(`https://api.unsplash.com/search/photos/?page=1&query=${trips[i].destination}.&client_id=5_9_CrMvsD7kOY3XGyIzuylcKWaxUvSfDUf1tC4ldBk`);
          const destination = await data.json()
          pictureApi.push(destination)
        }
        console.log(pictureApi)

        res.render("profile.ejs", {
          user: req.user,
          trips,
          pictureApi,
        });
      });
  });

  app.get("/food/:destination", isLoggedIn, function (req, res) {
    console.log(req.params.destination);
    const destination = req.params.destination;
    res.render("food.ejs", {
      destination: destination,
    });
  });

app.get('/trips/:id', isLoggedIn, function (req, res) {
  const tripId = req.params.id;
  const { ObjectId } = require('mongodb');

  try {
    const objectId = new ObjectId(tripId);

    db.collection('trips').findOne({ _id: objectId }, (err, trip) => {
      if (err) {
        console.log(err);
        return res.status(500).send('An error occurred');
      }

      if (!trip) {
        return res.status(404).send('Trip not found');
      }

      db.collection('contacts').find({ currentUser: req.user.local.email }).toArray((err, contacts) => {
        if (err) {
          console.log(err);
          return res.status(500).send('An error occurred');
        }

        res.render('trip.ejs', {
          user: req.user,
          trip: trip,
          contacts: contacts
        });
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send('Invalid trip ID');
  }
});

  app.post("/invite/:tripId", isLoggedIn, function (req, res) {
    const tripId = req.params.tripId;
    const invitedFriend = req.body.invitedFriend;
    // go to the contacts collection, find the invited friend, go to the trips collection, find the specific trip with the tripId, then send a text to the friend that includes that trip data
    res.redirect("/contacts");
  });

  // LOGOUT ==============================
  app.get("/logout", function (req, res) {
    req.logout(() => {
      console.log("User has logged out!");
    });
    res.redirect("/");
  });

  // message board routes ===============================================================
  app.post("/add", (req, response) => {
    db.collection("trips").insertOne(
      {
        destination: req.body.destination,
        start: req.body.startDate,
        end: req.body.endDate,
        user: req.user.local.email,
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        let destinationId = result.insertedId;
        response.redirect("/trips/" + destinationId);
      }
    );
  });

  app.post("/addFriend", (req, res) => {
    console.log(req.body);
    db.collection("contacts").insertOne(
      {
        friendName: req.body.name,
        phoneNumber: req.body.number,
        currentUser: req.user.local.email,
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/contacts");
      }
    );
  });

  app.delete("/contacts", (req, res) => {
    console.log("working");
    db.collection("contacts").findOneAndDelete(
      { friendName: req.body.name},
      (err, result) => {
        if (err) return res.send(500, err);
        res.send("Friend deleted!");
      }
    );
  });

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get("/login", function (req, res) {
    res.render("signup-register.ejs", { message: req.flash("loginMessage") });
  });

  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function (req, res) {
    res.render("signup-register.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error - HOW DO I MAKE AN ERROR MESSAGE?
      failureFlash: true, // allow flash messages
    })
  );

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get("/unlink/local", isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect("/profile");
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/");
}

async function fetchPic(destination){
  const data = await fetch(`https://api.unsplash.com/search/photos/?page=1&query= ${destination}.&client_id=5_9_CrMvsD7kOY3XGyIzuylcKWaxUvSfDUf1tC4ldBk`);
  return await data.json
}
