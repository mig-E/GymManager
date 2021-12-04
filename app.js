// App.js

/*
    SETUP
*/
var express = require('express');   // We are using the express library for the web server
// var session = require('express-session');
var app     = express();            // We need to instantiate an express object to interact with the server in our code
PORT        = 31313;                 // Set a port number at the top so it's easy to change in the future

var path = require('path')
var bodyParser = require('body-parser');
var db = require('./database/dbcon');

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Setting up express handlebars
const { engine } = require('express-handlebars');
var exphbs = require('express-handlebars'); 
const { isContext } = require('vm');
const { devNull } = require('os');
const { query } = require('express');
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');

// app.use('/trainers', require('./trainers.js')); <== not working

// Query statements:
/*
- Make some functions/strings for the query statements.
- Figure the equivalent to *args in javascript
*/


/*
    ROUTES
*/
// app.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname, 'views/index.html'));
// });

app.get('/', function(req, res) {
    res.render('index');
});



// Get all members currently stored in the database
app.get('/members', (req, res, next) => {

    if (req.query.memberID) {
        var query = 'SELECT * FROM members WHERE member_id=(?);'
        db.pool.query(query, [req.query.memberID], (err, rows) => {
            if (err) {
                next(err);
                return;
            } else {
                res.render('members', {data: rows})
            }
        })

    } else {
        // create a list of keys from the trainer table
        let trainerKeys = [null]
        var trainerIDs = 'SELECT trainer_id, f_name, l_name FROM trainers;'
        var getMems = 'SELECT * FROM members;'

        db.pool.query(trainerIDs, (err, rows) => {
            for (const row of rows) {
                trainerKeys.push(row.trainer_id)
            }
            db.pool.query(getMems, function(err, rows, fields){
                // res.send(JSON.stringify(results));
                // console.log(trainerKeys)
                // console.log("That was the trainerkeys")
                // console.log(rows);
                res.render('members', {
                    key: trainerKeys,
                    data: rows
                });
            })
        })
    
        // getMems = 'SELECT * FROM members;'

        // db.pool.query(getMems, function(err, rows, fields){
        //     // res.send(JSON.stringify(results));
        //     console.log(rows);
        //     res.render('members', {data: rows});
        // })
    }
});
//Update into members
app.put('/members', (req, res, next) => {
    console.log(req.query);
    console.log('firing');

    var updateClasses = `UPDATE members SET f_name=?, l_name=?, trainer_id=? WHERE member_id=?;`
    db.pool.query(updateClasses, [req.query.updatedfname, req.query.updatedlname, req.query.updatedtrainer, req.query.memberID], function(err, rows) {
        if (err) {
            next(err);
            return;
        }
        res.redirect('/members');
    })
    
});

// Insert to the members table
app.post('/members', (req, res, next) => {
    const mem_id = req.query.id;
    let {fname, lname, trainer_id} = req.body;  // used let in case trainer_id needs to be changed
    
    // used to ensure that a null value is inserted in case of no trainer for member
    if (!trainer_id) {
        trainer_id = null;
    }

    var insQ = `INSERT INTO members(f_name, l_name, trainer_id) VALUES (?, ?, ?)`
    db.pool.query(insQ, [fname, lname, trainer_id], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        res.redirect('/members');
    })
});

// Delete from the members table
app.delete('/members', (req, res, next) => {
    // DELETE MEMBER FROM ENROLLMENT IF THEY ARE THERE, THEN DELETE FROM MEMBERS
    var enrllQry = 'DELETE FROM enrollments WHERE member_id=(?)'
    db.pool.query(enrllQry, [req.query.id], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        console.log("REMOVED FROM ENROLLMENT")
    })

    // DELETES PAYMENT CARD INFO IN EVENT MEMBER IS DELETED FROM DB
    var delCard = 'DELETE FROM payment_cards WHERE member_id=(?)'
    db.pool.query(delCard, [req.query.id], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        console.log("PAYMENT INFO DELETED")
    })


    var delQuery = 'DELETE FROM members WHERE member_id=(?);';
    db.pool.query(delQuery, [req.query.id], (err, rows) => {
        if (err) {
            next(err);
            return;
        }

        // CHECK TO SEE IF MEMBER IN ENROLLMENT TABLE, THEN DELETE THAT FIRST BEFORE DELETE
    })
});

// Payment Card ---------------------------------------------------------->

// Get current payment card table and memberID to add to table
app.get('/paymentinfo', (req, res, next) => {

    if (req.query.paymentCardID) {
        var query = 'SELECT * FROM payment_cards WHERE payment_card_id=(?);'
        db.pool.query(query, [req.query.paymentCardID], (err, rows) => {
            if (err) {
                next(err);
                return;
            } else {
                res.render('paymentinfo', {data: rows})
            }
        })
    } else {
        var memIDs = 'SELECT * FROM members;'
        var query = 'SELECT * FROM payment_cards;'

        db.pool.query(memIDs, function(err, members, fields) {
            if(err) {
                next(err);
                return;
            }
            db.pool.query(query, function(err, cards, fields) {
                if (err) {
                    next(err);
                    return;
                }
                res.render('paymentinfo', {
                    member: members,
                    card: cards
                })
            })
        })

    }
})

