let express = require('express'); 
let app = express();
let path = require('path'); 

app.use(express.urlencoded( {extended: true} ));

// -----> Connect Database here
const knex = require("knex") ({
    client : "pg",
    connection : {
        host : "localhost",
        user : "postgres",
        password : "DallensPostMalazan21",
        database : "TurtleShelter",
        port : 5432
    }
});

// -----> Set Views (for HTML files) and Public (for CSS/pics)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
// -----> put all routes below

// Main Page
app.get("/", (req,res) => res.render("index")) 

// Login Page (GET request)
app.get('/login', (req, res) => {
  // Render the login page with the error (if any)
  res.render('login', { error: null });
});

// Login Form Submission (POST request)
app.post('/login', async (req, res) => {
  const { username, password } = req.body; // Get username and password from form submission

  try {
    // Query the Admin table to check if the credentials match
    const user = await knex('Admin') // Replace with your table name
      .where({ Username: username, Password: password }) // Check both username and password
      .first(); // Get the first matching record

    if (user) {
      // If the user is found, redirect to /internal
      res.redirect('/internal');
    } else {
      // If the credentials don't match, redirect back to the login page
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).send('Internal Server Error');
  }
});


// making the internal webpage, need tables to display info?
app.get('/internal', async (req, res) => {
  try {
      const today = new Date();

      const [volunteers, events] = await Promise.all([
          knex('Volunteer').select('VolunteerID'),
          knex('Event').select('FirstChoiceDate', 'FullyCompletedProducts')
      ]);

      // Perform counts and sums
      const volunteerCount = volunteers.length;
      const futureEventCount = events.filter(event => new Date(event.FirstChoiceDate) > today).length;
      const vestCount = events.reduce((sum, event) => sum + (event.FullyCompletedProducts || 0), 0);

      // Pass calculated values to the template
      res.render('internal', { volunteerCount, futureEventCount, vestCount });
  } catch (error) {
      console.error('Error querying database:', error);
      res.status(500).send('Internal Server Error');
  }
});


// Add Volunteer Loading and Posting
  app.get('/addVolunteer', (req, res) => {
    knex('Referral')
        .select('ReferralID', 'ReferralName')
        .then(Referral => {
            // Render the add form with the Referral Data
            res.render('addVolunteer', { Referral });
        })
        .catch(error => {
            console.error('Error fetching Referral:', error);
            res.status(500).send('Internal Server Error');
        });
});

// loading the info into the volunteer database
app.post('/addVolunteer', (req, res) => {
    const VolunteerID = req.params.VolunteerID;
    const VolFirstName = req.body.VolFirstName.toUpperCase() || '';
    const VolLastName = req.body.VolLastName.toUpperCase() || '';
    const Phone = req.body.Phone || '';
    const Email = req.body.Email || '';
    const VolCity = req.body.VolCity.toUpperCase() || '';
    const VolCounty = req.body.VolCounty.toUpperCase() || '';
    const VolState = req.body.VolState.toUpperCase() || '';
    const ReferralID = parseInt(req.body.ReferralID);
    const SewingLevel = req.body.SewingLevel || 'B';
    const HoursPerMonth = parseInt(req.body.HoursPerMonth) || null;
    knex('Volunteer')
      .insert({
        VolFirstName: VolFirstName,
        VolLastName: VolLastName,
        Phone: Phone,
        Email: Email,
        VolCity: VolCity,
        VolCounty: VolCounty,
        VolState: VolState,
        ReferralID: ReferralID,
        SewingLevel: SewingLevel,
        HoursPerMonth: HoursPerMonth,
      })
      .then(() => {   
        res.redirect('/');
      })
      .catch(error => {
        console.error('Error Adding Volunteer:', error);
        res.status(500).send('Internal Server Error');
      });
  });



// render Event Page
app.get("/addEvent", (req,res) => res.render("addEvent", {data: "Event"})) 