// Insert into payment cards
app.post('/paymentinfo', (req, res, next) => {
    const {member_id, cardnumber} = req.body;
    var insQ = `INSERT INTO payment_cards (member_id, card_number) VALUES (?, ?)`
    db.pool.query(insQ, [member_id, cardnumber], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        console.log(req.body)
        res.redirect('/paymentinfo');
    })
})

// Update trainer
app.put('/paymentinfo', (req, res, next) => {
    console.log(req.query);


    // const trainerId = req.query.id;
    // const {fname, lname} = req.query;
    var updateCard= `UPDATE payment_cards SET member_id=?, card_number=? WHERE payment_card_id=?;`
    db.pool.query(updateCard, [req.query.updatedmember, req.query.updatedcard, req.query.paymentCardID], function(err, rows) {
        if (err) {
            next(err);
            return;
        }
        res.redirect('/paymentinfo')
    })
    
});

// Delete payment card
app.delete('/paymentinfo', (req, res, next) => {
    const delQuery = 'DELETE FROM payment_cards WHERE payment_card_id=(?);';
    db.pool.query(delQuery, [req.query.id], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
    })
});



// Enrollment ------------------------------------------------------------>

// Get all enrollment info
app.get('/enrollment', (req, res, next) => {

    if (req.query.enrollmentID) {
        var query = 'SELECT * FROM enrollments WHERE enrollment_id=(?);'
        db.pool.query(query, [req.query.enrollmentID], (err, rows) => {
            if (err) {
                next(err);
                return;
            } else {
                res.render('enrollment', {data: rows})
            }
        })

    } else {

        // https://stackoverflow.com/questions/60234298/selecting-from-2-tables-at-one-time-in-node-js <-- used to figure out how to do multiple SQL calls to access data for dropdown + table

        // get member IDs for the dropdown
        var memQuery = 'SELECT * FROM members;'
        var classQuery = 'SELECT * FROM classes;'
        var query = 'SELECT * FROM enrollments;'

        db.pool.query(memQuery, function(err, members, fields) {
            if (err) {
                next(err);
                return;
            }
            db.pool.query(classQuery, function(err, classes, fields) {
                if (err) {
                    next(err);
                    return;
                }
                db.pool.query(query, function(err, rows, fields) {
                    if (err) {
                        next(err);
                        return;
                    }
                    res.render('enrollment', {
                        member: members,
                        class: classes,
                        data: rows
                    })
                })
            })
            console.log("GETTING MEMBERS FOR DROPDOWN");
        })
    }
})

// Delete enrollment
app.delete('/enrollment', (req, res, next) => {
    const delQuery = 'DELETE FROM enrollments WHERE enrollment_id=(?);';
    db.pool.query(delQuery, [req.query.id], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
    })
});

// Insert into enrollments
app.post('/enrollment', (req, res, next) => {
    const {member_id, class_id} = req.body;
    console.log(req.body);
    var insQ = `INSERT INTO enrollments (member_id, class_id) VALUES (?, ?)`;
    db.pool.query(insQ, [member_id, class_id], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        // console.log(req.body.fname + " has been added to database");
        // res.send(JSON.stringify(context));
        res.redirect('/enrollment');
    });
});

//Update into enrollment
app.put('/enrollment', (req, res, next) => {
    console.log(req.query);
    console.log(req.query.updatedmember)
    console.log(req.query.updatedclass)
    console.log(req.query.enrollmentsID)
    console.log('firing');
    
    var updateClasses = `UPDATE enrollments SET member_id=?, class_id=? WHERE enrollment_id=?;`
    db.pool.query(updateClasses, [req.query.updatedmember, req.query.updatedclass, req.query.enrollmentsID], function(err, rows) {
        if (err) {
            next(err);
            return;
        }
        res.redirect('/enrollment');
    })
    
});

// Insert into trainers
app.post('/trainers', (req, res, next) => {
    const {fname, lname} = req.body;
    var insQ = `INSERT INTO trainers (f_name, l_name) VALUES (?, ?)`
    db.pool.query(insQ, [fname, lname], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        // console.log(req.body.fname + " has been added to database");
        // res.send(JSON.stringify(context));
        res.redirect('/trainers');
    })
});