// loading the info into the database
app.post('/addEvent', (req, res) => {
    const EventID = req.params.id;
    // Access each value directly from req.body
    const EstimatedAttendance = parseInt(req.body.EstimatedAttendance) || '';
    const EventType = req.body.EventType || 'N';
    const EventStreetAddress = req.body.EventStreetAddress.toUpperCase() || '';
    const EventCity = req.body.EventCity.toUpperCase() || '';
    const EventState = req.body.EventState.toUpperCase() || '';
    const StartTime = req.body.StartTime.toUpperCase() || '';
    const FirstChoiceDate = req.body.FirstChoiceDate || '';
    const SecondChoiceDate = req.body.SecondChoiceDate || '';
    const ThirdChoiceDate = req.body.ThirdChoiceDate || '';
    const Duration = parseFloat(req.body.Duration) || '';
    const Status = req.body.Status || 'P';
    const JenStoryShare = req.body.JenStoryShare === 'true';
    const ContactFirstName = req.body.ContactFirstName.toUpperCase() || '';
    const ContactLastName = req.body.ContactLastName.toUpperCase() || '';
    const ContactPhone = req.body.ContactPhone || '';
    const ContactEmail = req.body.ContactEmail || '';
    knex('Event')
      .insert({
        EstimatedAttendance: EstimatedAttendance,
        EventType: EventType,
        EventStreetAddress: EventStreetAddress,
        EventCity: EventCity,
        EventState: EventState,
        StartTime: StartTime,
        FirstChoiceDate: FirstChoiceDate,
        SecondChoiceDate: SecondChoiceDate,
        ThirdChoiceDate: ThirdChoiceDate,
        Duration: Duration,
        Status: Status,
        JenStoryShare: JenStoryShare,
        ContactFirstName: ContactFirstName,
        ContactLastName: ContactLastName,
        ContactPhone: ContactPhone,
        ContactEmail: ContactEmail,
      })
      .then(() => {
        res.redirect('/');
      })
      .catch(error => {
        console.error('Error Adding Event:', error);
        res.status(500).send('Internal Server Error');
      });
  });

  app.get('/viewUser', (req, res) => {
    knex('Admin')
      .select(
        'UserID',
        'Username',
        'Password',
        'AdminFirstName',
        'AdminLastName',
      )
      .then(Admin => {
        // Render the index.ejs template and pass the data
        res.render('viewUser', { Admin });
      })
      .catch(error => {
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
      });
  });

app.get("/addUser", (req,res) => res.render("addUser", {data: "Admin"})) 

// loading the info into the database
app.post('/addUser', (req, res) => {
    // Access each value directly from req.body
    const UserID = req.params.UserID;
    const Username = req.body.Username || '';
    const Password = req.body.Password || '';
    const AdminFirstName = req.body.AdminFirstName.toUpperCase() || '';
    const AdminLastName = req.body.AdminLastName.toUpperCase() || '';
    knex('Admin')
      .insert({
        Username: Username,
        Password: Password,
        AdminFirstName: AdminFirstName,
        AdminLastName: AdminLastName,
      })
      .then(() => {
        res.redirect('/viewUser');
      })
      .catch(error => {
        console.error('Error Adding User:', error);
        res.status(500).send('Internal Server Error');
      });
  });
  
  app.get('/editUser/:UserID', (req, res) => {
    let UserID = req.params.UserID;
    // Query the Pokémon by ID first
    knex('Admin')
      .where('UserID', UserID)
      .first()
      .then(Admin => {
        if (!Admin) {
          return res.status(404).send('User not found');
        }
        res.render('editUser', { Admin });
      })
      .catch(error => {
        console.error('Error fetching User for editing:', error);
        res.status(500).send('Internal Server Error');
      });
  });


app.post('/editUser/:UserID', (req, res) => {
    const UserID = req.params.UserID;
    const Username = req.body.Username;
    const Password = req.body.Password;
    const AdminFirstName = req.body.AdminFirstName.toUpperCase();
    const AdminLastName = req.body.AdminLastName.toUpperCase();
    knex('Admin')
      .where('UserID', UserID)
      .update({
        Username: Username,
        Password: Password,
        AdminFirstName: AdminFirstName,
        AdminLastName: AdminLastName,
      })
      .then(() => {
        res.redirect('/viewUser');
      })
      .catch(error => {
        console.error('Error updating Users:', error);
        res.status(500).send('Internal Server Error');
      });
  });

  app.post('/deleteUser/:UserID', (req, res) => {
    const UserID = req.params.UserID;
    knex('Admin')
      .where('UserID', UserID)
      .del() // Deletes the record with the specified ID
      .then(() => {
        res.redirect('/viewUser'); // Redirect to the Pokémon list after deletion
      })
      .catch(error => {
        console.error('Error deleting User:', error);
        res.status(500).send('Internal Server Error');
      });
  });

  app.get('/viewVolunteer', (req, res) => {
    knex('Volunteer')
      .join('Referral','Volunteer.ReferralID', '=', 'Referral.ReferralID')
      .select(
        'Volunteer.VolunteerID',
        'Volunteer.VolFirstName',
        'Volunteer.VolLastName',
        'Volunteer.Phone',
        'Volunteer.Email',
        'Volunteer.VolCity',
        'Volunteer.VolCounty',
        'Volunteer.VolState',
        'Volunteer.SewingLevel',
        'Volunteer.HoursPerMonth',
        'Referral.ReferralName'
      )
      .then(Volunteer => {
        // Render the index.ejs template and pass the data
        res.render('viewVolunteer', { Volunteer });
      })
      .catch(error => {
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
      });
  });

  app.get('/editVolunteer/:VolunteerID', (req, res) => {
    const VolunteerID = req.params.VolunteerID;
    // Fetch both tables separately
    Promise.all([
        knex('Volunteer').where('VolunteerID', VolunteerID).first(), // Get the specific volunteer
        knex('Referral').select('ReferralID', 'ReferralName') // Get all referrals
    ])
    .then(([Volunteer, Referral]) => {
        if (!Volunteer) {
            return res.status(404).send('Volunteer not found');
        }
        // Render the editVolunteer page with both Volunteer and Referrals data
        res.render('editVolunteer', { Volunteer, Referral });
    })
    .catch(error => {
        console.error('Error fetching data for editing Volunteer:', error);
        res.status(500).send('Internal Server Error');
    });
});

app.post('/editVolunteer/:VolunteerID', (req, res) => {
  const VolunteerID = req.params.VolunteerID;
  const VolFirstName = req.body.VolFirstName.toUpperCase();
  const VolLastName = req.body.VolLastName.toUpperCase();
  const Phone = req.body.Phone;
  const Email = req.body.Email;
  const VolCity = req.body.VolCity.toUpperCase();
  const VolCounty = req.body.VolCounty.toUpperCase();
  const VolState = req.body.VolState.toUpperCase();
  const ReferralID = parseInt(req.body.ReferralID);
  const SewingLevel = req.body.SewingLevel;
  const HoursPerMonth = parseInt(req.body.HoursPerMonth);

  knex('Volunteer')
    .where('VolunteerID', VolunteerID) // Fix identifier
    .update({
      VolFirstName: VolFirstName,
      VolLastName: VolLastName,
      Phone: Phone,
      Email: Email,
      VolCity: VolCity,
      VolCounty: VolCounty,
      VolState: VolState,
      ReferralID: ReferralID,
      SewingLevel: SewingLevel,
      HoursPerMonth: HoursPerMonth,
    })
    .then(() => {
      res.redirect('/viewVolunteer');
    })
    .catch(error => {
      console.error('Error updating Volunteer:', error);
      res.status(500).send('Internal Server Error');
    });
});

  app.post('/deleteVolunteer/:VolunteerID', (req, res) => {
    const VolunteerID = req.params.VolunteerID;
    knex('Volunteer')
      .where('VolunteerID', VolunteerID)
      .del() // Deletes the record with the specified ID
      .then(() => {
        res.redirect('/viewVolunteer');
      })
      .catch(error => {
        console.error('Error deleting Volunteer:', error);
        res.status(500).send('Internal Server Error');
      });
  });



  // Add Newsletter Loading and Posting
  app.get("/addNewsletter", (req,res) => res.render("addNewsletter", {data: "Newsletter"})) 

  // loading the info into the database
  app.post('/addNewsletter', (req, res) => {
      // Access each value directly from req.body
      const NewsletterID = req.params.NewsletterID;
      const NewsletterEmail = req.body.NewsletterEmail || '';
      knex('Newsletter')
        .insert({
          NewsletterEmail : NewsletterEmail,
        })
        .then(() => {
          res.redirect('/');
        })
        .catch(error => {
          console.error('Error Adding Email:', error);
          res.status(500).send('Internal Server Error');
        });
    });
  
    app.get('/viewNewsletter', (req, res) => {
      knex('Newsletter')
        .select(
          'NewsletterID',
          'NewsletterEmail'
        )
        .then(Newsletter => {
          // Render the index.ejs template and pass the data
          res.render('viewNewsletter', { Newsletter });
        })
        .catch(error => {
          console.error('Error querying database:', error);
          res.status(500).send('Internal Server Error');
        });
    });

    app.post('/deleteNewsletter/:NewsletterID', (req, res) => {
      const NewsletterID = req.params.NewsletterID;
      knex('Newsletter')
        .where('NewsletterID', NewsletterID)
        .del() // Deletes the record with the specified ID
        .then(() => {
          res.redirect('/viewNewsletter'); // Redirect to the newsletter list after deletion
        })
        .catch(error => {
          console.error('Error deleting Email:', error);
          res.status(500).send('Internal Server Error');
        });
    });
    

app.listen(3000, () => console.log('server started'));