// Update trainer
app.put('/trainers', (req, res, next) => {
    console.log(req.query);


    // const trainerId = req.query.id;
    // const {fname, lname} = req.query;
    var updateTrainer = `UPDATE trainers SET f_name=?, l_name=? WHERE trainer_id=?;`
    db.pool.query(updateTrainer, [req.query.updatedfname, req.query.updatedlname, req.query.trainerID], function(err, rows) {
        if (err) {
            next(err);
            return;
        }
        res.redirect('/trainers')
    })
    
});

// Get all trainers
app.get('/trainers', (req, res, next) => {
    if (req.query.trainerID) {
        var query = 'SELECT * FROM trainers WHERE trainer_id=(?);'
        db.pool.query(query, [req.query.trainerID], (err, rows) => {
            if (err) {
                next(err);
                return;
            } else {
                res.render('trainers', {data: rows})
            }
        })

    } else {
        var query = 'SELECT * FROM trainers;'

        db.pool.query(query, function(err, rows, fields){
            res.render('trainers', {data: rows})
        })
    }
    

   
})

// Delete trainer
app.delete('/trainers', (req, res, next) => {
    var delQuery = 'DELETE FROM trainers WHERE trainer_id=(?);';
    db.pool.query(delQuery, [req.query.id], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
    })
});

// Update trainer
// Get the information for the update
app.get('/trainerupdate/:id', (req, res) => {
    const trainerId = req.params.id;
    var getQry = `SELECT * FROM trainers WHERE trainer_id=${trainerId}`
    db.pool.query(getQry, function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        console.log("HERE WE ARE")
        res.render(`trainers`, {data: rows})
    }) 
    });

/* Conduct the update
 (Had to sample my code from 290 to get this working on front end) - lugomi
 */
// app.put('/trainerupdate/:id', (req, res, next) => {
//     const context = {};
//     const trainerId = req.query.id;
//     const {fname, lname} = req.query;
//     const updateTrainer = `UPDATE trainers SET f_name=?, l_name=? WHERE trainer_id=?;`
//     db.pool.query(updateTrainer, [fname, lname, trainerId], function(err, rows) {
//         if (err) {
//             next(err);
//             return;
//         }
//         res.redirect('/trainers')
//     })
// })

/* 
Should be the search by last name for trainers. Cannot currently get it work with last 
name so going to have to do it with trainer_id for now.
*/

// app.get('/trainersearch/:lname', (req, res, next) => {
//     const lname = req.params.lname;
//     const getQry = `SELECT * FROM trainers WHERE l_name=${lname}`
//     db.pool.query(getQry, function(err, rows, fields) {
//         if (err) {
//             next(err)
//             return;
//         }
//         console.log(`SEARCHING FOR: ${lname}`)
//         res.render('trainersearch', {data: rows})
//     })

// })


// Search by ID
app.get('/trainersearch/:id', (req, res, next) => {
    const trainerId = req.params.id;
    var getQry = `SELECT * FROM trainers WHERE trainer_id=${trainerId}`
    db.pool.query(getQry, function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        console.log("HERE WE ARE")
        res.render(`trainersearch/${trainerId}`, {data: rows})
    }) 
    });

// Classes ------------------------------------------------------------>

// Get all classes
app.get('/classes', (req, res, next) => {

    if (req.query.classID) {
        var query = 'SELECT * FROM classes WHERE class_id=(?);'
        db.pool.query(query, [req.query.classID], (err, rows) => {
            if (err) {
                next(err);
                return;
            } else {
                res.render('classes', {data: rows})
            }
        })

    } else {

    var query = 'SELECT * FROM classes;'

    db.pool.query(query, function(err, rows, fiels){
        res.render('classes', {data: rows})
    })

}
})

//Post class
app.post('/classes', (req, res, next) => {
    console.log(req.body);
    // const {class, signed_up, capacity} = req.body;

    var insQ = `INSERT INTO classes (class_name, num_signed_up, capacity) VALUES (?, ?, ?)`
    db.pool.query(insQ, [req.body.class, req.body.capacity, req.body.signed_up], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        // console.log(req.body.fname + " has been added to database");
        // res.send(JSON.stringify(context));
        res.redirect('/classes');
    })
});


//Insert into classes
app.put('/classes', (req, res, next) => {
    console.log(req.query);


    
    var updateClasses = `UPDATE classes SET class_name=?, num_signed_up=?, capacity=? WHERE class_id=?;`
    db.pool.query(updateClasses, [req.query.updatedclasses, req.query.updatedcapacity, req.query.updatednumsignedup, req.query.classID], function(err, rows) {
        if (err) {
            next(err);
            return;
        }
        res.redirect('/classes')
    })
    
});

//delete class
app.delete('/classes', (req, res, next) => {
    var delQuery = 'DELETE FROM classes WHERE class_id=(?);';
    db.pool.query(delQuery, [req.query.id], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
    })
});

/*
    LISTENER
*/
app.listen(PORT, function(){            // This is the basic syntax for what is called the 'listener' which receives incoming requests on the specified PORT.
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});